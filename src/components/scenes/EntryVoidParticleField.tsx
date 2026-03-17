"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1000;
const SIZE = 0.03;
const OPACITY = 0.4;

/** Fine particles for depth and motion. Drift in +Z for infinite void feel. */
export function EntryVoidParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = -Math.random() * 40;
    }
    return arr;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      (pos.array as Float32Array)[i * 3 + 2] += 0.01;
      if ((pos.array as Float32Array)[i * 3 + 2] > 5) {
        (pos.array as Float32Array)[i * 3 + 2] = -40;
      }
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
