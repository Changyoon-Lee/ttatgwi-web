/**
 * Scroll → progress: scrollY → normalize → damped progress → scene progress.
 * Recommended damping 0.08–0.12 (MainCanvas uses 0.12).
 */
export const PROGRESS_LERP = 0.08;

/** Ease raw scroll offset (0~1) into smoothed progress. Call every frame. */
export function easeProgress(
  current: number,
  target: number,
  lerpFactor: number = PROGRESS_LERP
): number {
  return current + (target - current) * lerpFactor;
}
