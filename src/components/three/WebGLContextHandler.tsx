"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Listens for WebGL context lost/restored and tries to recover.
 * Context loss can happen on first load or when tab is backgrounded.
 */
export function WebGLContextHandler() {
  const { gl, invalidate } = useThree();
  const invalidateRef = useRef(invalidate);

  useEffect(() => {
    invalidateRef.current = invalidate;
  }, [invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };

    const onContextRestored = () => {
      invalidateRef.current?.();
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    };
  }, [gl]);

  return null;
}
