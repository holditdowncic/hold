"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { buildTree } from "./CommunityTreePreview";
import { createGpuGrassField } from "./gpuGrassField";

export default function TreeOfHopeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsApiRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void } | null>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let width = 1;
    let height = 1;
    let targetRotationY = -0.32;
    let currentRotationY = -0.32;
    let targetRotationX = -0.05;
    let currentRotationX = -0.05;
    let targetZoom = 1;
    let currentZoom = 1;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const clampZoom = (value: number) => Math.min(1.85, Math.max(0.72, value));

    const renderer = new THREE.WebGPURenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 90);
    const ambient = new THREE.HemisphereLight("#f9fff2", "#7a5a43", 2.25);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight("#fff1d0", 3.5);
    sun.position.set(4, 7, 5);
    sun.castShadow = true;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 24;
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    scene.add(sun);

    const fill = new THREE.PointLight("#b7e07b", 1.6, 14);
    fill.position.set(-3.5, 3.4, 5);
    scene.add(fill);

    const isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
    const gpuGrass = createGpuGrassField({
      bladeCount: isSmallScreen ? 36000 : 70000,
      fieldSize: isSmallScreen ? 15 : 18,
    });
    gpuGrass.root.position.y = -1.24;
    scene.add(gpuGrass.root);

    const tree = new THREE.Group();
    buildTree(tree);
    scene.add(tree);

    const treeBaseLocalY = -1.22;
    const treeBaseWorldY = -1.09;
    const treeScale = isSmallScreen ? 0.9 : 0.98;
    tree.scale.setScalar(treeScale);
    tree.position.y = treeBaseWorldY - treeBaseLocalY * treeScale;

    controlsApiRef.current = {
      zoomIn: () => {
        targetZoom = clampZoom(targetZoom + 0.18);
      },
      zoomOut: () => {
        targetZoom = clampZoom(targetZoom - 0.18);
      },
      reset: () => {
        targetZoom = 1;
        targetRotationY = -0.32;
        targetRotationX = -0.05;
      },
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updateCamera = () => {
      currentRotationY += (targetRotationY - currentRotationY) * 0.035;
      currentRotationX += (targetRotationX - currentRotationX) * 0.055;
      currentZoom += (targetZoom - currentZoom) * 0.08;
      const distance = (width < 760 ? 15.2 : 12.8) / currentZoom;
      const orbitDistance = distance * Math.cos(currentRotationX * 0.7);
      camera.position.set(
        Math.sin(currentRotationY) * orbitDistance,
        (width < 760 ? 4.15 : 3.65) + Math.sin(currentRotationX) * 3.4,
        Math.cos(currentRotationY) * orbitDistance,
      );
      camera.lookAt(0, 2.25, 0);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      gpuGrass.setMouseFromEvent(event, camera, canvas);
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      gpuGrass.setMouseFromEvent(event, camera, canvas);
      if (!dragging) return;
      targetRotationY -= (event.clientX - lastX) * 0.008;
      targetRotationX = Math.min(0.42, Math.max(-0.34, targetRotationX + (event.clientY - lastY) * 0.004));
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      gpuGrass.clearMouse();
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const onPointerLeave = () => {
      gpuGrass.clearMouse();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetZoom = clampZoom(targetZoom - event.deltaY * 0.0014);
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
      updateCamera();
      gpuGrass.update(renderer);
      renderer.render(scene, camera);
    };

    const start = async () => {
      try {
        await renderer.init();
        if (disposed) return;
        await gpuGrass.init(renderer);
        if (disposed) return;
        renderer.setAnimationLoop(animate);
      } catch (error) {
        console.error("Tree of Hope WebGPU scene failed", error);
        if (!disposed) setRenderError(true);
      }
    };

    void start();

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
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material?.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,#f8f5e8_0%,#e6efd9_48%,#b7b184_100%)] sm:min-h-[500px] lg:min-h-[560px]">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-white/72 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md sm:right-5 sm:top-5">
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
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Tree of Hope 3D scene"
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      />
      {renderError ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <p className="max-w-sm text-sm font-semibold text-[#21180f]">
            Tree of Hope needs a browser with WebGPU support.
          </p>
        </div>
      ) : null}
    </div>
  );
}
