"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { scrollToProgress } from "@/lib/scrollToProgress";

/** Progress (0–1) per section; aligned with orchestrationSpec scene midpoints. */
const ITEMS: { label: string; progress: number }[] = [
  { label: "HERO", progress: 0.12 },
  { label: "WORK", progress: 0.59 },
  { label: "TEAM", progress: 0.91 },
  { label: "CONTACT", progress: 1 },
];

export function NavMinimal() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const setScrollProgress = useStore((s) => s.setScrollProgress);

  const handleClick = (progress: number) => {
    scrollToProgress(progress);
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
