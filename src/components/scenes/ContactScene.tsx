"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ACCENT = "#7af0ff";

/** Quiet liquid sculpture: single soft form. */
export function ContactScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.5, 32, 48]} />
        <meshPhysicalMaterial
          color={ACCENT}
          transparent
          opacity={0.3}
          transmission={0.92}
          thickness={0.3}
          roughness={0.08}
        />
      </mesh>
      <mesh position={[0, 0, 0]} scale={0.7}>
        <icosahedronGeometry args={[1, 2]} />
        <meshPhysicalMaterial
          color="#b48dff"
          transparent
          opacity={0.2}
          transmission={0.9}
          thickness={0.25}
        />
      </mesh>
    </group>
  );
}
