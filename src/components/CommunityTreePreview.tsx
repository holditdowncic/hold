"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { createGpuGrassField } from "./gpuGrassField";

type Thought = {
  id: string;
  name: string;
  message: string;
  color: string;
};

const approvedSeed: Thought[] = [
  {
    id: "a1",
    name: "Aaliyah",
    message: "More safe spaces where young people can talk honestly.",
    color: "#b7e07b",
  },
  {
    id: "a2",
    name: "Marcus",
    message: "Keep building things fathers and children can do together.",
    color: "#f2c94c",
  },
  {
    id: "a3",
    name: "Nadine",
    message: "Music, food, sport, and elders sharing stories.",
    color: "#77d7c2",
  },
  {
    id: "a4",
    name: "Junior",
    message: "A youth media club would be powerful.",
    color: "#c8a2f8",
  },
  {
    id: "a5",
    name: "Kemi",
    message: "Let families leave messages for the next generation.",
    color: "#ff9f80",
  },
];

const pendingSeed: Thought[] = [
  {
    id: "p1",
    name: "Visitor",
    message: "Can we have more mentoring days after school?",
    color: "#b7e07b",
  },
  {
    id: "p2",
    name: "Parent",
    message: "A dads and daughters activity day would be lovely.",
    color: "#f2c94c",
  },
];

