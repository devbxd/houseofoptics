"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";

// Real WebGL 3D, built for it to actually look premium instead of like flat
// colored circles: proper key/fill/rim lighting + filmic tone mapping (the
// thing that makes a lit sphere read as a glossy ornament instead of a flat
// dot), and every piece lives in its OWN small fixed-pixel-size canvas
// pinned to a page corner — never one giant full-viewport scene guessing at
// world-space coordinates that drift across screen sizes. That's what was
// scattering ornaments across the middle of the page and mangling the tree
// before: a single big scene's "corner" math only worked for one aspect
// ratio. A canvas that's physically 210×230px in the top-left corner
// literally cannot render anything outside that box.
const GOLD = 0xe8c766;
const GOLD_DEEP = 0xc9a227;
const RED = 0xc8102e;
const RED_DEEP = 0x8f0f24;
const GREEN = 0x1c6b44;
const PEARL = 0xfdf6e8;
const ORNAMENT_COLORS = [RED, GOLD, GREEN, PEARL, GOLD_DEEP, RED_DEEP];

type Cleanup = () => void;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Shared premium light rig — warm key + cool fill + a soft rim light behind
// the subject is what actually separates a glossy 3D look from a flat
// silhouette; a bare ambient/point light alone (the previous version) reads
// as flat no matter how "physical" the material is.
function addStudioLights(THREE: typeof THREE_NS, scene: THREE_NS.Scene) {
  scene.add(new THREE.HemisphereLight(0xfff3da, 0x1a1008, 0.7));
  const key = new THREE.DirectionalLight(0xffe6b0, 2.1);
  key.position.set(2.4, 3, 3.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd9ff, 0.5);
  fill.position.set(-2.6, -0.6, 2);
  scene.add(fill);
  const rim = new THREE.PointLight(0xffcf7a, 1.1, 10);
  rim.position.set(-1.2, 1.6, -2.4);
  scene.add(rim);
}

function makeRenderer(THREE: typeof THREE_NS, canvas: HTMLCanvasElement, w: number, h: number) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  return renderer;
}

// A reflection environment is what actually makes a glossy sphere read as a
// real photographed ornament instead of a flat lit ball — it's the crisp
// warm highlights and dark falloff wrapping around the surface that a
// point light alone can never produce. This paints a small warm-bokeh scene
// (soft gold/red glows on near-black) onto a canvas and uses it as an
// equirectangular reflection map, echoing the brand's red/gold palette in
// every reflection on the ornaments.
function makeBokehEnvironment(THREE: typeof THREE_NS) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, "#120705");
  bg.addColorStop(1, "#050302");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  const glows: [number, number, number, string][] = [
    [120, 90, 70, "rgba(232,199,102,0.95)"],
    [340, 60, 55, "rgba(200,16,46,0.75)"],
    [420, 150, 85, "rgba(232,199,102,0.6)"],
    [60, 190, 60, "rgba(201,162,39,0.55)"],
    [230, 210, 50, "rgba(200,16,46,0.5)"],
    [480, 40, 40, "rgba(253,246,232,0.5)"],
  ];
  for (const [x, y, r, color] of glows) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function ornamentMaterial(THREE: typeof THREE_NS, color: number) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.7,
    roughness: 0.22,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.5,
  });
}

// The small metal cap + hanging loop every real glass ornament has — this
// one detail is a big part of why a photographed bauble reads as "real"
// rather than "a sphere".
function addOrnamentCap(THREE: typeof THREE_NS, group: THREE_NS.Group, radius: number) {
  const capMat = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.6 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.32, radius * 0.4, radius * 0.42, 16), capMat);
  cap.position.y = radius * 0.96;
  group.add(cap);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.16, radius * 0.05, 8, 16), capMat);
  loop.position.y = radius * 1.24;
  loop.rotation.x = Math.PI / 2;
  group.add(loop);
}

