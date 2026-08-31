"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

// Real WebGL 3D — glossy ornament clusters, a small pine tree and falling
// snow are actual lit 3D geometry (Three.js), not flat CSS shapes pretending
// to have depth. Everything sits in the page corners and edges so the
// products themselves are never covered; the canvas is fully transparent
// everywhere there's no geometry, and pointer-events are off throughout so
// nothing here can ever block a click.
export function Christmas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (disposed || !containerRef.current) return;

      const GOLD = 0xe8c766;
      const GOLD_DEEP = 0xc9a227;
      const RED = 0xc8102e;
      const RED_DEEP = 0x8f0f24;
      const GREEN = 0x175c3a;
      const PEARL = 0xfdf6e8;
      const ORNAMENT_COLORS = [RED, GOLD, GREEN, PEARL, GOLD_DEEP, RED_DEEP];

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 13);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.style.display = "block";
      containerRef.current.appendChild(renderer.domElement);

      // Warm, cozy lighting — this is what actually sells the "3D" look on
      // the glossy ornament material, not just the geometry.
      scene.add(new THREE.AmbientLight(0xfff1d6, 0.6));
      const warmLight = new THREE.PointLight(0xffce7a, 1.5, 34);
      warmLight.position.set(-7, 6, 9);
      scene.add(warmLight);
      const coolFill = new THREE.PointLight(0xfff6d8, 1, 34);
      coolFill.position.set(7, 3, 7);
      scene.add(coolFill);

      type Ornament = { mesh: THREE.Mesh; baseY: number; bobSpeed: number; bobOffset: number };
      const ornaments: Ornament[] = [];

      function makeOrnament(x: number, y: number, z: number, size: number, color: number) {
        const geo = new THREE.SphereGeometry(size, 28, 28);
        const mat = new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.6,
          roughness: 0.16,
          clearcoat: 0.65,
          clearcoatRoughness: 0.12,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        ornaments.push({ mesh, baseY: y, bobSpeed: 0.55 + Math.random() * 0.5, bobOffset: Math.random() * Math.PI * 2 });
      }

      // Ornament clusters hanging from the top-left and top-right corners —
      // the site's content stays clear in the middle.
      const perSide = isMobile ? 3 : 5;
      for (let i = 0; i < perSide; i++) {
        const size = 0.42 + Math.random() * 0.3;
        makeOrnament(-8.4 + Math.random() * 1.6, 5.4 - i * 0.95, -2 + Math.random(), size, ORNAMENT_COLORS[i % ORNAMENT_COLORS.length]);
        makeOrnament(8.4 - Math.random() * 1.6, 5.4 - i * 0.95, -2 + Math.random(), size, ORNAMENT_COLORS[(i + 3) % ORNAMENT_COLORS.length]);
      }

      // A small pine tree tucked in the bottom-left corner, mostly offscreen.
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.32, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.9 })
      );
      trunk.position.y = -0.5;
      treeGroup.add(trunk);
      const pineMat = new THREE.MeshStandardMaterial({ color: 0x0f4a30, roughness: 0.7 });
      const tiers = 4;
      for (let i = 0; i < tiers; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.55 - i * 0.3, 1.25, 10), pineMat);
        cone.position.y = i * 0.82;
        treeGroup.add(cone);
      }
      for (let i = 0; i < 7; i++) {
        const tier = i % tiers;
        const angle = Math.random() * Math.PI * 2;
        const r = (1.55 - tier * 0.3) * 0.7;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 14, 14),
          new THREE.MeshPhysicalMaterial({ color: ORNAMENT_COLORS[i % ORNAMENT_COLORS.length], metalness: 0.55, roughness: 0.2, clearcoat: 0.5 })
        );
        bulb.position.set(Math.cos(angle) * r, tier * 0.82 + 0.2, Math.sin(angle) * r);
        treeGroup.add(bulb);
      }
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffbf3f, emissiveIntensity: 1.3, roughness: 0.3 })
      );
      star.position.y = tiers * 0.82 + 0.45;
      treeGroup.add(star);
      const starLight = new THREE.PointLight(0xffcf6b, 1.2, 7);
      starLight.position.copy(star.position);
      treeGroup.add(starLight);
      treeGroup.position.set(-8.6, -4.8, -1);
      treeGroup.scale.setScalar(isMobile ? 0.8 : 1.05);
      scene.add(treeGroup);

      // Sparse, real 3D falling snow — instanced so hundreds of flakes cost
      // one draw call instead of one DOM node each.
      const snowCount = isMobile ? 36 : 70;
      const snow = new THREE.InstancedMesh(
        new THREE.IcosahedronGeometry(0.055, 0),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x2a2a2a }),
        snowCount
      );
      scene.add(snow);
      const snowState = Array.from({ length: snowCount }, () => ({
        x: (Math.random() - 0.5) * 22,
        y: Math.random() * 14 - 5,
        z: (Math.random() - 0.5) * 8 - 2,
        speed: 0.4 + Math.random() * 0.5,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.3 + Math.random() * 0.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.2,
        scale: 0.6 + Math.random() * 1.3,
      }));
      const dummy = new THREE.Object3D();

      function layout() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      layout();
      const onResize = () => layout();
      window.addEventListener("resize", onResize);

      let tabVisible = !document.hidden;
      const onVisibility = () => {
        tabVisible = !document.hidden;
      };
      document.addEventListener("visibilitychange", onVisibility);

      const clock = new THREE.Clock();
      const speedMul = reducedMotion ? 0.25 : 1;

      function animate() {
        raf = requestAnimationFrame(animate);
        if (!tabVisible) return;
        const t = clock.getElapsedTime() * speedMul;

        for (const o of ornaments) {
          o.mesh.position.y = o.baseY + Math.sin(t * o.bobSpeed + o.bobOffset) * 0.25;
          o.mesh.rotation.y += 0.01;
          o.mesh.rotation.x += 0.004;
        }

        treeGroup.rotation.y = Math.sin(t * 0.2) * 0.08;
        star.rotation.y += 0.012;

        for (let i = 0; i < snowCount; i++) {
          const s = snowState[i];
          s.y -= s.speed * 0.02 * speedMul;
          if (s.y < -7.5) {
            s.y = 7.5;
            s.x = (Math.random() - 0.5) * 22;
          }
          const sway = Math.sin(t * s.swaySpeed + s.sway) * 0.6;
          s.rot += s.rotSpeed * 0.02;
          dummy.position.set(s.x + sway, s.y, s.z);
          dummy.rotation.set(s.rot, s.rot * 0.6, 0);
          dummy.scale.setScalar(s.scale);
          dummy.updateMatrix();
          snow.setMatrixAt(i, dummy.matrix);
        }
        snow.instanceMatrix.needsUpdate = true;

        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[43]" aria-hidden />;
}
