"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { BlobMesh } from "@/components/blob/BlobMesh";
import { ParticleMist } from "@/components/three/ParticleMist";
import { useBlobController } from "@/components/blob/BlobController";

export function HeroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, z: 5 });
  const { setMouse: setMouseStore, setState } = useBlobController();

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <ParticleMist />
      <group
        position={[0, 0, 0]}
        onPointerMove={(e) => {
          const { x, y } = e.intersections[0]?.point ?? { x: 0, y: 0 };
          setMouse({ x, y, z: 5 });
          setMouseStore(x, y, 5);
        }}
        onPointerEnter={() => setState("hover")}
        onPointerLeave={() => setState("idle")}
      >
        <BlobMesh
          scale={1}
          mouseX={mouse.x}
          mouseY={mouse.y}
          mouseZ={mouse.z}
        />
      </group>
    </group>
  );
}
