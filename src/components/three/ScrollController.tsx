"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { getSceneIdFromProgress } from "@/lib/camera/sceneRanges";

export function ScrollController() {
  const scroll = useScroll();
  const setScrollProgress = useStore((s) => s.setScrollProgress);
  const setCurrentScene = useStore((s) => s.setCurrentScene);
  const setScrollSpeed = useStore((s) => s.setScrollSpeed);
  const globalProgress = useStore((s) => s.globalProgress);
  const prevOffset = useRef(0);

  useFrame(() => {
    if (scroll) {
      const offset = scroll.offset;
      setScrollProgress(offset);
      setScrollSpeed(Math.abs(offset - prevOffset.current));
      prevOffset.current = offset;
      setCurrentScene(getSceneIdFromProgress(globalProgress));
    }
  });

  return null;
}
