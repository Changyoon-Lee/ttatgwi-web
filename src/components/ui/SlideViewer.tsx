"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { scrollToProgress } from "@/lib/scrollToProgress";
import projectsData from "@/data/projects.json";

const PORTFOLIO_MID = 0.59;

type Project = {
  id: string;
  slug: string;
  title_en: string;
  title_kr: string;
  slides: unknown[];
};

const projects = projectsData as Project[];

/** Minimal overlay for Project Room: title, close, progress dots, prev/next. Slide content is in 3D. */
export function SlideViewer() {
  const activeProject = useStore((s) => s.activeProject);
  const setActiveProject = useStore((s) => s.setActiveProject);
  const projectRoomSlideIndex = useStore((s) => s.projectRoomSlideIndex);
  const setProjectRoomSlideIndex = useStore((s) => s.setProjectRoomSlideIndex);
  const language = useStore((s) => s.language);

  const project = activeProject ? projects.find((p) => p.slug === activeProject) : null;
  const slideCount = project?.slides?.length ?? 0;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveProject(null);
        scrollToProgress(PORTFOLIO_MID);
      }
      if (!project) return;
      if (e.key === "ArrowRight")
        setProjectRoomSlideIndex(Math.min(projectRoomSlideIndex + 1, slideCount - 1));
      if (e.key === "ArrowLeft")
        setProjectRoomSlideIndex(Math.max(0, projectRoomSlideIndex - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [project, projectRoomSlideIndex, slideCount, setActiveProject, setProjectRoomSlideIndex]);

  if (!project) return null;

  const title = language === "en" ? project.title_en : project.title_kr;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4"
      aria-hidden
    >
      <div className="pointer-events-auto flex items-start justify-between">
        <span className="text-sm font-medium text-[#c9e7ff]/90">{title}</span>
        <button
          type="button"
          onClick={() => {
          setActiveProject(null);
          scrollToProgress(PORTFOLIO_MID);
        }}
          className="rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ESC
        </button>
      </div>

      <div className="pointer-events-auto flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setProjectRoomSlideIndex(Math.max(0, projectRoomSlideIndex - 1))}
          disabled={projectRoomSlideIndex === 0}
          className="rounded px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
        >
          Prev
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setProjectRoomSlideIndex(i)}
              className="pointer-events-auto h-2 w-2 rounded-full transition-colors"
              style={{
                background: i === projectRoomSlideIndex ? "#7af0ff" : "rgba(255,255,255,0.3)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setProjectRoomSlideIndex(Math.min(slideCount - 1, projectRoomSlideIndex + 1))
          }
          disabled={projectRoomSlideIndex >= slideCount - 1}
          className="rounded px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
