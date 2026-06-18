"use client";

import Image from "next/image";
import type { CSSProperties, MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
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

const hangingTreeComments = [
  {
    id: "families",
    author: "Parent",
    message: "A place where families feel seen.",
    x: -0.86,
    y: 31,
    z: 0.35,
    tilt: -7,
    stringClassName: "h-14",
    tagClassName: "bg-[linear-gradient(135deg,rgba(255,252,232,0.96),rgba(189,220,133,0.92))]",
  },
  {
    id: "young-people",
    author: "Young voice",
    message: "Keep believing in us.",
    x: -0.18,
    y: 23,
    z: 0.62,
    tilt: 4,
    stringClassName: "h-12",
    tagClassName: "bg-[linear-gradient(135deg,rgba(255,247,222,0.96),rgba(242,198,91,0.9))]",
  },
  {
    id: "community",
    author: "Community",
    message: "Hope grows when we pass it on.",
    x: 0.84,
    y: 33,
    z: 0.42,
    tilt: 7,
    stringClassName: "h-16",
    tagClassName: "bg-[linear-gradient(135deg,rgba(255,248,231,0.96),rgba(197,170,226,0.9))]",
  },
];

function commentProjectionStyle(comment: (typeof hangingTreeComments)[number], rotationY = -0.18): CSSProperties {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const rotatedX = comment.x * cos + comment.z * sin;
  const depth = comment.z * cos - comment.x * sin;
  const projectedX = 50 + rotatedX * 24;
  const projectedY = comment.y + depth * 3.4;
  const scale = Math.max(0.74, Math.min(1.08, 0.9 + depth * 0.11));
  const opacity = Math.max(0.38, Math.min(1, 0.72 + depth * 0.28));
  const rotateZ = comment.tilt + rotatedX * 5;

  return {
    left: `${projectedX}%`,
    top: `${projectedY}%`,
    opacity,
    zIndex: Math.round(12 + depth * 10),
    transform: `translate(-50%, 0) scale(${scale.toFixed(3)}) rotate(${rotateZ.toFixed(2)}deg)`,
  };
}

function TreeOfHopeWebgpuRenderer({
  controlsRef,
  commentOverlayRef,
  setRenderError,
}: {
  controlsRef: MutableRefObject<TreeRendererControls | null>;
  commentOverlayRef: MutableRefObject<HTMLDivElement | null>;
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

    const updateCommentOverlay = (rotationY: number) => {
      const overlay = commentOverlayRef.current;
      if (!overlay) return;

      const comments = overlay.querySelectorAll<HTMLElement>("[data-tree-hanging-comment]");
      const horizontalSpread = width < 760 ? 27 : 24;
      const depthLift = width < 760 ? 2.6 : 3.4;

      comments.forEach((comment) => {
        const localX = Number(comment.dataset.treeCommentX ?? 0);
        const localZ = Number(comment.dataset.treeCommentZ ?? 0);
        const localY = Number(comment.dataset.treeCommentY ?? 30);
        const tilt = Number(comment.dataset.treeCommentTilt ?? 0);
        const cos = Math.cos(rotationY);
        const sin = Math.sin(rotationY);
        const rotatedX = localX * cos + localZ * sin;
        const depth = localZ * cos - localX * sin;
        const projectedX = 50 + rotatedX * horizontalSpread;
        const projectedY = localY + depth * depthLift;
        const scale = Math.max(0.74, Math.min(1.08, 0.9 + depth * 0.11));
        const opacity = Math.max(0.38, Math.min(1, 0.72 + depth * 0.28));
        const rotateZ = tilt + rotatedX * 5;

        comment.style.left = `${projectedX}%`;
        comment.style.top = `${projectedY}%`;
        comment.style.opacity = opacity.toFixed(3);
        comment.style.zIndex = String(Math.round(12 + depth * 10));
        comment.style.transform = `translate(-50%, 0) scale(${scale.toFixed(3)}) rotate(${rotateZ.toFixed(2)}deg)`;
      });
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
      updateCommentOverlay(currentTreeRotationY);
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
  }, [commentOverlayRef, controlsRef, setRenderError]);

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
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const commentOverlayRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const container = treeContainerRef.current;
    if (!container) return;

    const stopPageScroll = (event: Event) => {
      event.preventDefault();
    };
    const handleNativeWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      treeControlsRef.current?.zoomBy(event.deltaY);
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    container.addEventListener("touchmove", stopPageScroll, { passive: false });
    container.addEventListener("gesturestart", stopPageScroll, { passive: false });
    container.addEventListener("gesturechange", stopPageScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
      container.removeEventListener("touchmove", stopPageScroll);
      container.removeEventListener("gesturestart", stopPageScroll);
      container.removeEventListener("gesturechange", stopPageScroll);
    };
  }, []);

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

  return (
    <div
      ref={treeContainerRef}
      className="relative min-h-[500px] cursor-grab touch-none overflow-hidden rounded-2xl border border-border bg-[#bcd790] shadow-xl shadow-black/5 active:cursor-grabbing sm:min-h-[620px] lg:min-h-[720px]"
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
      onPointerDown={handleTreePointerDown}
      onPointerMove={handleTreePointerMove}
      onPointerUp={handleTreePointerEnd}
      onPointerCancel={handleTreePointerEnd}
      onPointerLeave={handleTreePointerEnd}
      role="application"
      aria-label="Interactive 3D Tree of Hope"
    >
      <TreeOfHopeWebgpuRenderer
        controlsRef={treeControlsRef}
        commentOverlayRef={commentOverlayRef}
        setRenderError={setRenderError}
      />
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

      <div ref={commentOverlayRef} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
        {hangingTreeComments.map((comment) => (
          <div
            key={comment.id}
            data-tree-hanging-comment
            data-tree-comment-x={comment.x}
            data-tree-comment-y={comment.y}
            data-tree-comment-z={comment.z}
            data-tree-comment-tilt={comment.tilt}
            className="absolute left-1/2 top-[30%] w-[min(10rem,36vw)] origin-top sm:w-[min(15rem,28vw)]"
            style={commentProjectionStyle(comment)}
          >
            <span className={`mx-auto block w-px bg-[#5f3a18]/40 ${comment.stringClassName}`} />
            <div
              data-tree-comment-leaf
              className={`relative rounded-[1.25rem_1.25rem_1.25rem_0.45rem] border border-[#5f3a18]/14 px-3 py-2 text-left shadow-[0_12px_30px_rgba(32,23,15,0.16)] backdrop-blur-sm ${comment.tagClassName}`}
            >
              <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5f3a18]/20 bg-[#5f3a18]" />
              <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-[#3e7316]">{comment.author}</p>
              <p className="mt-1 text-[clamp(0.7rem,1.2vw,0.82rem)] font-bold leading-snug text-[#20170f]">
                {comment.message}
              </p>
            </div>
          </div>
        ))}
      </div>

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
