"use client";

import { useState, useEffect, useRef } from "react";

/**
 * DOM overlay: subtle glow that follows the mouse. pointer-events: none so it doesn't block scroll/click.
 * Uses CSS transform and transition for smooth, low-cost updates. No WebGL, no frame drop.
 */
export function MouseGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>(0);
  const pendingRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const onMove = (e: MouseEvent) => {
      pendingRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === 0) {
        rafRef.current = requestAnimationFrame(() => {
          setPos(pendingRef.current);
          rafRef.current = 0;
        });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10"
      aria-hidden
    >
      <div
        className="absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl transition-[left,top] duration-150 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          background: "radial-gradient(circle, #7af0ff 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-xl transition-[left,top] duration-100 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          background: "radial-gradient(circle, #7af0ff 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
