"use client";

import { useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { BlobState } from "@/lib/store";

export function useBlobController() {
  const mouseRef = useRef({ x: 0, y: 0, z: 5 });
  const setBlobState = useStore((s) => s.setBlobState);
  const scrollProgress = useStore((s) => s.scrollProgress);

  const setMouse = useCallback((x: number, y: number, z: number = 5) => {
    mouseRef.current = { x, y, z };
  }, []);

  const setState = useCallback((state: BlobState) => {
    setBlobState(state);
  }, [setBlobState]);

  return {
    mouseRef,
    setMouse,
    setState,
    scrollProgress,
  };
}
