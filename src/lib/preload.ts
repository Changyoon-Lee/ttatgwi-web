import type { SceneId } from "@/lib/store";

const preloaded = new Set<SceneId>();

/**
 * N+1 preload: when scene N is active, preload scene N+1.
 * Call from PreloadTrigger when current scene changes.
 */
export function preloadScene(sceneId: SceneId): void {
  if (typeof window === "undefined" || preloaded.has(sceneId)) return;
  preloaded.add(sceneId);

  switch (sceneId) {
    case "hero":
      // Hero assets (blob already in bundle)
      break;
    case "corridor":
      // useGLTF.preload("/models/corridor.glb");
      break;
    case "domains":
      // useGLTF.preload("/models/domain-sculptures.glb");
      break;
    case "method":
      break;
    case "portfolio":
      break;
    case "projectRoom":
      break;
    case "tech":
      break;
    case "team":
      break;
    case "contact":
      break;
    case "void":
      break;
    default:
      break;
  }
}

/**
 * Bulk preload during Entry: hero then corridor (and optionally more).
 * Calls callback when done. Currently sync; add useGLTF.preload etc. later for async.
 */
export function preloadSceneAssets(callback?: () => void): void {
  if (typeof window === "undefined") return;
  preloadScene("hero");
  preloadScene("corridor");
  callback?.();
}
