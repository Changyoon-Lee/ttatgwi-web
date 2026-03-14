"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1800;
const SIZE = 0.02;
const OPACITY = 0.3;

/** Subtle mist for depth and ambient motion. Particles drift slowly. */
export function ParticleMist() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      pos.array[i * 3] += Math.sin(time * 0.2 + i * 0.01) * 0.002;
      pos.array[i * 3 + 1] += Math.cos(time * 0.15 + i * 0.02) * 0.0015;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={SIZE}
        color="#c9e7ff"
        transparent
        opacity={OPACITY}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
