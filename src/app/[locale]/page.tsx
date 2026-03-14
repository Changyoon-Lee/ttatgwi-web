"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NavMinimal } from "@/components/ui/NavMinimal";
import { HeroOverlay } from "@/components/ui/HeroOverlay";
import { SlideViewer } from "@/components/ui/SlideViewer";
import { LocaleSync } from "@/components/ui/LocaleSync";

const MainCanvas = dynamic(
  () =>
    import("@/components/three/MainCanvas").then((m) => ({ default: m.MainCanvas })),
  { ssr: false }
);

/**
 * Delay Canvas mount until after first paint to reduce WebGL context loss on initial load.
 */
export default function HomePage() {
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setCanvasReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <LocaleSync />
      <div className="fixed inset-0 bg-[#05070d] -z-10" aria-hidden />
      {canvasReady && <MainCanvas />}
      <HeroOverlay />
      <NavMinimal />
      <SlideViewer />
    </>
  );
}
