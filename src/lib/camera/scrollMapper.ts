/**
 * Scroll → progress: scrollY → normalize → damped progress → scene progress.
 * Higher = scene follows scroll position faster (less "scroll then sudden jump").
 * Recommended range 0.08–0.15.
 */
export const PROGRESS_LERP = 0.12;

/** Ease raw scroll offset (0~1) into smoothed progress. Call every frame. */
export function easeProgress(
  current: number,
  target: number,
  lerpFactor: number = PROGRESS_LERP
): number {
  return current + (target - current) * lerpFactor;
}
