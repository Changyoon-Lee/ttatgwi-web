"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";

const ITEMS: { label: string; progress: number }[] = [
  { label: "WORK", progress: 5 / 9 },
  { label: "PHILOSOPHY", progress: 1 / 9 },
  { label: "TEAM", progress: 8 / 9 },
  { label: "CONTACT", progress: 1 },
];

export function NavMinimal() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const setScrollProgress = useStore((s) => s.setScrollProgress);

  const handleClick = (progress: number) => {
    const wrapper = document.querySelector("[data-canvas-wrapper]");
    const scrollEl = wrapper?.children[1] as HTMLElement | undefined;
    if (scrollEl && "scrollTop" in scrollEl) {
      const height = scrollEl.scrollHeight - window.innerHeight;
      scrollEl.scrollTo({ top: Math.max(0, progress * height), behavior: "smooth" });
    }
    setScrollProgress(progress);
  };

  return (
    <nav className="fixed top-6 right-6 z-50 flex gap-6 text-sm tracking-widest text-white/80">
      {ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => handleClick(item.progress)}
          className="hover:text-[#7af0ff] transition-colors"
        >
          {item.label}
        </button>
      ))}
      <Link
        href={locale === "en" ? "/ko" : "/en"}
        className="hover:text-[#7af0ff] transition-colors"
      >
        {locale === "en" ? "KR" : "EN"}
      </Link>
    </nav>
  );
}
