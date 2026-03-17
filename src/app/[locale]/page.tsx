"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { NavMinimal } from "@/components/ui/NavMinimal";
import { HeroOverlay } from "@/components/ui/HeroOverlay";
import { SlideViewer } from "@/components/ui/SlideViewer";
import { LocaleSync } from "@/components/ui/LocaleSync";
import { ScrollIndicatorUI } from "@/components/ui/ScrollIndicatorUI";
import { MouseGlow } from "@/components/ui/MouseGlow";
import { scrollToProgressAnimated } from "@/lib/scrollToProgress";

const MainCanvas = dynamic(
  () =>
    import("@/components/three/MainCanvas").then((m) => ({ default: m.MainCanvas })),
  { ssr: false }
);

const HERO_PROGRESS = 0.12;
const AUTO_SCROLL_DELAY_MS = 1500;
const AUTO_SCROLL_DURATION_MS = 1000;
const USER_SCROLLED_THRESHOLD = 0.05;

/**
 * Delay Canvas mount until after first paint to reduce WebGL context loss on initial load.
 * Loader hidden when sceneReady (first frame). Auto-scroll to Hero when scene2Ready and user hasn't scrolled.
 */
export default function HomePage() {
  const [canvasReady, setCanvasReady] = useState(false);
  const sceneReady = useStore((s) => s.sceneReady);
  const scene2Ready = useStore((s) => s.scene2Ready);
  const autoScrollDone = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setCanvasReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!scene2Ready || autoScrollDone.current) return;
    const t = setTimeout(() => {
      if (autoScrollDone.current) return;
      if (useStore.getState().globalProgress >= USER_SCROLLED_THRESHOLD) return;
      autoScrollDone.current = true;
      scrollToProgressAnimated(HERO_PROGRESS, AUTO_SCROLL_DURATION_MS);
    }, AUTO_SCROLL_DELAY_MS);
    return () => clearTimeout(t);
  }, [scene2Ready]);

  const showLoader = !sceneReady;

  return (
    <>
      <LocaleSync />
      <div className="fixed inset-0 bg-[#05070d] -z-10" aria-hidden />
      {canvasReady && <MainCanvas />}
      {showLoader && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[#05070d]"
          aria-hidden
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7af0ff]/30 border-t-[#7af0ff]" />
        </div>
      )}
      <MouseGlow />
      <HeroOverlay />
      <NavMinimal />
      <ScrollIndicatorUI />
      <SlideViewer />
    </>
  );
}
