import type { SceneId } from "@/lib/store";

const preloaded = new Set<SceneId>();

/** 무거운 씬은 한 프레임 넘겨 초기 WebGL 스파이크를 조금 나눈다. */
const ASYNC_DEFER_MS: Partial<Record<SceneId, number>> = {
  portfolio: 24,
  projectRoom: 24,
  tech: 16,
  team: 16,
};

function runPreloadWork(sceneId: SceneId): void {
  switch (sceneId) {
    case "hero":
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
 * 동기 프리로드: Void 진입 등 즉시 표시가 필요할 때.
 * `preloadSceneAsync`와 동일한 `preloaded` 집합을 쓴다.
 */
export function preloadScene(sceneId: SceneId): void {
  if (typeof window === "undefined" || preloaded.has(sceneId)) return;
  runPreloadWork(sceneId);
  preloaded.add(sceneId);
}

/**
 * 다음 씬 N+1용. 완료 시점에 스토어 `nextScenePreloadReady`를 올리기 위해 Promise로 감싼다.
 * (실제 GLTF 등 비동기 로드가 들어오면 여기서 await 하면 됨.)
 */
export function preloadSceneAsync(sceneId: SceneId): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (preloaded.has(sceneId)) return Promise.resolve();

  const deferMs = ASYNC_DEFER_MS[sceneId] ?? 0;

  return (async () => {
    if (deferMs > 0) {
      await new Promise<void>((r) => setTimeout(r, deferMs));
    }
    if (preloaded.has(sceneId)) return;
    runPreloadWork(sceneId);
    preloaded.add(sceneId);
  })();
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
