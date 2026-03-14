"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { createBlobMaterial } from "./BlobMaterial";
import { useStore } from "@/lib/store";

const RADIUS = 1.5;
const DETAIL_DESKTOP = 6;
const DETAIL_MOBILE = 3;

type BlobMeshProps = {
  scale?: number;
  mouseX?: number;
  mouseY?: number;
  mouseZ?: number;
};

export function BlobMesh({
  scale = 1,
  mouseX = 0,
  mouseY = 0,
  mouseZ = 5,
}: BlobMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();
  const scrollProgress = useStore((s) => s.scrollProgress);
  const blobState = useStore((s) => s.blobState);

  const envMap = useMemo(() => {
    const env = scene.environment;
    return env && env instanceof THREE.Texture ? env : null;
  }, [scene.environment]);

  const [detail, setDetail] = useState(DETAIL_DESKTOP);
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );
    setDetail(isMobile ? DETAIL_MOBILE : DETAIL_DESKTOP);
  }, []);

  const material = useMemo(() => createBlobMaterial(envMap), [envMap]);
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(RADIUS, detail),
    [detail]
  );

  useFrame((state) => {
    if (!material.uniforms) return;
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uMouse.value.set(mouseX, mouseY, mouseZ);

    // Scroll morph: amplitude follows scrollProgress
    u.uAmplitude.value = 0.08 + scrollProgress * 0.1;
    u.uFrequency.value = 1.5;

    if (blobState === "hover") {
      u.uAmplitude.value += 0.06;
    }
    if (blobState === "portal") {
      u.uAmplitude.value += 0.12;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  const formationScale =
    scrollProgress < 0.12
      ? 0.01 + (scrollProgress / 0.12) * 0.99
      : 1;
  const finalScale = scale * formationScale;

  return (
    <mesh ref={meshRef} geometry={geometry} scale={finalScale}>
      <primitive object={material} attach="material" />
    </mesh>
  );
}
