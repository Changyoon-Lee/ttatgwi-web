"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";

const COUNT = 1200;

type ParticleSystemProps = {
  color?: string;
  size?: number;
};

export function ParticleSystem({ color = "#00f0ff", size = 0.02 }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      sizes[i] = size * (0.5 + Math.random());
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return geom;
  }, [size]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
