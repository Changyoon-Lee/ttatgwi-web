"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "@/lib/store";

/**
 * After first frame is rendered, sets sceneReady so the page can hide the loader.
 * Prevents showing canvas before WebGL has drawn once (reduces context loss risk).
 */
export function SceneReadySignal() {
  const setSceneReady = useStore((s) => s.setSceneReady);
  const fired = useRef(false);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    setSceneReady(true);
  });

  return null;
}
