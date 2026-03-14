import type { SceneId } from "@/lib/store";
import { ORCHESTRATION_SPEC } from "./orchestrationSpec";

/** Derived from orchestration spec: progress ranges per scene. */
export const SCENE_RANGES = ORCHESTRATION_SPEC.map((s) => ({
  id: s.id,
  start: s.progressStart,
  end: s.progressEnd,
}));

/** Local progress 0~1 within a section. */
export function getSectionProgress(
  globalProgress: number,
  sectionStart: number,
  sectionEnd: number
): number {
  if (sectionEnd <= sectionStart) return 0;
  return Math.max(0, Math.min(1, (globalProgress - sectionStart) / (sectionEnd - sectionStart)));
}

export function getSceneIdFromProgress(progress: number): SceneId {
  const found = SCENE_RANGES.find((r) => progress >= r.start && progress < r.end);
  return found?.id ?? "void";
}

export function getSceneRange(id: SceneId): { start: number; end: number } | null {
  const r = SCENE_RANGES.find((x) => x.id === id);
  return r ? { start: r.start, end: r.end } : null;
}
