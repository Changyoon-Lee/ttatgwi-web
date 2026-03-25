"use client";

import { useEffect } from "react";
import { getScrollContainer } from "@/lib/scrollToProgress";
import { notifyWheel } from "@/lib/hybridScroll";

/**
 * Listens to wheel on the scroll container and updates hybrid scroll target only.
 * Prevents default scroll so progress is driven by velocity clamp in CameraRig.
 */
export function HybridScrollWheel() {
  useEffect(() => {
    let mounted = true;
    let wheelEl: HTMLElement | null = null;
    let attempts = 0;
    const maxAttempts = 50;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      notifyWheel(e.deltaY);
    };

    const interval = setInterval(() => {
      if (!mounted) return;
      const container = getScrollContainer();
      if (container || attempts >= maxAttempts) {
        clearInterval(interval);
        if (!container) return;
        wheelEl = container.el;
        wheelEl.addEventListener("wheel", onWheel, { passive: false });
      }
      attempts++;
    }, 80);
    return () => {
      mounted = false;
      clearInterval(interval);
      if (wheelEl) wheelEl.removeEventListener("wheel", onWheel);
    };
  }, []);

  return null;
}