const palette = ["#b7e07b", "#f2c94c", "#77d7c2", "#c8a2f8", "#ff9f80", "#8fd3ff"];

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]*$/, "")}...`;
  }

  return lines;
}

function makeThoughtTexture(thought: Thought) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = "rgba(15, 11, 25, 0.28)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  roundedRect(ctx, 28, 28, 712, 200, 44);
  ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 5;
  ctx.strokeStyle = thought.color;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(84, 92, 22, 0, Math.PI * 2);
  ctx.fillStyle = thought.color;
  ctx.fill();

  ctx.fillStyle = "#1a1525";
  ctx.font = "700 34px Inter, Arial, sans-serif";
  ctx.fillText(thought.name, 124, 103);

  ctx.fillStyle = "rgba(26, 21, 37, 0.72)";
  ctx.font = "500 31px Inter, Arial, sans-serif";
  const lines = wrapText(ctx, thought.message, 620, 2);
  lines.forEach((line, index) => {
    ctx.fillText(line, 84, 156 + index * 38);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function branchBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius * 0.62, radius, length, 14, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.46);
  shape.bezierCurveTo(0.34, 0.28, 0.34, -0.22, 0, -0.46);
  shape.bezierCurveTo(-0.34, -0.22, -0.34, 0.28, 0, 0.46);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  geometry.center();
  return geometry;
}

export function buildTree(sceneRoot: THREE.Group) {
  const bark = new THREE.MeshStandardMaterial({
    color: "#6d4324",
    roughness: 0.86,
    metalness: 0.02,
  });
  const barkDark = new THREE.MeshStandardMaterial({
    color: "#442817",
    roughness: 0.92,
  });
  const barkWarm = new THREE.MeshStandardMaterial({
    color: "#8a5b30",
    roughness: 0.8,
  });

  const trunkSegments = [
    { start: new THREE.Vector3(0, -1.2, 0), end: new THREE.Vector3(-0.1, 0.45, 0.05), radius: 0.62 },
    { start: new THREE.Vector3(-0.1, 0.35, 0.05), end: new THREE.Vector3(0.18, 1.95, -0.08), radius: 0.47 },
    { start: new THREE.Vector3(0.18, 1.82, -0.08), end: new THREE.Vector3(-0.08, 3.35, 0.04), radius: 0.34 },
    { start: new THREE.Vector3(-0.08, 3.2, 0.04), end: new THREE.Vector3(0.08, 4.38, -0.02), radius: 0.22 },
    { start: new THREE.Vector3(0.08, 4.26, -0.02), end: new THREE.Vector3(0.0, 5.02, 0), radius: 0.13 },
  ];

  trunkSegments.forEach((segment, index) => {
    sceneRoot.add(branchBetween(segment.start, segment.end, segment.radius, index % 2 ? barkWarm : bark));
  });

  const tips: THREE.Vector3[] = [];

  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + 0.18;
    const rootStart = new THREE.Vector3(Math.cos(angle) * 0.18, -1.08, Math.sin(angle) * 0.16);
    const rootEnd = new THREE.Vector3(Math.cos(angle) * (1.25 + (i % 4) * 0.2), -1.22, Math.sin(angle) * (0.82 + (i % 3) * 0.13));
    sceneRoot.add(branchBetween(rootStart, rootEnd, 0.11 - (i % 3) * 0.012, i % 2 ? barkDark : barkWarm));
  }

  const branchStarts = [
    { origin: new THREE.Vector3(0.1, 1.85, -0.04), count: 5, lift: 1.0, reach: 1.8 },
    { origin: new THREE.Vector3(-0.02, 2.35, 0.02), count: 6, lift: 1.1, reach: 2.22 },
    { origin: new THREE.Vector3(0.08, 2.95, -0.02), count: 7, lift: 1.0, reach: 2.55 },
    { origin: new THREE.Vector3(-0.02, 3.55, 0.03), count: 8, lift: 0.85, reach: 2.82 },
    { origin: new THREE.Vector3(0.04, 4.08, -0.02), count: 7, lift: 0.65, reach: 2.38 },
  ];

  branchStarts.forEach(({ origin, count, lift, reach }, level) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + level * 0.42;
      const branchReach = reach + (i % 2) * 0.28 - level * 0.03;
      const end = new THREE.Vector3(
        Math.cos(angle) * branchReach,
        origin.y + lift + Math.sin(i * 1.7) * 0.18,
        Math.sin(angle) * branchReach * 0.68,
      );
      sceneRoot.add(branchBetween(origin, end, 0.18 - level * 0.02, level % 2 ? barkDark : barkWarm));
      tips.push(end);

      const splitA = new THREE.Vector3(
        end.x + Math.cos(angle + 0.38) * 0.74,
        end.y + 0.24 + level * 0.03,
        end.z + Math.sin(angle + 0.38) * 0.42,
      );
      const splitB = new THREE.Vector3(
        end.x + Math.cos(angle - 0.48) * 0.62,
        end.y + 0.18,
        end.z + Math.sin(angle - 0.48) * 0.36,
      );
      sceneRoot.add(branchBetween(end, splitA, 0.07, bark));
      sceneRoot.add(branchBetween(end, splitB, 0.058, barkDark));
      tips.push(splitA, splitB);
    }
  });

  const leafGeometry = makeLeafGeometry();
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: "#2f6f3d", roughness: 0.68, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: "#3f8a48", roughness: 0.7, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: "#5fa24b", roughness: 0.68, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: "#7fbd5a", roughness: 0.66, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: "#9ccd68", roughness: 0.7, side: THREE.DoubleSide }),
  ];

  for (let i = 0; i < 760; i++) {
    const angle = i * 2.399963229728653;
    const band = (i % 59) / 59;
    const crown = Math.sin(band * Math.PI);
    const radius = 0.58 + crown * 3.05 + ((i * 37) % 100) / 100 * 0.78;
    const y = 2.36 + band * 2.96 + Math.sin(i * 0.71) * 0.3;
    const zDepth = 0.52 + ((i * 17) % 100) / 100 * 0.28;
    const leaf = new THREE.Mesh(leafGeometry, leafMaterials[i % leafMaterials.length]);
    leaf.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius * zDepth,
    );
    leaf.scale.setScalar(0.22 + (i % 6) * 0.018);
    leaf.rotation.set(0.65 + (i % 5) * 0.13, angle + Math.PI / 2, Math.sin(i) * 0.45);
    leaf.userData.phase = i * 0.13;
    leaf.userData.kind = "leaf";
    leaf.userData.revealAt = 0.22 + (((i * 37) % 100) / 100) * 0.74;
    leaf.castShadow = true;
    sceneRoot.add(leaf);
  }

  tips.forEach((tip, tipIndex) => {
    for (let i = 0; i < 10; i++) {
      const angle = tipIndex * 1.618 + i * 0.82;
      const radius = 0.22 + (i % 4) * 0.11;
      const leaf = new THREE.Mesh(leafGeometry, leafMaterials[(tipIndex + i) % leafMaterials.length]);
      leaf.position.set(
        tip.x + Math.cos(angle) * radius,
        tip.y + Math.sin(i * 0.9) * 0.28,
        tip.z + Math.sin(angle) * radius * 0.72,
      );
      leaf.scale.setScalar(0.24 + (i % 5) * 0.016);
      leaf.rotation.set(0.72 + (i % 4) * 0.14, angle + Math.PI / 2, Math.sin(tipIndex + i) * 0.45);
      leaf.userData.phase = tipIndex * 0.22 + i * 0.11;
      leaf.userData.kind = "leaf";
      leaf.userData.revealAt = 0.3 + ((((tipIndex + 1) * 19 + i * 11) % 100) / 100) * 0.62;
      leaf.castShadow = true;
      sceneRoot.add(leaf);
    }
  });

  const glowMaterial = new THREE.MeshBasicMaterial({ color: "#fff1aa", transparent: true, opacity: 0.72 });
  const glowGeometry = new THREE.SphereGeometry(0.045, 10, 8);
  tips.slice(0, 28).forEach((tip, index) => {
    if (index % 3 !== 0) return;
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(tip).add(new THREE.Vector3(0, -0.16, 0));
    glow.userData.phase = index * 0.4;
    sceneRoot.add(glow);
  });

  return tips;
}

function setThoughtSprites(group: THREE.Group, thoughts: Thought[], positions: THREE.Vector3[]) {
  group.children.forEach((child) => {
    const sprite = child as THREE.Sprite;
    const material = sprite.material as THREE.SpriteMaterial | undefined;
    material?.map?.dispose();
    material?.dispose();
  });
  group.clear();

  thoughts.forEach((thought, index) => {
    const texture = makeThoughtTexture(thought);
    if (!texture) return;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    const base = positions[(index * 5 + 3) % positions.length] || new THREE.Vector3();
    const side = index % 2 === 0 ? 1 : -1;
    sprite.position.set(base.x + side * 0.26, base.y + 0.22 + (index % 3) * 0.08, base.z + 0.26);
    sprite.scale.set(1.48, 0.5, 1);
    sprite.userData.phase = index * 0.48;
    group.add(sprite);
  });
}

function qrCells() {
  return Array.from({ length: 121 }, (_, index) => {
    const x = index % 11;
    const y = Math.floor(index / 11);
    const inFinder =
      (x < 4 && y < 4) ||
      (x > 6 && y < 4) ||
      (x < 4 && y > 6);
    if (inFinder) {
      const localX = x < 4 ? x : x - 7;
      const localY = y < 4 ? y : y - 7;
      return localX === 0 || localX === 3 || localY === 0 || localY === 3 || (localX === 1 && localY === 1) || (localX === 2 && localY === 2);
    }
    return (x * 7 + y * 11 + x * y) % 5 < 2;
  });
}

export default function CommunityTreePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsApiRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void; spin: () => void; grow: () => void } | null>(null);
  const thoughtGroupRef = useRef<THREE.Group | null>(null);
  const positionsRef = useRef<THREE.Vector3[]>([]);
  const approvedCountRef = useRef(approvedSeed.length);
  const [approved, setApproved] = useState<Thought[]>(approvedSeed);
  const [pending, setPending] = useState<Thought[]>(pendingSeed);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [isGrowing, setIsGrowing] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const cells = useMemo(qrCells, []);

  useEffect(() => {
    approvedCountRef.current = approved.length;
  }, [approved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    setRenderError(null);

    const renderer = new THREE.WebGPURenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(0, 3.05, 10.2);

    const ambient = new THREE.HemisphereLight("#f8fff3", "#8b6a52", 2.1);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight("#fff0cb", 3.7);
    sun.position.set(4, 7, 5);
    sun.castShadow = true;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 24;
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    scene.add(sun);

    const fill = new THREE.PointLight("#c8a2f8", 2.4, 14);
    fill.position.set(-3.4, 2.6, 4.8);
    scene.add(fill);

    const gpuGrass = createGpuGrassField();
    gpuGrass.root.position.y = -1.24;
    scene.add(gpuGrass.root);

    const tree = new THREE.Group();
    positionsRef.current = buildTree(tree);
    scene.add(tree);
    const treeBaseLocalY = -1.22;
    const treeBaseWorldY = -1.09;
    const growingObjects: THREE.Object3D[] = [];
    tree.children.forEach((child, index) => {
      child.userData.growDelay = Math.max(0, (child.position.y + 1.25) / 7.2) * 0.55 + (index % 11) * 0.006;
      child.userData.finalScale = child.scale.clone();
      child.scale.setScalar(0.001);
      const material = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      const materials = Array.isArray(material) ? material : material ? [material] : [];
      materials.forEach((entry) => {
        entry.transparent = true;
        entry.opacity = child.position.y > 2.25 ? 0 : 1;
      });
      growingObjects.push(child);
    });

    const thoughtGroup = new THREE.Group();
    thoughtGroupRef.current = thoughtGroup;
    tree.add(thoughtGroup);
    setThoughtSprites(thoughtGroup, approved, positionsRef.current);
    thoughtGroup.visible = false;

    let width = 0;
    let height = 0;
    let targetRotationY = 0.08;
    let currentRotationY = 0.08;
    let targetRotationX = 0;
    let currentRotationX = 0;
    let dragging = false;
    let isSpinning = spinEnabled;
    let lastX = 0;
    let lastY = 0;
    let resizeReady = false;
    let cameraY = 3.15;
    const minDistance = 5.7;
    const maxDistance = 14.6;
    let targetDistance = 9.5;
    let currentDistance = 9.5;
    let growthStart = performance.now();
    let growing = true;
    const pointers = new Map<number, { x: number; y: number }>();
    let lastPinchDistance = 0;
    const clampDistance = (value: number) => Math.min(maxDistance, Math.max(minDistance, value));
    const commentGrowthTarget = () => {
      const count = approvedCountRef.current;
      return {
        scale: Math.min(1.28, 0.72 + Math.min(count, 28) * 0.02),
        leafReveal: Math.min(1, 0.5 + Math.min(count, 22) * 0.023),
      };
    };
    const initialGrowth = commentGrowthTarget();
    let currentCommentScale = initialGrowth.scale;
    let currentLeafReveal = initialGrowth.leafReveal;

    const getPinchDistance = () => {
      const [first, second] = Array.from(pointers.values());
      if (!first || !second) return 0;
      return Math.hypot(second.x - first.x, second.y - first.y);
    };

    controlsApiRef.current = {
      zoomIn: () => {
        targetDistance = clampDistance(targetDistance - 1.2);
      },
      zoomOut: () => {
        targetDistance = clampDistance(targetDistance + 1.2);
      },
      reset: () => {
        targetDistance = width < 760 ? 12.2 : 9.5;
        targetRotationX = 0;
      },
      spin: () => {
        isSpinning = !isSpinning;
        setSpinEnabled(isSpinning);
      },
      grow: () => {
        growthStart = performance.now();
        growing = true;
        setIsGrowing(true);
        thoughtGroup.visible = false;
      },
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      cameraY = width < 760 ? 3.75 : 3.15;
      if (!resizeReady) {
        targetDistance = width < 760 ? 12.2 : 9.5;
        currentDistance = targetDistance;
        resizeReady = true;
      }
      camera.updateProjectionMatrix();
    };

    const onPointerDown = (event: PointerEvent) => {
      gpuGrass.setMouseFromEvent(event, camera, canvas);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragging = pointers.size === 1;
      lastX = event.clientX;
      lastY = event.clientY;
      isSpinning = false;
      setSpinEnabled(false);
      if (pointers.size === 2) {
        dragging = false;
        lastPinchDistance = getPinchDistance();
      }
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      gpuGrass.setMouseFromEvent(event, camera, canvas);
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const pinchDistance = getPinchDistance();
        if (lastPinchDistance > 0) {
          targetDistance = clampDistance(targetDistance - (pinchDistance - lastPinchDistance) * 0.014);
        }
        lastPinchDistance = pinchDistance;
        return;
      }
      if (!dragging) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      targetRotationY -= deltaX * 0.008;
      targetRotationX = Math.min(0.72, Math.max(-0.58, targetRotationX + deltaY * 0.006));
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      dragging = pointers.size === 1;
      lastPinchDistance = pointers.size === 2 ? getPinchDistance() : 0;
      if (dragging) {
        const remaining = Array.from(pointers.values())[0];
        if (remaining) {
          lastX = remaining.x;
          lastY = remaining.y;
        }
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetDistance = clampDistance(targetDistance + event.deltaY * 0.007);
    };

    const onPointerLeave = () => {
      gpuGrass.clearMouse();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    resize();

    const animate = () => {
      const t = performance.now() * 0.001;
      if (isSpinning && !dragging) targetRotationY += 0.006;
      currentRotationY += (targetRotationY - currentRotationY) * 0.055;
      currentRotationX += (targetRotationX - currentRotationX) * 0.06;
      currentDistance += (targetDistance - currentDistance) * 0.09;
      const commentGrowth = commentGrowthTarget();
      currentCommentScale += (commentGrowth.scale - currentCommentScale) * 0.045;
      currentLeafReveal += (commentGrowth.leafReveal - currentLeafReveal) * 0.055;
      const growthElapsed = (performance.now() - growthStart) / 1000;
      const growthDuration = 4.2;
      const growthProgress = Math.min(1, growthElapsed / growthDuration);
      const easeGrowth = growthProgress < 0.5
        ? 4 * growthProgress * growthProgress * growthProgress
        : 1 - Math.pow(-2 * growthProgress + 2, 3) / 2;
      growingObjects.forEach((object) => {
        const delay = object.userData.growDelay as number;
        const local = Math.min(1, Math.max(0, (easeGrowth - delay) / 0.32));
        const eased = local * local * (3 - 2 * local);
        const finalScale = object.userData.finalScale as THREE.Vector3;
        const revealAt = typeof object.userData.revealAt === "number" ? object.userData.revealAt : 0;
        const commentReveal = object.userData.kind === "leaf"
          ? Math.min(1, Math.max(0, (currentLeafReveal - revealAt) / 0.08))
          : 1;
        object.visible = commentReveal > 0.03;
        object.scale.set(
          Math.max(0.001, finalScale.x * eased * commentReveal),
          Math.max(0.001, finalScale.y * eased * commentReveal),
          Math.max(0.001, finalScale.z * eased * commentReveal),
        );
        const material = (object as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        const materials = Array.isArray(material) ? material : material ? [material] : [];
        materials.forEach((entry) => {
          entry.opacity = object.position.y > 2.25 ? eased : 1;
        });
      });
      if (growthProgress >= 0.86) {
        thoughtGroup.visible = true;
      }
      if (growing && growthProgress >= 1) {
        growing = false;
        setIsGrowing(false);
      }
      const orbitDistance = currentDistance * Math.cos(currentRotationX * 0.7);
      camera.position.set(
        Math.sin(currentRotationY) * orbitDistance,
        cameraY + Math.sin(currentRotationX) * 4.2,
        Math.cos(currentRotationY) * orbitDistance,
      );
      camera.lookAt(0, 2.15, 0);
      tree.scale.setScalar(currentCommentScale);
      tree.position.y = treeBaseWorldY - treeBaseLocalY * currentCommentScale;
      thoughtGroup.children.forEach((child, index) => {
        child.position.y += Math.sin(t * 1.4 + child.userData.phase) * 0.0009;
        child.scale.x = 1.9 + Math.sin(t * 1.8 + index) * 0.045;
      });
      tree.children.forEach((child) => {
        const update = child.userData.update as ((timeSeconds: number) => void) | undefined;
        if (update) update(t);
        const phase = child.userData.phase;
        if (typeof phase === "number") child.rotation.z += Math.sin(t + phase) * 0.00045;
      });
      gpuGrass.update(renderer);
      renderer.render(scene, camera);
    };

    const bootRenderer = async () => {
      try {
        await renderer.init();
        if (disposed) return;
        await gpuGrass.init(renderer);
        if (disposed) return;
        renderer.setAnimationLoop(animate);
      } catch (error) {
        console.error("WebGPU tree preview failed", error);
        if (!disposed) setRenderError("WebGPU renderer is not available in this browser.");
      }
    };

    void bootRenderer();

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      controlsApiRef.current = null;
      thoughtGroupRef.current = null;
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material?.dispose();
        }
      });
      renderer.dispose();
    };
    // The scene is created once; approved updates are synced by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!thoughtGroupRef.current || positionsRef.current.length === 0) return;
    setThoughtSprites(thoughtGroupRef.current, approved, positionsRef.current);
  }, [approved]);

  function submitThought(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    const next: Thought = {
      id: `local-${Date.now()}`,
      name: name.trim() || "Guest",
      message: cleanMessage.slice(0, 130),
      color: palette[(pending.length + approved.length) % palette.length],
    };
    setPending((items) => [next, ...items]);
    setName("");
    setMessage("");
  }

  function approveThought(id: string) {
    const thought = pending.find((item) => item.id === id);
    if (!thought) return;
    setPending((items) => items.filter((item) => item.id !== id));
    setApproved((items) => [thought, ...items].slice(0, 10));
  }

  function rejectThought(id: string) {
    setPending((items) => items.filter((item) => item.id !== id));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f2ea] text-[#20170f]">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f9f5ec_0%,#e7f0dc_52%,#d7e6c7_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(242,201,76,0.28),transparent_28%),radial-gradient(circle_at_14%_22%,rgba(119,215,194,0.22),transparent_34%),radial-gradient(circle_at_50%_82%,rgba(124,58,237,0.12),transparent_38%)]" />

        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-9">
          <Link href="/" className="flex items-center gap-3 rounded-full bg-white/72 px-3 py-2 shadow-sm shadow-black/5 backdrop-blur-md">
            <Image
              src="/logos/holdlogo.png"
              alt="Hold It Down CIC"
              width={34}
              height={34}
              className="rounded-full"
              priority
            />
            <span className="hidden text-sm font-semibold text-[#2c2118] sm:inline">Tree Preview</span>
          </Link>
          <div className="rounded-full bg-[#20170f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-black/10">
            Roots & Wings
          </div>
        </header>

        <section className="relative z-10 grid min-h-screen items-stretch lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="relative min-h-[72vh] lg:min-h-screen">
            <canvas
              ref={canvasRef}
              aria-label="3D community tree preview"
              className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
            />
            {renderError ? (
              <div className="absolute left-1/2 top-1/2 z-30 max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-200 bg-white/92 p-5 text-center text-sm font-semibold text-red-900 shadow-xl shadow-black/10 backdrop-blur-md">
                {renderError}
              </div>
            ) : null}
            <div className="absolute left-4 top-20 z-20 flex items-center gap-2 rounded-full bg-white/70 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md sm:left-6 lg:left-8">
              <button
                type="button"
                aria-label="Zoom out"
                title="Zoom out"
                onClick={() => controlsApiRef.current?.zoomOut()}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold text-[#2b2118] shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:bg-[#f1eadc]"
              >
                -
              </button>
              <button
                type="button"
                aria-label="Reset zoom"
                title="Reset zoom"
                onClick={() => controlsApiRef.current?.reset()}
                className="h-9 rounded-full bg-[#f1eadc] px-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5a3f27] transition hover:-translate-y-0.5 hover:bg-white"
              >
                1x
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                onClick={() => controlsApiRef.current?.zoomIn()}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#20170f] text-lg font-bold text-white shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#3a2a1d]"
              >
                +
              </button>
              <button
                type="button"
                aria-label={spinEnabled ? "Pause 360 spin" : "Start 360 spin"}
                title={spinEnabled ? "Pause 360 spin" : "Start 360 spin"}
                onClick={() => controlsApiRef.current?.spin()}
                className={`h-9 rounded-full px-3 text-xs font-bold uppercase tracking-[0.14em] shadow-sm shadow-black/5 transition hover:-translate-y-0.5 ${
                  spinEnabled
                    ? "bg-[#4f8f4f] text-white"
                    : "bg-white text-[#2b2118] hover:bg-[#f1eadc]"
                }`}
              >
                360
              </button>
              <button
                type="button"
                aria-label="Replay tree growth"
                title="Replay tree growth"
                onClick={() => controlsApiRef.current?.grow()}
                className={`h-9 rounded-full px-3 text-xs font-bold uppercase tracking-[0.14em] shadow-sm shadow-black/5 transition hover:-translate-y-0.5 ${
                  isGrowing
                    ? "bg-[#e8b84a] text-[#2b2118]"
                    : "bg-white text-[#2b2118] hover:bg-[#f1eadc]"
                }`}
              >
                Grow
              </button>
            </div>
          </div>

          <aside className="relative z-20 flex flex-col gap-4 border-t border-black/10 bg-[#fffaf0]/88 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl lg:min-h-screen lg:border-l lg:border-t-0 lg:p-5 lg:pt-24">
            <section className="rounded-[1.5rem] border border-black/10 bg-white/82 p-4 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#79522d]">Scan Point</p>
                  <h2 className="mt-1 text-xl font-bold">Leave a leaf</h2>
                </div>
                <div className="grid h-28 w-28 shrink-0 grid-cols-11 gap-[2px] rounded-2xl bg-white p-3 shadow-inner shadow-black/10">
                  {cells.map((filled, index) => (
                    <span
                      key={index}
                      className={filled ? "rounded-[2px] bg-[#21180f]" : "rounded-[2px] bg-[#efe6d6]"}
                    />
                  ))}
                </div>
              </div>
              <form onSubmit={submitThought} className="mt-4 space-y-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-[#fbf6ec] px-4 text-sm font-medium outline-none transition focus:border-[#7c3aed]/50 focus:bg-white"
                />
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Comment, thought, or suggestion"
                  rows={3}
                  maxLength={130}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fbf6ec] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#7c3aed]/50 focus:bg-white"
                />
                <button
                  type="submit"
                  className="h-11 w-full rounded-2xl bg-[#20170f] px-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#3a2a1d]"
                >
                  Submit Preview
                </button>
              </form>
            </section>

            <section className="min-h-0 flex-1 rounded-[1.5rem] border border-black/10 bg-white/82 p-4 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#79522d]">Telegram</p>
                  <h2 className="mt-1 text-xl font-bold">Approval queue</h2>
                </div>
                <span className="rounded-full bg-[#f2c94c]/45 px-3 py-1 text-xs font-bold text-[#5b4014]">
                  {pending.length}
                </span>
              </div>

              <div className="mt-4 max-h-[38vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-33rem)]">
                {pending.length === 0 ? (
                  <p className="rounded-2xl bg-[#f4eedf] px-4 py-5 text-sm font-medium text-[#6f5b45]">
                    No pending messages.
                  </p>
                ) : (
                  pending.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-black/10 bg-[#fbf6ec] p-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 h-4 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#20170f]">{item.name}</p>
                          <p className="mt-1 text-sm leading-relaxed text-[#5c4b3b]">{item.message}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => approveThought(item.id)}
                          className="h-10 rounded-xl bg-[#4f8f4f] text-sm font-bold text-white transition hover:-translate-y-0.5"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectThought(item.id)}
                          className="h-10 rounded-xl bg-[#eadfcb] text-sm font-bold text-[#4b3928] transition hover:-translate-y-0.5"
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
