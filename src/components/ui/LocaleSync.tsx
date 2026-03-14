"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";

/**
 * Suppress THREE.Clock deprecation warning (R3F/Three internals; we cannot fix without upgrading).
 * Dev only; one-time patch.
 */
function suppressClockDeprecationOnce() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  const original = console.warn;
  console.warn = function (...args: unknown[]) {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("Clock") && msg.includes("deprecated")) return;
    original.apply(console, args);
  };
}

/**
 * Syncs URL locale (en/ko) to store.language so that /ko shows Korean and /en shows English.
 * Run once on mount and when locale param changes.
 */
export function LocaleSync() {
  const params = useParams();
  const setLanguage = useStore((s) => s.setLanguage);
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    suppressClockDeprecationOnce();
  }, []);

  useEffect(() => {
    setLanguage(locale === "ko" ? "ko" : "en");
  }, [locale, setLanguage]);

  return null;
}
