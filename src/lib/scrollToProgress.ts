/**
 * Scroll the main scroll container (drei ScrollControls) to a normalized progress (0–1).
 * Uses hybrid scroll state (target + progress) so camera and scroll stay in sync.
 * Container is found by searching [data-canvas-wrapper] for the scrollable div (overflow-y auto, scrollHeight > clientHeight).
 */

import {
  getProgress,
  setProgress,
  setProgressAndTarget,
  setAnimating,
} from "./hybridScroll";

function findScrollableIn(wrapper: Element): HTMLElement | null {
  const overflowY = (el: Element) =>
    typeof (el as HTMLElement).style?.overflowY !== "undefined"
      ? (el as HTMLElement).style.overflowY
      : window.getComputedStyle(el).overflowY;
  const walk = (root: Element): HTMLElement | null => {
    if (root instanceof HTMLElement) {
      const oy = overflowY(root);
      if ((oy === "auto" || oy === "scroll") && root.scrollHeight > root.clientHeight) return root;
    }
    for (let i = 0; i < root.children.length; i++) {
      const found = walk(root.children[i]);
      if (found) return found;
    }
    return null;
  };
  return walk(wrapper);
}

export function getScrollContainer(): { el: HTMLElement; maxScroll: number } | null {
  if (typeof window === "undefined") return null;
  const wrapper = document.querySelector("[data-canvas-wrapper]");
  if (!wrapper) return null;
  const scrollEl = findScrollableIn(wrapper);
  if (!scrollEl || !("scrollTop" in scrollEl)) return null;
  const maxScroll = scrollEl.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return null;
  return { el: scrollEl, maxScroll };
}

export function scrollToProgress(progress: number): void {
  const p = Math.max(0, Math.min(1, progress));
  setProgressAndTarget(p);
  const container = getScrollContainer();
  if (container) {
    container.el.scrollTop = p * container.maxScroll;
  }
}

function runScrollAnimated(
  el: HTMLElement,
  maxScroll: number,
  targetProgress: number,
  durationMs: number
): void {
  const targetP = Math.max(0, Math.min(1, targetProgress));
  setAnimating(true);
  const startP = getProgress();
  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / durationMs);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const p = startP + (targetP - startP) * eased;
    setProgress(p);
    el.scrollTop = p * maxScroll;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      setProgressAndTarget(targetP);
      setAnimating(false);
    }
  }
  requestAnimationFrame(tick);
}

/**
 * rAF-based animated scroll. Retries getScrollContainer until ready (ScrollControls may mount after first paint).
 */
export function scrollToProgressAnimated(
  targetProgress: number,
  durationMs: number,
  options?: { retryMs?: number; retryCount?: number }
): void {
  const retryMs = options?.retryMs ?? 80;
  const retryCount = options?.retryCount ?? 20;

  function tryRun(attempt: number): void {
    const container = getScrollContainer();
    if (container) {
      runScrollAnimated(container.el, container.maxScroll, targetProgress, durationMs);
      return;
    }
    if (attempt < retryCount) {
      setTimeout(() => tryRun(attempt + 1), retryMs);
    }
  }
  tryRun(0);
}
