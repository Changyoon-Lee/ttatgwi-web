"use client";

import { useStore } from "@/lib/store";

const HIDE_AT = 0.12;
/** Show indicator when scroll delta per frame is below this (slow scroll). */
const SLOW_SPEED_THRESHOLD = 0.0025;

/**
 * 웹 UI 스크롤 인디케이터. 화면 하단 고정.
 * - Void/입장 구간(progress < 0.12) 또는
 * - 스크롤 속도가 느릴 때(씬 중간) 표시.
 */
export function ScrollIndicatorUI() {
  const globalProgress = useStore((s) => s.globalProgress);
  const scrollSpeed = useStore((s) => s.scrollSpeed);

  const inVoidEntrance = globalProgress < HIDE_AT;
  const scrollIsSlow = scrollSpeed < SLOW_SPEED_THRESHOLD && scrollSpeed >= 0;
  const show = inVoidEntrance || (scrollIsSlow && globalProgress < 0.95);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
      aria-hidden
    >
      <span className="text-xs tracking-widest text-[#7af0ff]/80">SCROLL</span>
      <div className="h-10 w-px bg-gradient-to-b from-[#7af0ff]/60 to-transparent" />
      <div
        className="h-2 w-2 rounded-full border border-[#7af0ff]/70 bg-[#7af0ff]/20 animate-bounce"
        style={{ animationDuration: "1.2s" }}
      />
    </div>
  );
}
