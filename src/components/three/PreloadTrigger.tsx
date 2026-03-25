"use client";

import { useEffect } from "react";
import { useStore, type SceneId } from "@/lib/store";
import { getPreloadTarget } from "@/lib/camera/orchestrationSpec";
import { preloadSceneAsync } from "@/lib/preload";

let lastPreloadLogAt = 0;
let lastPreloadKey = "";
function logPreloadCompleteOnce(from: SceneId, next: SceneId) {
  const key = `${from}→${next}`;
  const t = performance.now();
  if (key === lastPreloadKey && t - lastPreloadLogAt < 400) return;
  lastPreloadKey = key;
  lastPreloadLogAt = t;
  console.log("[scene-preload]", { from, next });
}

/**
 * N+1 preload: 현재 씬이 활성일 때 다음 씬을 비동기로 준비하고,
 * 완료 후 `nextScenePreloadReady`를 true로 올려 씬 경계 전진 스크롤을 허용한다.
 */
export function PreloadTrigger() {
  const currentScene = useStore((s) => s.currentScene);
  const DEBUG_SCENE_LOAD = process.env.NODE_ENV !== "production";

  useEffect(() => {
    const { setNextScenePreloadReady } = useStore.getState();
    const next = getPreloadTarget(currentScene);
    if (!next) {
      setNextScenePreloadReady(true);
      return;
    }

    setNextScenePreloadReady(false);
    let cancelled = false;

    preloadSceneAsync(next).then(() => {
      if (cancelled) return;
      setNextScenePreloadReady(true);
      if (DEBUG_SCENE_LOAD) {
        logPreloadCompleteOnce(currentScene, next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentScene]);

  return null;
}
