"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@react-three/drei";
import { createMasterPath } from "@/lib/camera/masterPath";
import { createLookAtPath } from "@/lib/camera/lookAtPath";
import {
  SCENE_RANGES,
  getSectionProgress,
  getSceneIdFromProgress,
} from "@/lib/camera/sceneRanges";
import { easeProgress, PROGRESS_LERP } from "@/lib/camera/scrollMapper";
import {
  createCorridorTubePath,
  createProjectRoomRailPath,
  PROJECT_ROOM_SCENE_Z,
} from "@/lib/camera-path";
import { lerpVector3 } from "@/lib/three-utils";
import { useStore } from "@/lib/store";
import projectsData from "@/data/projects.json";

const projects = projectsData as { slug: string; slides: unknown[] }[];

const SMOOTH_POS = 0.06;
const SMOOTH_LOOK = 0.06;

export function CameraRig() {
  const scroll = useScroll();
  const activeProject = useStore((s) => s.activeProject);
  const projectRoomSlideIndex = useStore((s) => s.projectRoomSlideIndex);
  const setGlobalProgress = useStore((s) => s.setGlobalProgress);

  const masterPath = useRef(createMasterPath()).current;
  const lookAtPath = useRef(createLookAtPath()).current;
  const corridorPath = useRef(createCorridorTubePath()).current;
  const projectRoomRail = useRef(createProjectRoomRailPath(PROJECT_ROOM_SCENE_Z)).current;

  const currentProgressRef = useRef(0);
  const pos = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3());

  const project = activeProject ? projects.find((p) => p.slug === activeProject) : null;
  const slideCount = project?.slides?.length ?? 1;
  const projectRoomProgress =
    slideCount <= 1 ? 0 : projectRoomSlideIndex / Math.max(1, slideCount - 1);

  useFrame((state) => {
    const rawOffset = scroll?.offset ?? 0;
    const targetProgress = Math.max(0, Math.min(1, rawOffset));
    currentProgressRef.current = easeProgress(
      currentProgressRef.current,
      targetProgress,
      PROGRESS_LERP
    );
    const progress = currentProgressRef.current;
    setGlobalProgress(progress);

    const time = state.clock.elapsedTime;
    const sceneId = getSceneIdFromProgress(progress);

    // Layer C: Project Room override (full takeover)
    if (activeProject && project) {
      projectRoomRail.getPointAt(Math.min(1, projectRoomProgress), pos.current);
      projectRoomRail.getPointAt(Math.min(1, projectRoomProgress + 0.08), lookAt.current);
    } else {
      // Layer A + B: Master path + local scene motion
      const heroRange = SCENE_RANGES.find((r) => r.id === "hero")!;
      const corridorRange = SCENE_RANGES.find((r) => r.id === "corridor")!;
      const methodRange = SCENE_RANGES.find((r) => r.id === "method")!;

      switch (sceneId) {
        case "void": {
          masterPath.getPointAt(progress, pos.current);
          lookAtPath.getPointAt(progress, lookAt.current);
          break;
        }
        case "hero": {
          const heroLocal = getSectionProgress(progress, heroRange.start, heroRange.end);
          if (heroLocal < 0.4) {
            masterPath.getPointAt(progress, pos.current);
            lookAtPath.getPointAt(progress, lookAt.current);
          } else {
            const r = 6;
            pos.current.set(
              Math.sin(time * 0.1) * r,
              0.8,
              -70 + Math.cos(time * 0.1) * r
            );
            lookAt.current.set(0, 0, -70);
          }
          break;
        }
        case "corridor": {
          const corridorLocal = getSectionProgress(
            progress,
            corridorRange.start,
            corridorRange.end
          );
          corridorPath.getPointAt(corridorLocal, pos.current);
          corridorPath.getPointAt(Math.min(1, corridorLocal + 0.02), lookAt.current);
          pos.current.x += Math.sin(time * 0.8) * 0.03;
          pos.current.y += Math.cos(time * 0.6) * 0.02;
          break;
        }
        case "domains": {
          const r = 10;
          pos.current.set(
            Math.sin(time * 0.2) * r,
            2,
            -212 + Math.cos(time * 0.2) * r
          );
          lookAt.current.set(0, 0, -212);
          break;
        }
        case "method": {
          const methodLocal = getSectionProgress(progress, methodRange.start, methodRange.end);
          const push = methodLocal * 3;
          pos.current.set(0, 2, -268 + push);
          lookAt.current.set(0, 0, -280);
          break;
        }
        case "portfolio": {
          const r = 12;
          pos.current.set(
            Math.sin(time * 0.15) * r,
            2,
            -350 + Math.cos(time * 0.15) * r
          );
          lookAt.current.set(0, 0, -370);
          break;
        }
        case "projectRoom": {
          masterPath.getPointAt(progress, pos.current);
          lookAtPath.getPointAt(progress, lookAt.current);
          break;
        }
        case "tech": {
          const r = 10;
          pos.current.set(
            Math.sin(time * 0.12) * r,
            2,
            -490 + Math.cos(time * 0.12) * r
          );
          lookAt.current.set(0, 0, -490);
          break;
        }
        case "team": {
          const r = 10;
          pos.current.set(
            Math.sin(time * 0.1) * r,
            2,
            -560 + Math.cos(time * 0.1) * r
          );
          lookAt.current.set(0, 0, -560);
          break;
        }
        case "contact": {
          masterPath.getPointAt(progress, pos.current);
          lookAtPath.getPointAt(progress, lookAt.current);
          pos.current.x += Math.sin(time * 0.3) * 0.3;
          pos.current.y += Math.cos(time * 0.2) * 0.2;
          break;
        }
        default: {
          masterPath.getPointAt(progress, pos.current);
          lookAtPath.getPointAt(progress, lookAt.current);
        }
      }
    }

    const smooth = activeProject ? 0.08 : SMOOTH_POS;
    lerpVector3(currentPos.current, pos.current, smooth, currentPos.current);
    lerpVector3(currentLook.current, lookAt.current, SMOOTH_LOOK, currentLook.current);

    state.camera.position.copy(currentPos.current);
    state.camera.lookAt(currentLook.current);
    state.camera.updateProjectionMatrix();
  });

  return null;
}
