"use client";

import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { getSceneIdFromProgress } from "@/lib/camera/sceneRanges";

export function ScrollController() {
  const scroll = useScroll();
  const setScrollProgress = useStore((s) => s.setScrollProgress);
  const setCurrentScene = useStore((s) => s.setCurrentScene);
  const globalProgress = useStore((s) => s.globalProgress);

  useFrame(() => {
    if (scroll) {
      setScrollProgress(scroll.offset);
      setCurrentScene(getSceneIdFromProgress(globalProgress));
    }
  });

  return null;
}