// A small hanging cluster of glossy ornament baubles, pinned to one page
// corner in its own tightly-bounded canvas.
function mountOrnamentCluster(
  THREE: typeof THREE_NS,
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  mirrored: boolean,
  reduced: boolean
): Cleanup {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 30);
  camera.position.set(0, 0, 7.2);
  addStudioLights(THREE, scene);
  const env = makeBokehEnvironment(THREE);
  scene.environment = env;

  const renderer = makeRenderer(THREE, canvas, w, h);

  // One larger "showcase" ornament with the rest smaller and softer behind
  // it — echoes a photographed ornament shot (one crisp subject, soft
  // supporting shapes) instead of a row of identical beads. Kept well
  // within the camera's vertical frame (half-height ≈1.9 at this distance)
  // so nothing clips off the edge of this small canvas.
  const sizes = [0.46, 0.24, 0.19];
  const yOffsets = [1.05, 0.28, -0.42];
  const balls: { group: THREE_NS.Group; baseY: number; bobSpeed: number; bobOffset: number }[] = [];
  const threadGeo = new THREE.CylinderGeometry(0.01, 0.01, 1, 6);
  const threadMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.6 });

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const x = (mirrored ? -1 : 1) * (0.35 + i * 0.72);
    const y = yOffsets[i];
    const z = i === 0 ? 0.4 : -0.4 - i * 0.3;

    const topY = 1.75;
    const thread = new THREE.Mesh(threadGeo, threadMat);
    const threadLen = topY - y;
    thread.scale.set(1, threadLen, 1);
    thread.position.set(x, y + threadLen / 2, z);
    scene.add(thread);

    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 40, 40), ornamentMaterial(THREE, ORNAMENT_COLORS[i % ORNAMENT_COLORS.length]));
    group.add(mesh);
    addOrnamentCap(THREE, group, size);
    group.position.set(x, y, z);
    scene.add(group);
    balls.push({ group, baseY: y, bobSpeed: 0.5 + Math.random() * 0.4, bobOffset: Math.random() * Math.PI * 2 });
  }

  let raf = 0;
  let visible = !document.hidden;
  const onVisibility = () => (visible = !document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  const clock = new THREE.Clock();
  const speedMul = reduced ? 0.2 : 1;

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime() * speedMul;
    for (const b of balls) {
      b.group.rotation.y += 0.01;
      b.group.rotation.z = Math.sin(t * b.bobSpeed + b.bobOffset) * 0.1;
    }
    renderer.render(scene, camera);
  }
  animate();

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
    scene.traverse((obj) => {
      const mesh = obj as THREE_NS.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE_NS.Material | THREE_NS.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    env.dispose();
    renderer.dispose();
  };
}

// A small lit low-poly pine tree with ornament highlights and a glowing
// star, pinned to the bottom-left corner in its own bounded canvas.
function mountTree(THREE: typeof THREE_NS, canvas: HTMLCanvasElement, w: number, h: number, reduced: boolean): Cleanup {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 30);
  camera.position.set(0.9, 0.15, 6.4);
  camera.lookAt(0, 0.15, 0);
  addStudioLights(THREE, scene);
  const env = makeBokehEnvironment(THREE);
  scene.environment = env;

  const renderer = makeRenderer(THREE, canvas, w, h);

  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.85 })
  );
  trunk.position.y = -1.05;
  group.add(trunk);

  const tierGreens = [0x175c3a, 0x1c6b44, 0x21804f];
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.62 - i * 0.15, 0.62, 12),
      new THREE.MeshStandardMaterial({ color: tierGreens[i], roughness: 0.55, metalness: 0.05 })
    );
    cone.position.y = -0.7 + i * 0.42;
    group.add(cone);
  }
  for (let i = 0; i < 6; i++) {
    const tier = i % tiers;
    const angle = (i / 6) * Math.PI * 2;
    const r = (0.62 - tier * 0.15) * 0.62;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), ornamentMaterial(THREE, ORNAMENT_COLORS[i % ORNAMENT_COLORS.length]));
    bulb.position.set(Math.cos(angle) * r, -0.7 + tier * 0.42 + 0.12, Math.sin(angle) * r);
    group.add(bulb);
  }
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.1, 0),
    new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffbf3f, emissiveIntensity: 1.6, roughness: 0.25 })
  );
  star.position.y = -0.7 + tiers * 0.42 + 0.24;
  group.add(star);
  const starLight = new THREE.PointLight(0xffcf6b, 1.3, 3.5);
  starLight.position.copy(star.position);
  group.add(starLight);

  scene.add(group);

  let raf = 0;
  let visible = !document.hidden;
  const onVisibility = () => (visible = !document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  const clock = new THREE.Clock();
  const speedMul = reduced ? 0.2 : 1;

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime() * speedMul;
    group.rotation.y = Math.sin(t * 0.25) * 0.22;
    star.rotation.y += 0.015;
    renderer.render(scene, camera);
  }
  animate();

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
    scene.traverse((obj) => {
      const mesh = obj as THREE_NS.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE_NS.Material | THREE_NS.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    env.dispose();
    renderer.dispose();
  };
}

