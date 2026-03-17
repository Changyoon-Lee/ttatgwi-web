"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Html, Line } from "@react-three/drei";
import { useStore } from "@/lib/store";
import projectsData from "@/data/projects.json";

const FLOOR_COLOR = "#0b0e16";
const GLASS_COLOR = "#c9e7ff";
const ACCENT = "#7af0ff";
const PANEL_W = 3;
const PANEL_H = 2;
const PANEL_D = 0.2;

type Slide = {
  type: string;
  title_en: string;
  title_kr: string;
  content_en: string;
  content_kr: string;
  image?: string;
};

type Project = {
  id: string;
  slug: string;
  title_en: string;
  title_kr: string;
  category: string;
  cover: string;
  slides: Slide[];
};

const projects = projectsData as Project[];

/** Organic cluster layout: avoid overlap, spread in volume x(-15,15) y(-2,4) z(-10,-30) */
function useProjectPositions(count: number): [number, number, number][] {
  return useMemo(() => {
    const out: [number, number, number][] = [];
    const minDist = 7;
    let attempts = 0;
    while (out.length < count && attempts < 200) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.3) * 6;
      const z = -20 - Math.random() * 20;
      const ok = out.every(
        (p) =>
          Math.hypot(p[0] - x, p[1] - y, p[2] - z) >= minDist
      );
      if (ok) out.push([x, y, z]);
      attempts++;
    }
    if (out.length < count) {
      out.length = 0;
      const grid = [
        [-10, 1, -18],
        [10, 0, -18],
        [-9, 2.5, -28],
        [9, -0.5, -28],
      ];
      grid.slice(0, count).forEach((p) => out.push(p as [number, number, number]));
    }
    return out;
  }, [count]);
}

/** Connection pairs for NodeConnections (project network) */
const NODE_CONNECTIONS: [string, string][] = [
  ["dashboard", "automation"],
  ["game", "platform"],
  ["automation", "platform"],
];

function GalleryEnvironment() {
  return null;
}

function ProjectNode({
  project,
  position,
  isHovered,
  onHover,
  onClick,
}: {
  project: Project;
  position: [number, number, number];
  isHovered: boolean;
  onHover: (v: boolean) => void;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1));
  const targetScale = 1.2;
  const lang = useStore((s) => s.language);
  const suffix = lang === "ko" ? "_kr" : "_en";
  const title = project[`title_${suffix}` as keyof Project] as string ?? project.title_en;
  const problemSlide = project.slides.find((s) => s.type === "problem");
  const resultSlide = project.slides.filter((s) => s.type === "result").pop() ?? project.slides[project.slides.length - 1];
  const problem = problemSlide ? (problemSlide[`content_${suffix}` as keyof Slide] as string) ?? problemSlide.content_en : "";
  const result = resultSlide ? (resultSlide[`content_${suffix}` as keyof Slide] as string) ?? resultSlide.content_en : "";

  useFrame(() => {
    if (!groupRef.current) return;
    scaleVec.current.lerp(
      new THREE.Vector3(
        isHovered ? targetScale : 1,
        isHovered ? targetScale : 1,
        isHovered ? targetScale : 1
      ),
      0.1
    );
    groupRef.current.scale.copy(scaleVec.current);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        onHover(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh>
        <boxGeometry args={[PANEL_W, PANEL_H, PANEL_D]} />
        <MeshTransmissionMaterial
          transmission={1}
          roughness={0.1}
          thickness={0.4}
          ior={1.45}
          color={GLASS_COLOR}
          backside
        />
      </mesh>
      <Html
        position={[0, 0, PANEL_D / 2 + 0.02]}
        center
        transform
        distanceFactor={6}
        style={{
          pointerEvents: "none",
          width: 280,
          padding: 12,
          background: "rgba(6, 8, 15, 0.75)",
          borderRadius: 8,
          border: "1px solid rgba(122, 240, 255, 0.2)",
          color: "#c9e7ff",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          textAlign: "left",
          userSelect: "none",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
          {title}
        </div>
        {problem && (
          <div style={{ opacity: 0.9, marginBottom: 4 }}>
            <span style={{ color: "#7af0ff" }}>Problem</span> {problem.slice(0, 60)}
            {problem.length > 60 ? "…" : ""}
          </div>
        )}
        {result && (
          <div style={{ opacity: 0.9 }}>
            <span style={{ color: "#7af0ff" }}>Result</span> {result.slice(0, 60)}
            {result.length > 60 ? "…" : ""}
          </div>
        )}
      </Html>
    </group>
  );
}

function NodeConnections({
  positionsBySlug,
}: {
  positionsBySlug: Record<string, [number, number, number]>;
}) {
  const segments = useMemo(() => {
    const out: { start: [number, number, number]; end: [number, number, number] }[] = [];
    NODE_CONNECTIONS.forEach(([a, b]) => {
      const start = positionsBySlug[a];
      const end = positionsBySlug[b];
      if (start && end) out.push({ start, end });
    });
    return out;
  }, [positionsBySlug]);

  return (
    <group>
      {segments.map(({ start, end }, i) => (
        <ConnectionLine key={i} start={start} end={end} />
      ))}
    </group>
  );
}

function ConnectionLine({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const points = useMemo(
    () => [start, end] as [number, number, number][],
    [start, end]
  );
  return (
    <Line
      points={points}
      color={ACCENT}
      lineWidth={0.5}
      transparent
      opacity={0.35}
    />
  );
}

export function PortfolioScene() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const setActiveProject = useStore((s) => s.setActiveProject);
  const positions = useProjectPositions(projects.length);
  const positionsBySlug = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    projects.forEach((p, i) => {
      if (positions[i]) map[p.slug] = positions[i];
    });
    return map;
  }, [positions]);

  return (
    <group>
      <GalleryEnvironment />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 10, -20]} intensity={3} color={ACCENT} />
      <pointLight position={[10, 5, -25]} intensity={1.5} color={GLASS_COLOR} />
      <spotLight
        position={[0, 8, -15]}
        intensity={2}
        angle={0.5}
        penumbra={0.6}
        color={GLASS_COLOR}
      />

      <NodeConnections positionsBySlug={positionsBySlug} />

      {projects.map((project, i) => (
        <ProjectNode
          key={project.slug}
          project={project}
          position={positions[i] ?? [0, 0, -20]}
          isHovered={hoveredSlug === project.slug}
          onHover={(v) => setHoveredSlug(v ? project.slug : null)}
          onClick={() => setActiveProject(project.slug)}
        />
      ))}
    </group>
  );
}
