import type { SceneId } from "@/lib/store";

/** Camera behavior mode per scene. */
export type CameraMode =
  | "slow-drift"
  | "orbit"
  | "forward-travel"
  | "gallery-orbit"
  | "focus-push"
  | "drift-explore"
  | "rail-camera"
  | "centered-orbit"
  | "constellation-orbit"
  | "settle-focus";

/** Look target description (used for CameraRig logic). */
export type LookTarget =
  | "hero-silhouette"
  | "hero-center"
  | "path-forward"
  | "domain-center"
  | "transformation-core"
  | "active-node-or-center"
  | "slide-focus"
  | "tech-core"
  | "team-core"
  | "contact-sculpture";

/** Scene lifecycle for rendering and preload. */
export type SceneLifecycleState = "inactive" | "preloaded" | "active";

export type InteractionType =
  | "none"
  | "hover-ripple-click-portal"
  | "scroll-speed"
  | "hover-focus-click-explore"
  | "scroll-progression"
  | "hover-preview-click-open"
  | "slide-navigation"
  | "hover-tech-node"
  | "hover-member-click-detail"
  | "click-contact";

/**
 * tattgwi.dev Scene Orchestration Spec
 * Single source of truth for scroll progress, camera mode, look target, interaction, preload, lifecycle.
 */
export interface SceneSpec {
  id: SceneId;
  progressStart: number;
  progressEnd: number;
  cameraMode: CameraMode;
  lookTarget: LookTarget;
  interaction: InteractionType;
  /** Next scene to preload when this scene is active (N+1 strategy). */
  preloadNext: SceneId | null;
  /** Project Room has no scroll range; driven by interaction mode. */
  isDynamic: boolean;
}

export const ORCHESTRATION_SPEC: SceneSpec[] = [
  {
    id: "void",
    progressStart: 0.0,
    progressEnd: 0.08,
    cameraMode: "slow-drift",
    lookTarget: "hero-silhouette",
    interaction: "none",
    preloadNext: "hero",
    isDynamic: false,
  },
  {
    id: "hero",
    progressStart: 0.08,
    progressEnd: 0.18,
    cameraMode: "orbit",
    lookTarget: "hero-center",
    interaction: "hover-ripple-click-portal",
    preloadNext: "corridor",
    isDynamic: false,
  },
  {
    id: "corridor",
    progressStart: 0.18,
    progressEnd: 0.28,
    cameraMode: "forward-travel",
    lookTarget: "path-forward",
    interaction: "scroll-speed",
    preloadNext: "domains",
    isDynamic: false,
  },
  {
    id: "domains",
    progressStart: 0.28,
    progressEnd: 0.4,
    cameraMode: "gallery-orbit",
    lookTarget: "domain-center",
    interaction: "hover-focus-click-explore",
    preloadNext: "method",
    isDynamic: false,
  },
  {
    id: "method",
    progressStart: 0.4,
    progressEnd: 0.52,
    cameraMode: "focus-push",
    lookTarget: "transformation-core",
    interaction: "scroll-progression",
    preloadNext: "portfolio",
    isDynamic: false,
  },
  {
    id: "portfolio",
    progressStart: 0.52,
    progressEnd: 0.66,
    cameraMode: "drift-explore",
    lookTarget: "active-node-or-center",
    interaction: "hover-preview-click-open",
    preloadNext: "projectRoom",
    isDynamic: false,
  },
  {
    id: "projectRoom",
    progressStart: 0.66,
    progressEnd: 0.78,
    cameraMode: "rail-camera",
    lookTarget: "slide-focus",
    interaction: "slide-navigation",
    preloadNext: "tech",
    isDynamic: true,
  },
  {
    id: "tech",
    progressStart: 0.78,
    progressEnd: 0.87,
    cameraMode: "centered-orbit",
    lookTarget: "tech-core",
    interaction: "hover-tech-node",
    preloadNext: "team",
    isDynamic: false,
  },
  {
    id: "team",
    progressStart: 0.87,
    progressEnd: 0.95,
    cameraMode: "constellation-orbit",
    lookTarget: "team-core",
    interaction: "hover-member-click-detail",
    preloadNext: "contact",
    isDynamic: false,
  },
  {
    id: "contact",
    progressStart: 0.95,
    progressEnd: 1.0,
    cameraMode: "settle-focus",
    lookTarget: "contact-sculpture",
    interaction: "click-contact",
    preloadNext: null,
    isDynamic: false,
  },
];

const SCENE_ORDER: SceneId[] = ORCHESTRATION_SPEC.map((s) => s.id);

export function getSpec(sceneId: SceneId): SceneSpec | undefined {
  return ORCHESTRATION_SPEC.find((s) => s.id === sceneId);
}

export function getSceneIndex(sceneId: SceneId): number {
  const i = SCENE_ORDER.indexOf(sceneId);
  return i >= 0 ? i : 0;
}

export function getSceneIdFromIndex(index: number): SceneId {
  return SCENE_ORDER[Math.max(0, Math.min(index, SCENE_ORDER.length - 1))] ?? "void";
}

/** Visible scene indices: current ± 1 for render performance. */
export function getVisibleSceneIndices(currentIndex: number): number[] {
  const min = Math.max(0, currentIndex - 1);
  const max = Math.min(SCENE_ORDER.length - 1, currentIndex + 1);
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

/** Lifecycle: active = current, preloaded = next (for preload trigger), inactive = rest. */
export function getSceneLifecycle(
  currentIndex: number
): Record<SceneId, SceneLifecycleState> {
  const state: Record<SceneId, SceneLifecycleState> = {} as Record<
    SceneId,
    SceneLifecycleState
  >;
  SCENE_ORDER.forEach((id, i) => {
    if (i === currentIndex) state[id] = "active";
    else if (i === currentIndex + 1) state[id] = "preloaded";
    else state[id] = "inactive";
  });
  return state;
}

/** Preload next scene when entering this scene. */
export function getPreloadTarget(currentSceneId: SceneId): SceneId | null {
  return getSpec(currentSceneId)?.preloadNext ?? null;
}
