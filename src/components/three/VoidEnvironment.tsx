"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Sets scene background and fog for void/cinematic intro feel. */
export function VoidEnvironment() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color("#05070d");
    scene.fog = new THREE.Fog("#05070d", 10, 80);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}
