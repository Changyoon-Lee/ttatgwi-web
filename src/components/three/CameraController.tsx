"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@react-three/drei";
import {
  createCameraPath,
  createLookAtPath,
  createCorridorTubePath,
  createProjectRoomRailPath,
  PROJECT_ROOM_SCENE_Z,
} from "@/lib/camera-path";
import { lerpVector3 } from "@/lib/three-utils";
import { useStore } from "@/lib/store";
import projectsData from "@/data/projects.json";

const projects = projectsData as { slug: string; slides: unknown[] }[];

const SMOOTH = 0.05;
const HERO_ORBIT_START = 0.06;
const HERO_ORBIT_END = 0.16;
const HERO_CENTER_Z = -70;
const HERO_ORBIT_RADIUS = 6;
const CORRIDOR_START = 0.20;
const CORRIDOR_END = 0.35;
const DOMAIN_ORBIT_START = 0.36;
const DOMAIN_ORBIT_END = 0.46;
const DOMAIN_CENTER_Z = -212;
const DOMAIN_ORBIT_RADIUS = 10;
const DOMAIN_ORBIT_SPEED = 0.2;
const METHOD_FOCUS_START = 0.44;
const METHOD_FOCUS_END = 0.56;
const METHOD_SCENE_Z = -280;
const METHOD_CAMERA_OFFSET = 12;
const PORTFOLIO_ORBIT_START = 0.56;
const PORTFOLIO_ORBIT_END = 0.66;
const PORTFOLIO_SCENE_Z = -350;
const PORTFOLIO_ORBIT_RADIUS = 12;
const PORTFOLIO_ORBIT_SPEED = 0.15;
const TECH_ORBIT_START = 0.66;
const TECH_ORBIT_END = 0.76;
const TECH_SCENE_Z = -490;
const TECH_ORBIT_RADIUS = 10;
const TECH_ORBIT_SPEED = 0.12;
const TEAM_ORBIT_START = 0.76;
const TEAM_ORBIT_END = 0.86;
const TEAM_SCENE_Z = -560;
const TEAM_ORBIT_RADIUS = 10;
const TEAM_ORBIT_SPEED = 0.1;

export function CameraController() {
  const cameraPath = useRef(createCameraPath()).current;
  const lookAtPath = useRef(createLookAtPath()).current;
  const corridorPath = useRef(createCorridorTubePath()).current;
  const projectRoomRailPath = useRef(createProjectRoomRailPath(PROJECT_ROOM_SCENE_Z)).current;
  const scroll = useScroll();
  const activeProject = useStore((s) => s.activeProject);
  const projectRoomSlideIndex = useStore((s) => s.projectRoomSlideIndex);
  const pos = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3());
  const heroLookAt = useRef(new THREE.Vector3(0, 0, HERO_CENTER_Z));

  const project = activeProject ? projects.find((p) => p.slug === activeProject) : null;
  const slideCount = project?.slides?.length ?? 1;
  const projectRoomProgress = slideCount <= 1 ? 0 : projectRoomSlideIndex / (slideCount - 1);

  useFrame((state) => {
    const offset = scroll?.offset ?? 0;
    const t = Math.max(0, Math.min(1, offset));
    const time = state.clock.elapsedTime;

    if (activeProject && project) {
      projectRoomRailPath.getPointAt(Math.min(1, projectRoomProgress), pos.current);
      projectRoomRailPath.getPointAt(Math.min(1, projectRoomProgress + 0.08), lookAt.current);
    } else {
    const inHeroOrbit =
      offset >= HERO_ORBIT_START && offset <= HERO_ORBIT_END;
    const inCorridor =
      offset >= CORRIDOR_START && offset <= CORRIDOR_END;
    const inDomainOrbit =
      offset >= DOMAIN_ORBIT_START && offset <= DOMAIN_ORBIT_END;
    const inMethodFocus =
      offset >= METHOD_FOCUS_START && offset <= METHOD_FOCUS_END;
    const inPortfolioOrbit =
      offset >= PORTFOLIO_ORBIT_START && offset <= PORTFOLIO_ORBIT_END;
    const inTechOrbit =
      offset >= TECH_ORBIT_START && offset <= TECH_ORBIT_END;
    const inTeamOrbit =
      offset >= TEAM_ORBIT_START && offset <= TEAM_ORBIT_END;

    if (inTeamOrbit) {
      pos.current.set(
        Math.sin(time * TEAM_ORBIT_SPEED) * TEAM_ORBIT_RADIUS,
        2,
        TEAM_SCENE_Z + Math.cos(time * TEAM_ORBIT_SPEED) * TEAM_ORBIT_RADIUS
      );
      lookAt.current.set(0, 0, TEAM_SCENE_Z);
    } else if (inTechOrbit) {
      pos.current.set(
        Math.sin(time * TECH_ORBIT_SPEED) * TECH_ORBIT_RADIUS,
        2,
        TECH_SCENE_Z + Math.cos(time * TECH_ORBIT_SPEED) * TECH_ORBIT_RADIUS
      );
      lookAt.current.set(0, 0, TECH_SCENE_Z);
    } else if (inPortfolioOrbit) {
      pos.current.set(
        Math.sin(time * PORTFOLIO_ORBIT_SPEED) * PORTFOLIO_ORBIT_RADIUS,
        2,
        PORTFOLIO_SCENE_Z + Math.cos(time * PORTFOLIO_ORBIT_SPEED) * PORTFOLIO_ORBIT_RADIUS
      );
      lookAt.current.set(0, 0, PORTFOLIO_SCENE_Z - 20);
    } else if (inMethodFocus) {
      pos.current.set(0, 2, METHOD_SCENE_Z + METHOD_CAMERA_OFFSET);
      lookAt.current.set(0, 0, METHOD_SCENE_Z);
    } else if (inDomainOrbit) {
      pos.current.set(
        Math.sin(time * DOMAIN_ORBIT_SPEED) * DOMAIN_ORBIT_RADIUS,
        2,
        DOMAIN_CENTER_Z + Math.cos(time * DOMAIN_ORBIT_SPEED) * DOMAIN_ORBIT_RADIUS
      );
      lookAt.current.set(0, 0, DOMAIN_CENTER_Z);
    } else if (inHeroOrbit) {
      pos.current.set(
        Math.sin(time * 0.1) * HERO_ORBIT_RADIUS,
        0.8,
        HERO_CENTER_Z + Math.cos(time * 0.1) * HERO_ORBIT_RADIUS
      );
      lookAt.current.copy(heroLookAt.current);
    } else if (inCorridor) {
      const progress = (offset - CORRIDOR_START) / (CORRIDOR_END - CORRIDOR_START);
      corridorPath.getPointAt(progress, pos.current);
      corridorPath.getPointAt(Math.min(1, progress + 0.02), lookAt.current);
    } else {
      cameraPath.getPointAt(t, pos.current);
      lookAtPath.getPointAt(t, lookAt.current);
    }
    }

    const smooth = activeProject ? 0.08 : SMOOTH;
    lerpVector3(
      currentPos.current,
      pos.current,
      smooth,
      currentPos.current
    );
    lerpVector3(
      currentLook.current,
      lookAt.current,
      smooth,
      currentLook.current
    );

    state.camera.position.copy(currentPos.current);
    state.camera.lookAt(currentLook.current);
    state.camera.updateProjectionMatrix();
  });

  return null;
}
