"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createMasterPath } from "@/lib/camera/masterPath";
import { createLookAtPath } from "@/lib/camera/lookAtPath";
import {
  SCENE_RANGES,
  getSectionProgress,
  getSceneIdFromProgress,
} from "@/lib/camera/sceneRanges";
import { setCameraDebug, tickProgress } from "@/lib/hybridScroll";
import { getScrollContainer } from "@/lib/scrollToProgress";
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
const DOMAIN_METHOD_BLEND_ZONE = 0.2;

/** `getSceneConfigs()` portfolio `z`와 동일 (ORCHESTRATION index 5). */
const PORTFOLIO_GROUP_Z = -350;

/**
 * `projects.json` 배열 순서와 동일 (slug: dashboard, automation, game, platform).
 * `PortfolioScene` `useProjectPositions` 그리드와 반드시 일치.
 */
const PORTFOLIO_PANEL_LOCAL: ReadonlyArray<[number, number, number]> = [
  [-10, 1, -18],
  [10, 0, -18],
  [-9, 2.5, -28],
  [9, -0.5, -28],
];

/** 패널 정면(+local Z) 쪽으로 붙일 거리. 너무 작으면 옆으로만 밀린 느낌이 나기 쉬움. */
const PORTFOLIO_PANEL_FORWARD = 5.2;

/** hybridScroll `portfolio` checkpoints + 구간 시작/끝. */
const PORTFOLIO_CAMERA_STOPS = [
  0.52, 0.54, 0.57, 0.6, 0.63, 0.65, 0.66,
] as const;

function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * 그룹 로컬에서 패널은 대체로 +Z 쪽이 관찰자(카메라) 방향.
 * 옆으로 크게 밀지 않고 정면에 가깝게 두어 가까운 거리에서도 방향이 덜 틀어지게 함.
 */
function portfolioPanelClose(
  time: number,
  local: [number, number, number],
  pos: THREE.Vector3,
  look: THREE.Vector3,
  forwardZ: number
) {
  const lx = local[0];
  const ly = local[1];
  const lz = local[2];
  const wz = PORTFOLIO_GROUP_Z + lz;
  const swayMax = Math.min(0.03, forwardZ * 0.006);
  const swayX = Math.sin(time * 0.45) * swayMax;
  const swayY = Math.cos(time * 0.4) * swayMax * 0.65;
  const lateral = lx * 0.06;
  pos.set(lx + lateral + swayX, ly + 0.55 + swayY, wz + forwardZ);
  look.set(lx, ly + 0.12, wz);
}

/**
 * 스크롤 스탑 → `projects.json` 인덱스.
 * 연결선 순서와 맞춤: dashboard → automation → platform → game
 * (`NODE_CONNECTIONS`: dashboard–automation, automation–platform, game–platform)
 */
function portfolioTargetAtStop(
  stopIndex: number,
  time: number,
  pos: THREE.Vector3,
  look: THREE.Vector3
) {
  const stopToPanel = [0, 0, 1, 3, 2, 2, 2] as const;
  const panelIdx = stopToPanel[Math.max(0, Math.min(stopIndex, stopToPanel.length - 1))] ?? 0;
  const local = PORTFOLIO_PANEL_LOCAL[panelIdx];
  if (!local) {
    const fallback = PORTFOLIO_PANEL_LOCAL[0]!;
    portfolioPanelClose(time, fallback, pos, look, PORTFOLIO_PANEL_FORWARD);
    return;
  }
  portfolioPanelClose(time, local, pos, look, PORTFOLIO_PANEL_FORWARD);
}

