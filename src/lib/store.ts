import { create } from "zustand";

export type SceneId =
  | "void"
  | "hero"
  | "corridor"
  | "domains"
  | "method"
  | "portfolio"
  | "projectRoom"
  | "tech"
  | "team"
  | "contact";

export type BlobState = "idle" | "hover" | "active" | "portal";

export type InteractionMode = "scroll" | "focus" | "project-room" | "returning";

type AppStore = {
  currentScene: SceneId;
  scrollProgress: number;
  /** Eased 0~1 for camera; updated by CameraRig. */
  globalProgress: number;
  /** First frame rendered (void+hero visible); used to hide loader. */
  sceneReady: boolean;
  /** Hero + next scene(s) preload done; used for auto-scroll to Hero. */
  scene2Ready: boolean;
  /**
   * `preloadNext` 대상 씬 에셋/등록 준비 완료.
   * false일 때 씬 경계로의 전진 스크롤(다음 체크포인트)은 막는다.
   */
  nextScenePreloadReady: boolean;
  /** Scroll delta per frame (0~1); used by ScrollIndicatorUI. */
  scrollSpeed: number;
  activeProject: string | null;
  projectRoomSlideIndex: number;
  language: "en" | "ko";
  blobState: BlobState;
  interactionMode: InteractionMode;
  setCurrentScene: (scene: SceneId) => void;
  setScrollProgress: (progress: number) => void;
  setGlobalProgress: (p: number) => void;
  setSceneReady: (v: boolean) => void;
  setScene2Ready: (v: boolean) => void;
  setNextScenePreloadReady: (v: boolean) => void;
  setScrollSpeed: (v: number) => void;
  setActiveProject: (slug: string | null) => void;
  setProjectRoomSlideIndex: (index: number) => void;
  setLanguage: (lang: "en" | "ko") => void;
  setBlobState: (state: BlobState) => void;
  setInteractionMode: (mode: InteractionMode) => void;
};

export const useStore = create<AppStore>((set) => ({
  currentScene: "void",
  scrollProgress: 0,
  globalProgress: 0,
  sceneReady: false,
  scene2Ready: false,
  nextScenePreloadReady: true,
  scrollSpeed: 0,
  activeProject: null,
  projectRoomSlideIndex: 0,
  language: "en",
  blobState: "idle",
  interactionMode: "scroll",
  setCurrentScene: (currentScene) => set({ currentScene }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setGlobalProgress: (globalProgress) => set({ globalProgress }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setScene2Ready: (scene2Ready) => set({ scene2Ready }),
  setNextScenePreloadReady: (nextScenePreloadReady) => set({ nextScenePreloadReady }),
  setScrollSpeed: (scrollSpeed) => set({ scrollSpeed }),
  setActiveProject: (activeProject) =>
    set(activeProject
      ? { activeProject, projectRoomSlideIndex: 0, interactionMode: "project-room" as const }
      : { activeProject, interactionMode: "scroll" as const }),
  setProjectRoomSlideIndex: (projectRoomSlideIndex) => set({ projectRoomSlideIndex }),
  setLanguage: (language) => set({ language }),
  setBlobState: (blobState) => set({ blobState }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
}));
