"use client";

import Image from "next/image";
import type { MutableRefObject, PointerEvent as ReactPointerEvent, WheelEvent } from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { buildTree } from "./CommunityTreePreview";
import { createGpuGrassField } from "./gpuGrassField";

type PointerLike = {
  clientX: number;
  clientY: number;
};

type TreeRendererControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  zoomBy: (deltaY: number) => void;
  turn: (deltaX: number, deltaY: number) => void;
  setPointerFromEvent: (event: PointerLike) => void;
  clearPointer: () => void;
};

function TreeOfHopeWebgpuRenderer({
  controlsRef,
  setRenderError,
}: {
  controlsRef: MutableRefObject<TreeRendererControls | null>;
  setRenderError: (value: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let width = 1;
    let height = 1;
    let targetTreeRotationY = -0.18;
    let currentTreeRotationY = -0.18;
    let targetCameraTilt = -0.04;
    let currentCameraTilt = -0.04;
    let targetZoom = 1;
    let currentZoom = 1;
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

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updateCamera = () => {
      currentTreeRotationY += (targetTreeRotationY - currentTreeRotationY) * 0.07;
      currentCameraTilt += (targetCameraTilt - currentCameraTilt) * 0.055;
      currentZoom += (targetZoom - currentZoom) * 0.08;
      const distance = (width < 760 ? 15.2 : 12.8) / currentZoom;
      camera.position.set(
        0,
        (width < 760 ? 4.15 : 3.65) + Math.sin(currentCameraTilt) * 3,
        distance * Math.cos(currentCameraTilt * 0.4),
      );
      camera.lookAt(0, 2.25, 0);
      tree.rotation.y = currentTreeRotationY;
    };

    const controls: TreeRendererControls = {
      zoomIn: () => {
        targetZoom = clampZoom(targetZoom + 0.18);
      },
      zoomOut: () => {
        targetZoom = clampZoom(targetZoom - 0.18);
      },
      reset: () => {
        targetZoom = 1;
        targetTreeRotationY = -0.18;
        targetCameraTilt = -0.04;
      },
      zoomBy: (deltaY) => {
        targetZoom = clampZoom(targetZoom - deltaY * 0.0014);
      },
      turn: (deltaX, deltaY) => {
        targetTreeRotationY += deltaX * 0.01;
        targetCameraTilt = Math.min(0.32, Math.max(-0.28, targetCameraTilt + deltaY * 0.0035));
      },
      setPointerFromEvent: (event) => {
        gpuGrass.setMouseFromEvent(event, camera, canvas);
      },
      clearPointer: () => {
        gpuGrass.clearMouse();
      },
    };
    controlsRef.current = controls;

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = () => {
      updateCamera();
      gpuGrass.update(renderer);
      renderer.render(scene, camera);
    };

    const start = async () => {
      try {
        setRenderError(false);
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
      if (controlsRef.current === controls) controlsRef.current = null;
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
      gpuGrass.dispose();
      renderer.dispose();
    };
  }, [controlsRef, setRenderError]);

  return (
    <canvas
      ref={canvasRef}
      data-tree-scene-canvas
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}

export default function TreeOfHopeScene() {
  const treeControlsRef = useRef<TreeRendererControls | null>(null);
  const [renderError, setRenderError] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  const handleTreePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,a")) return;
    event.preventDefault();
    treeControlsRef.current?.setPointerFromEvent(event);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTreePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    treeControlsRef.current?.setPointerFromEvent(event);
    if (!drag) return;
    event.preventDefault();

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const frameDeltaX = event.clientX - drag.lastX;
    const frameDeltaY = event.clientY - drag.lastY;
    if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;

    drag.moved = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    treeControlsRef.current?.turn(frameDeltaX, frameDeltaY);
  };

  const handleTreePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    treeControlsRef.current?.clearPointer();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = null;
  };

  const handleTreeWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    treeControlsRef.current?.zoomBy(event.deltaY);
  };

  return (
    <div
      className="relative min-h-[500px] cursor-grab touch-none overflow-hidden rounded-2xl border border-border bg-[#bcd790] shadow-xl shadow-black/5 active:cursor-grabbing sm:min-h-[620px] lg:min-h-[720px]"
      style={{ touchAction: "none" }}
      onPointerDown={handleTreePointerDown}
      onPointerMove={handleTreePointerMove}
      onPointerUp={handleTreePointerEnd}
      onPointerCancel={handleTreePointerEnd}
      onPointerLeave={handleTreePointerEnd}
      onWheel={handleTreeWheel}
      role="application"
      aria-label="Interactive 3D Tree of Hope"
    >
      <TreeOfHopeWebgpuRenderer controlsRef={treeControlsRef} setRenderError={setRenderError} />
      {renderError ? (
        <Image
          src="/media/tree-of-hope-field.jpg"
          alt="Large tree in a green field for the Tree of Hope"
          fill
          priority={false}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1280px"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(30,22,12,0.08)_64%,rgba(20,16,9,0.2))]" />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-white/72 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md sm:right-5 sm:top-5">
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => treeControlsRef.current?.zoomOut()}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold text-[#2b2118] shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:bg-[#f1eadc]"
        >
          -
        </button>
        <button
          type="button"
          aria-label="Reset tree view"
          title="Reset tree view"
          onClick={() => treeControlsRef.current?.reset()}
          className="h-9 rounded-full bg-[#f1eadc] px-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5a3f27] transition hover:-translate-y-0.5 hover:bg-white"
        >
          1x
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => treeControlsRef.current?.zoomIn()}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#20170f] text-lg font-bold text-white shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#3a2a1d]"
        >
          +
        </button>
      </div>
    </div>
  );
}
