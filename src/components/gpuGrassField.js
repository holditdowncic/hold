import * as THREE from "three/webgpu";
import {
  Fn,
  uniform,
  float,
  vec3,
  instancedArray,
  instanceIndex,
  uv,
  positionGeometry,
  positionWorld,
  sin,
  cos,
  pow,
  smoothstep,
  mix,
  sqrt,
  select,
  hash,
  time,
  deltaTime,
  PI,
  mx_noise_float,
} from "three/tsl";

function createBladeGeometry() {
  const segments = 5;
  const width = 0.055;
  const height = 1;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    const halfWidth = width * 0.5 * (1 - t * 0.82);

    vertices.push(-halfWidth, y, 0, halfWidth, y, 0);
    normals.push(0, 0, 1, 0, 0, 1);
    uvs.push(0, t, 1, t);
  }

  for (let i = 0; i < segments; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

export function createGpuGrassField({
  bladeCount = 80000,
  fieldSize = 18,
  backgroundHex = "#b1a87b",
  groundHex = "#504a30",
  bladeBaseHex = "#252d0b",
  bladeTipHex = "#97d638",
} = {}) {
  const root = new THREE.Group();
  const gridWidth = Math.ceil(Math.sqrt(bladeCount));

  const bladeData = instancedArray(bladeCount, "vec4");
  const bendState = instancedArray(bladeCount, "vec4");
  const bladeBound = instancedArray(bladeCount, "float");

  const mouseWorld = uniform(new THREE.Vector3(99999, 0, 99999));
  const mouseRadius = uniform(2.2);
  const mouseStrength = uniform(1.8);
  const icoWorld = uniform(new THREE.Vector3(99999, 0, 99999));
  const icoRadius = uniform(0.01);
  const icoStrength = uniform(0.0);

  const grassDensity = uniform(1.28);
  const windSpeed = uniform(1.8);
  const windAmplitude = uniform(0.2);
  const bladeWidth = uniform(1.55);
  const bladeHeight = uniform(0.66);
  const bladeLean = uniform(1.08);
  const noiseAmplitude = uniform(1.85);
  const noiseFrequency = uniform(0.3);
  const noise2Amplitude = uniform(0.2);
  const noise2Frequency = uniform(15);
  const bladeColorVariation = uniform(0.93);
  const bladeGradientFalloff = uniform(1.7);
  const groundRadius = uniform(fieldSize * 0.46);
  const groundFalloff = uniform(1.45);
  const bladeBaseColor = uniform(new THREE.Color(bladeBaseHex));
  const bladeTipColor = uniform(new THREE.Color(bladeTipHex));
  const backgroundColor = uniform(new THREE.Color(backgroundHex));
  const groundColor = uniform(new THREE.Color(groundHex));

  const noise2D = (x, z) => {
    return mx_noise_float(vec3(x, float(0), z)).mul(0.5).add(0.5);
  };

  const computeInit = Fn(() => {
    const blade = bladeData.element(instanceIndex);

    const column = instanceIndex.mod(gridWidth);
    const row = instanceIndex.div(gridWidth);
    const jitterX = hash(instanceIndex).sub(0.5);
    const jitterZ = hash(instanceIndex.add(7919)).sub(0.5);

    const wx = column.toFloat().add(jitterX).div(float(gridWidth)).sub(0.5).mul(fieldSize);
    const wz = row.toFloat().add(jitterZ).div(float(gridWidth)).sub(0.5).mul(fieldSize);

    blade.x.assign(wx);
    blade.y.assign(wz);
    blade.z.assign(hash(instanceIndex.add(1337)).mul(PI.mul(2)));

    const n1 = noise2D(wx.mul(noiseFrequency), wz.mul(noiseFrequency));
    const n2 = noise2D(
      wx.mul(noiseFrequency.mul(noise2Frequency)).add(50),
      wz.mul(noiseFrequency.mul(noise2Frequency)).add(50),
    );
    const clump = n1.mul(noiseAmplitude).sub(noise2Amplitude).add(n2.mul(noise2Amplitude).mul(2)).max(0);
    blade.w.assign(clump);

    const distance = sqrt(wx.mul(wx).add(wz.mul(wz)));
    const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
    const maxRadius = float(fieldSize * 0.42).add(edgeNoise.sub(0.5).mul(fieldSize * 0.2));
    const boundary = float(1).sub(smoothstep(maxRadius.sub(1.5), maxRadius, distance));
    bladeBound.element(instanceIndex).assign(select(boundary.lessThan(0.05), float(0), boundary));
  })().compute(bladeCount);

  const computeUpdate = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const bend = bendState.element(instanceIndex);

    const bx = blade.x;
    const bz = blade.y;

    const w1 = sin(bx.mul(0.35).add(bz.mul(0.12)).add(time.mul(windSpeed)));
    const w2 = sin(bx.mul(0.18).add(bz.mul(0.28)).add(time.mul(windSpeed.mul(0.67))).add(1.7));
    const windX = w1.add(w2).mul(windAmplitude);
    const windZ = w1.sub(w2).mul(windAmplitude.mul(0.55));

    const windLerp = deltaTime.mul(4).saturate();
    bend.x.assign(mix(bend.x, windX, windLerp));
    bend.y.assign(mix(bend.y, windZ, windLerp));

    const dx = bx.sub(mouseWorld.x);
    const dz = bz.sub(mouseWorld.z);
    const distance = sqrt(dx.mul(dx).add(dz.mul(dz))).add(0.0001);
    const falloff = float(1).sub(distance.div(mouseRadius).saturate());
    const influence = falloff.mul(falloff).mul(mouseStrength);
    const pushX = dx.div(distance).mul(influence);
    const pushZ = dz.div(distance).mul(influence);

    const icoDx = bx.sub(icoWorld.x);
    const icoDz = bz.sub(icoWorld.z);
    const icoDistance = sqrt(icoDx.mul(icoDx).add(icoDz.mul(icoDz))).add(0.0001);
    const icoFalloff = float(1).sub(icoDistance.div(icoRadius).saturate());
    const icoInfluence = icoFalloff.mul(icoFalloff).mul(icoStrength);
    const totalPushX = pushX.add(icoDx.div(icoDistance).mul(icoInfluence));
    const totalPushZ = pushZ.add(icoDz.div(icoDistance).mul(icoInfluence));

    const targetMagnitude = sqrt(totalPushX.mul(totalPushX).add(totalPushZ.mul(totalPushZ)));
    const currentMagnitude = sqrt(bend.z.mul(bend.z).add(bend.w.mul(bend.w)));
    const pushLerp = select(
      targetMagnitude.greaterThan(currentMagnitude),
      deltaTime.mul(12),
      deltaTime.mul(1),
    ).saturate();
    bend.z.assign(mix(bend.z, totalPushX, pushLerp));
    bend.w.assign(mix(bend.w, totalPushZ, pushLerp));
  })().compute(bladeCount);

  const grassMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  grassMaterial.positionNode = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const bend = bendState.element(instanceIndex);

    const worldX = blade.x;
    const worldZ = blade.y;
    const rotationY = blade.z;
    const boundary = bladeBound.element(instanceIndex);
    const visible = select(hash(instanceIndex.add(9999)).lessThan(grassDensity.mul(0.5)), float(1), float(0));
    const heightScale = float(0.35).add(blade.w).mul(boundary).mul(visible);

    const localX = positionGeometry.x.mul(bladeWidth).mul(heightScale.sign());
    const localY = positionGeometry.y.mul(heightScale).mul(bladeHeight);

    const cosY = cos(rotationY);
    const sinY = sin(rotationY);
    const rotatedX = localX.mul(cosY);
    const rotatedZ = localX.mul(sinY);

    const t = uv().y;
    const bendFactor = pow(t, 1.8);
    const staticBendX = hash(instanceIndex.add(7777)).sub(0.5).mul(bladeLean);
    const staticBendZ = hash(instanceIndex.add(8888)).sub(0.5).mul(bladeLean);
    const bendX = staticBendX.add(bend.x).add(bend.z);
    const bendZ = staticBendZ.add(bend.y).add(bend.w);

    const relativeX = rotatedX.add(bendX.mul(bendFactor).mul(bladeHeight));
    const relativeY = localY;
    const relativeZ = rotatedZ.add(bendZ.mul(bendFactor).mul(bladeHeight));
    const originalLength = sqrt(rotatedX.mul(rotatedX).add(localY.mul(localY)).add(rotatedZ.mul(rotatedZ)));
    const bentLength = sqrt(relativeX.mul(relativeX).add(relativeY.mul(relativeY)).add(relativeZ.mul(relativeZ)));
    const scale = originalLength.div(bentLength.max(0.0001));

    return vec3(worldX.add(relativeX.mul(scale)), relativeY.mul(scale), worldZ.add(relativeZ.mul(scale)));
  })();

  grassMaterial.colorNode = Fn(() => {
    const t = uv().y;
    const clump = bladeData.element(instanceIndex).w.saturate();
    const gradient = pow(t, bladeGradientFalloff);
    const tipMix = float(1).sub(bladeColorVariation).add(clump.mul(bladeColorVariation));
    const variedTip = mix(bladeBaseColor, bladeTipColor, tipMix);
    return mix(bladeBaseColor, variedTip, gradient);
  })();
  grassMaterial.opacityNode = smoothstep(float(0), float(0.1), uv().y);
  grassMaterial.transparent = true;

  const bladeGeometry = createBladeGeometry();
  const grass = new THREE.InstancedMesh(bladeGeometry, grassMaterial, bladeCount);
  grass.frustumCulled = false;
  root.add(grass);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < bladeCount; i++) grass.setMatrixAt(i, dummy.matrix);
  grass.instanceMatrix.needsUpdate = true;

  const groundMaterial = new THREE.MeshBasicNodeMaterial();
  groundMaterial.colorNode = Fn(() => {
    const wx = positionWorld.x;
    const wz = positionWorld.z;
    const distance = sqrt(wx.mul(wx).add(wz.mul(wz)));
    const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
    const maxRadius = groundRadius.add(edgeNoise.sub(0.5).mul(fieldSize * 0.2));
    const blend = smoothstep(maxRadius.sub(groundFalloff), maxRadius, distance);
    return mix(groundColor, backgroundColor, blend);
  })();

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(fieldSize * 5, fieldSize * 5), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const raycaster = new THREE.Raycaster();
  const mouseNdc = new THREE.Vector2();
  const grassPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();

  return {
    root,
    async init(renderer) {
      await renderer.computeAsync(computeInit);
    },
    update(renderer) {
      renderer.compute(computeUpdate);
    },
    setMouseFromEvent(event, camera, canvas) {
      const rect = canvas.getBoundingClientRect();
      mouseNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      grassPlane.constant = -root.position.y;
      raycaster.setFromCamera(mouseNdc, camera);
      if (raycaster.ray.intersectPlane(grassPlane, hitPoint)) {
        mouseWorld.value.copy(hitPoint);
      }
    },
    clearMouse() {
      mouseWorld.value.set(99999, 0, 99999);
    },
    dispose() {
      bladeGeometry.dispose();
      grassMaterial.dispose();
      ground.geometry.dispose();
      groundMaterial.dispose();
    },
  };
}
