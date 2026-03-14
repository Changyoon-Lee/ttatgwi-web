/**
 * Scroll the main scroll container to a normalized progress (0–1).
 * Used when exiting Project Room to restore portfolio section.
 * Depends on drei ScrollControls structure: wrapper > div (scroll container).
 */
export function scrollToProgress(progress: number): void {
  if (typeof window === "undefined") return;
  const wrapper = document.querySelector("[data-canvas-wrapper]");
  const scrollEl = wrapper?.children[1] as HTMLElement | undefined;
  if (!scrollEl || !("scrollTop" in scrollEl)) return;
  const maxScroll = scrollEl.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;
  const targetTop = Math.max(0, Math.min(1, progress)) * maxScroll;
  scrollEl.scrollTo({ top: targetTop, behavior: "smooth" });
}
