"use client";

import type React from "react";
import type { SceneId } from "@/lib/store";
import { VoidEntranceScene } from "@/components/scenes/VoidEntranceScene";
import { HeroScene } from "@/components/scenes/HeroScene";
import { GlassCorridorScene } from "@/components/scenes/GlassCorridorScene";
import { DomainScene } from "@/components/scenes/DomainScene";
import { MethodScene } from "@/components/scenes/MethodScene";
import { PortfolioScene } from "@/components/scenes/PortfolioScene";
import { ProjectRoomScene } from "@/components/scenes/ProjectRoomScene";
import { TechScene } from "@/components/scenes/TechScene";
import { TeamScene } from "@/components/scenes/TeamScene";
import { ContactScene } from "@/components/scenes/ContactScene";
import { ORCHESTRATION_SPEC } from "./orchestrationSpec";

const SCENE_Z = [0, -70, -140, -210, -280, -350, -420, -490, -560, -630];

const SCENE_COMPONENTS: Record<SceneId, React.ComponentType<object>> = {
  void: VoidEntranceScene,
  hero: HeroScene,
  corridor: GlassCorridorScene,
  domains: DomainScene,
  method: MethodScene,
  portfolio: PortfolioScene,
  projectRoom: ProjectRoomScene,
  tech: TechScene,
  team: TeamScene,
  contact: ContactScene,
};

export type SceneConfig = { id: SceneId; Component: React.ComponentType; z: number };

export function getSceneConfigs(): SceneConfig[] {
  return ORCHESTRATION_SPEC.map((spec, i) => ({
    id: spec.id,
    Component: SCENE_COMPONENTS[spec.id],
    z: SCENE_Z[i] ?? 0,
  }));
}

export { SCENE_Z };
