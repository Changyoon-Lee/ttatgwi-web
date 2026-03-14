"use client";

import { useStore } from "@/lib/store";

const HERO_TEXT = {
  en: {
    title: "TATTGWI",
    subtitle: "We sense what matters and build it into form.",
  },
  ko: {
    title: "TATTGWI",
    subtitle: "필요한 것을 감지하고 형태로 만듭니다.",
  },
};

export function HeroOverlay() {
  const language = useStore((s) => s.language);
  const currentScene = useStore((s) => s.currentScene);
  const scrollProgress = useStore((s) => s.scrollProgress);
  const text = HERO_TEXT[language];
  const show = currentScene === "hero";
  const textOpacity = show
    ? Math.min(1, Math.max(0, (scrollProgress - 0.08) / 0.06))
    : 0;

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-12 left-8 z-40 flex max-w-lg flex-col items-start text-left transition-opacity duration-700 md:bottom-16 md:left-12"
      style={{ opacity: textOpacity }}
      aria-hidden
    >
      <h1 className="text-4xl font-bold tracking-[0.4em] text-white md:text-6xl">
        {text.title}
      </h1>
      <p className="mt-4 text-lg text-white/80 md:text-xl">
        {text.subtitle}
      </p>
    </div>
  );
}