// Soft, sparse falling snow across the full viewport — real 3D points, not
// flat CSS dots, but rendered as soft round sprites (not lit polyhedra) so
// it reads as snow instead of a scatter of tiny gems.
function mountSnow(THREE: typeof THREE_NS, canvas: HTMLCanvasElement, isMobile: boolean, reduced: boolean): Cleanup {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 40);
  camera.position.set(0, 0, 12);

  const renderer = makeRenderer(THREE, canvas, window.innerWidth, window.innerHeight);

  // A soft round gradient sprite drawn to a small canvas texture — this is
  // what makes points look like snow instead of hard squares/dots.
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 64;
  spriteCanvas.height = 64;
  const ctx = spriteCanvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(spriteCanvas);

  const count = isMobile ? 45 : 90;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const sways = new Float32Array(count);
  const swaySpeeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = Math.random() * 16 - 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    speeds[i] = 0.5 + Math.random() * 0.6;
    sways[i] = Math.random() * Math.PI * 2;
    swaySpeeds[i] = 0.25 + Math.random() * 0.35;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.16,
    map: texture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function layout() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  const onResize = () => layout();
  window.addEventListener("resize", onResize);

  let raf = 0;
  let visible = !document.hidden;
  const onVisibility = () => (visible = !document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  const clock = new THREE.Clock();
  const speedMul = reduced ? 0.2 : 1;
  const posAttr = geo.getAttribute("position") as THREE_NS.BufferAttribute;

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime() * speedMul;
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) - speeds[i] * 0.018 * speedMul;
      if (y < -8) y = 8;
      const baseX = positions[i * 3];
      const sway = Math.sin(t * swaySpeeds[i] + sways[i]) * 0.7;
      posAttr.setXYZ(i, baseX + sway, y, positions[i * 3 + 2]);
    }
    posAttr.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    geo.dispose();
    mat.dispose();
    texture.dispose();
    renderer.dispose();
  };
}

export function Christmas3D() {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<HTMLCanvasElement>(null);
  const snowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    const cleanups: Cleanup[] = [];

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reduced = prefersReducedMotion();
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      if (leftRef.current) cleanups.push(mountOrnamentCluster(THREE, leftRef.current, 260, 300, true, reduced));
      if (rightRef.current) cleanups.push(mountOrnamentCluster(THREE, rightRef.current, 260, 300, false, reduced));
      if (treeRef.current) cleanups.push(mountTree(THREE, treeRef.current, 150, 190, reduced));
      if (snowRef.current) cleanups.push(mountSnow(THREE, snowRef.current, isMobile, reduced));
    })();

    return () => {
      disposed = true;
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <>
      <canvas ref={snowRef} className="pointer-events-none fixed inset-0 z-[42]" aria-hidden />
      <canvas
        ref={leftRef}
        width={260}
        height={300}
        className="pointer-events-none fixed left-0 top-12 z-[43] hidden sm:block"
        style={{ width: 195, height: 225 }}
        aria-hidden
      />
      <canvas
        ref={rightRef}
        width={260}
        height={300}
        className="pointer-events-none fixed right-0 top-12 z-[43] hidden sm:block"
        style={{ width: 195, height: 225 }}
        aria-hidden
      />
      <canvas
        ref={treeRef}
        width={150}
        height={190}
        className="pointer-events-none fixed bottom-16 left-0 z-[43]"
        style={{ width: 120, height: 152 }}
        aria-hidden
      />
    </>
  );
}
