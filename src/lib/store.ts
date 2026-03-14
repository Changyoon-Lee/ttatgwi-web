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
  activeProject: string | null;
  projectRoomSlideIndex: number;
  language: "en" | "ko";
  blobState: BlobState;
  interactionMode: InteractionMode;
  setCurrentScene: (scene: SceneId) => void;
  setScrollProgress: (progress: number) => void;
  setGlobalProgress: (p: number) => void;
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
  activeProject: null,
  projectRoomSlideIndex: 0,
  language: "en",
  blobState: "idle",
  interactionMode: "scroll",
  setCurrentScene: (currentScene) => set({ currentScene }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setGlobalProgress: (globalProgress) => set({ globalProgress }),
  setActiveProject: (activeProject) =>
    set(activeProject
      ? { activeProject, projectRoomSlideIndex: 0, interactionMode: "project-room" as const }
      : { activeProject, interactionMode: "scroll" as const }),
  setProjectRoomSlideIndex: (projectRoomSlideIndex) => set({ projectRoomSlideIndex }),
  setLanguage: (language) => set({ language }),
  setBlobState: (blobState) => set({ blobState }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
}));