export function CameraRig() {
  const activeProject = useStore((s) => s.activeProject);
  const projectRoomSlideIndex = useStore((s) => s.projectRoomSlideIndex);
  const setGlobalProgress = useStore((s) => s.setGlobalProgress);
  const setCurrentScene = useStore((s) => s.setCurrentScene);
  const setScrollSpeed = useStore((s) => s.setScrollSpeed);
  const setScrollProgress = useStore((s) => s.setScrollProgress);

  const masterPath = useRef(createMasterPath()).current;
  const lookAtPath = useRef(createLookAtPath()).current;
  const corridorPath = useRef(createCorridorTubePath()).current;
  const projectRoomRail = useRef(createProjectRoomRailPath(PROJECT_ROOM_SCENE_Z)).current;

  const pos = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3());
  const prevProgress = useRef(0);
  const blendPos = useRef(new THREE.Vector3());
  const blendLook = useRef(new THREE.Vector3());

  const project = activeProject ? projects.find((p) => p.slug === activeProject) : null;
  const slideCount = project?.slides?.length ?? 1;
  const projectRoomProgress =
    slideCount <= 1 ? 0 : projectRoomSlideIndex / Math.max(1, slideCount - 1);

  useFrame((state) => {
    const progress = tickProgress(state.clock.getDelta());
    setGlobalProgress(progress);
    setScrollProgress(progress);
    setScrollSpeed(Math.abs(progress - prevProgress.current));
    prevProgress.current = progress;

    const container = getScrollContainer();
    if (container) {
      container.el.scrollTop = progress * container.maxScroll;
    }

    const time = state.clock.elapsedTime;
    const sceneId = getSceneIdFromProgress(progress);
    setCurrentScene(sceneId);

    // Layer C: Project Room override (full takeover)
    if (activeProject && project) {
      projectRoomRail.getPointAt(Math.min(1, projectRoomProgress), pos.current);
      projectRoomRail.getPointAt(Math.min(1, projectRoomProgress + 0.08), lookAt.current);
    } else {
      // Layer A + B: Master path + local scene motion
      const heroRange = SCENE_RANGES.find((r) => r.id === "hero")!;
      const corridorRange = SCENE_RANGES.find((r) => r.id === "corridor")!;
      const domainsRange = SCENE_RANGES.find((r) => r.id === "domains")!;
      const methodRange = SCENE_RANGES.find((r) => r.id === "method")!;
      const portfolioRange = SCENE_RANGES.find((r) => r.id === "portfolio")!;

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
          const domainsLocal = getSectionProgress(progress, domainsRange.start, domainsRange.end);
          const r = 10;
          pos.current.set(
            Math.sin(time * 0.2) * r,
            2,
            -212 + Math.cos(time * 0.2) * r
          );
          lookAt.current.set(0, 0, -212);

          // domains 후반부에서 method 시작 시점의 카메라 목표로 부드럽게 블렌드
          if (domainsLocal > 1 - DOMAIN_METHOD_BLEND_ZONE) {
            const t = (domainsLocal - (1 - DOMAIN_METHOD_BLEND_ZONE)) / DOMAIN_METHOD_BLEND_ZONE;
            const eased = t * t * (3 - 2 * t);
            blendPos.current.set(0, 2, -268);
            blendLook.current.set(0, 0, -280);
            pos.current.lerp(blendPos.current, eased);
            lookAt.current.lerp(blendLook.current, eased);
          }
          break;
        }
        case "method": {
          const methodLocal = getSectionProgress(progress, methodRange.start, methodRange.end);
          // method 초반은 전환 안정화를 위해 살짝 천천히 밀어준다.
          const easedLocal = methodLocal < DOMAIN_METHOD_BLEND_ZONE
            ? (methodLocal / DOMAIN_METHOD_BLEND_ZONE) ** 2 * DOMAIN_METHOD_BLEND_ZONE
            : methodLocal;
          const push = easedLocal * 3;
          pos.current.set(0, 2, -268 + push);
          lookAt.current.set(0, 0, -280);
          break;
        }
        case "portfolio": {
          const p = Math.max(
            portfolioRange.start,
            Math.min(portfolioRange.end - 1e-6, progress)
          );
          const stops = PORTFOLIO_CAMERA_STOPS;
          let seg = 0;
          for (let k = 0; k < stops.length - 1; k++) {
            if (p < stops[k + 1]!) {
              seg = k;
              break;
            }
          }
          seg = Math.min(seg, stops.length - 2);
          const p0 = stops[seg]!;
          const p1 = stops[seg + 1]!;
          const rawT = p1 > p0 ? (p - p0) / (p1 - p0) : 0;
          const eased = smoothstep01(rawT);

          portfolioTargetAtStop(seg, time, blendPos.current, blendLook.current);
          portfolioTargetAtStop(seg + 1, time, pos.current, lookAt.current);

          const ax = blendPos.current.x;
          const ay = blendPos.current.y;
          const az = blendPos.current.z;
          const bx = pos.current.x;
          const by = pos.current.y;
          const bz = pos.current.z;
          pos.current.set(
            ax + (bx - ax) * eased,
            ay + (by - ay) * eased,
            az + (bz - az) * eased
          );
          const alx = blendLook.current.x;
          const aly = blendLook.current.y;
          const alz = blendLook.current.z;
          const blx = lookAt.current.x;
          const bly = lookAt.current.y;
          const blz = lookAt.current.z;
          lookAt.current.set(
            alx + (blx - alx) * eased,
            aly + (bly - aly) * eased,
            alz + (blz - alz) * eased
          );
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
    setCameraDebug(
      [currentPos.current.x, currentPos.current.y, currentPos.current.z],
      [currentLook.current.x, currentLook.current.y, currentLook.current.z]
    );

    state.camera.position.copy(currentPos.current);
    state.camera.lookAt(currentLook.current);
    state.camera.updateProjectionMatrix();
  });

  return null;
}
