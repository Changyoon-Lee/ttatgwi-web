"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";

export function LanguageSwitch() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const setLanguage = useStore((s) => s.setLanguage);

  const toggle = () => {
    const next = locale === "en" ? "ko" : "en";
    setLanguage(next as "en" | "ko");
  };

  return (
    <div className="flex gap-2">
      <Link
        href="/en"
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 text-sm ${locale === "en" ? "text-[#00f0ff]" : "text-white/60"}`}
      >
        EN
      </Link>
      <span className="text-white/40">|</span>
      <Link
        href="/ko"
        onClick={() => setLanguage("ko")}
        className={`px-2 py-1 text-sm ${locale === "ko" ? "text-[#00f0ff]" : "text-white/60"}`}
      >
        KR
      </Link>
    </div>
  );
}
