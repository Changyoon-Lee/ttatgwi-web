"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { EntryVoidParticleField } from "./EntryVoidParticleField";
import { preloadSceneAssets } from "@/lib/preload";

/**
 * Entry Void + Loading Transition.
 * Cinematic intro: void env, particle field, then camera drifts → blob forms in Hero.
 * Runs preload for next scenes (Corridor, Domain, etc.) while user is in void.
 */
export function VoidEntranceScene() {
  const groupRef = useRef<THREE.Group>(null);
  const setScene2Ready = useStore((s) => s.setScene2Ready);
  useEffect(() => {
    preloadSceneAssets(() => setScene2Ready(true));
  }, [setScene2Ready]);
  return (
    <group ref={groupRef}>
      <EntryVoidParticleField />
    </group>
  );
}
