"use client";

import { useEffect, useRef } from "react";
import { useStore, type SceneId } from "@/lib/store";
import { getPreloadTarget } from "@/lib/camera/orchestrationSpec";
import { preloadScene } from "@/lib/preload";

/**
 * N+1 preload: when current scene is active, preload next scene.
 * Runs when currentScene (from store) changes.
 */
export function PreloadTrigger() {
  const currentScene = useStore((s) => s.currentScene);
  const lastPreloaded = useRef<SceneId | null>(null);

  useEffect(() => {
    const next = getPreloadTarget(currentScene);
    if (next && next !== lastPreloaded.current) {
      lastPreloaded.current = next;
      preloadScene(next);
    }
  }, [currentScene]);

  return null;
}
