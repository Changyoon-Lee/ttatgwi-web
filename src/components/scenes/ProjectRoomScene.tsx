"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Html } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { scrollToProgress } from "@/lib/scrollToProgress";
import projectsData from "@/data/projects.json";

const PORTFOLIO_MID = 0.59;

const GLASS = "#c9e7ff";
const ACCENT = "#7af0ff";
const VIOLET = "#b48dff";
const PANEL_W = 6;
const PANEL_H = 3.6;
const SLIDE_SPACING_X = 8;
const SLIDE_SPACING_Z = -2;
const RAIL_LOOK_Z = -8;

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
  coreType?: string;
  accentColor?: string;
  slides: Slide[];
};

const projects = projectsData as Project[];

function ProjectCore({
  coreType,
  accentColor,
  slideIndex,
}: {
  coreType?: string;
  accentColor?: string;
  slideIndex: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const color = accentColor ?? ACCENT;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
  });

  if (coreType === "layered-panels") {
    return (
      <group ref={groupRef} position={[0, 0, RAIL_LOOK_Z - 4]}>
        {[0, 0.5, 1, 1.5].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, (i * Math.PI) / 10]}>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <MeshTransmissionMaterial
              transmission={1}
              thickness={0.3}
              roughness={0.08}
              color={color}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (coreType === "rotating-loop") {
    return (
      <group ref={groupRef} position={[0, 0, RAIL_LOOK_Z - 4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.15, 24, 48]} />
          <MeshTransmissionMaterial transmission={1} thickness={0.2} roughness={0.1} color={color} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 3]} position={[0, 0.2, 0]}>
          <torusGeometry args={[0.9, 0.12, 24, 48]} />
          <MeshTransmissionMaterial transmission={1} thickness={0.15} roughness={0.1} color={GLASS} />
        </mesh>
      </group>
    );
  }

  if (coreType === "liquid-knot") {
    const geom = useMemo(() => new THREE.TorusKnotGeometry(1, 0.35, 80, 24), []);
    return (
      <group ref={groupRef} position={[0, 0, RAIL_LOOK_Z - 4]}>
        <mesh geometry={geom}>
          <MeshTransmissionMaterial transmission={1} thickness={0.4} roughness={0.08} color={VIOLET} />
        </mesh>
      </group>
    );
  }

  if (coreType === "crystal-shell") {
    const geom = useMemo(() => new THREE.OctahedronGeometry(1.8, 2), []);
    return (
      <group ref={groupRef} position={[0, 0, RAIL_LOOK_Z - 4]}>
        <mesh geometry={geom}>
          <MeshTransmissionMaterial transmission={1} thickness={0.5} roughness={0} chromaticAberration={0.03} color={color} />
        </mesh>
        <mesh geometry={geom}>
          <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, 0, RAIL_LOOK_Z - 4]}>
      <mesh>
        <octahedronGeometry args={[1.5, 0]} />
        <MeshTransmissionMaterial transmission={1} thickness={0.3} roughness={0.1} color={color} />
      </mesh>
    </group>
  );
}

function SlidePanel({
  slide,
  index,
  isActive,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
}) {
  const lang = useStore((s) => s.language);
  const suffix = lang === "ko" ? "_kr" : "_en";
  const title = (slide as Record<string, string>)[`title_${suffix}`] ?? slide.title_en;
  const content = (slide as Record<string, string>)[`content_${suffix}`] ?? slide.content_en;

  return (
    <group position={[index * SLIDE_SPACING_X, 0, index * SLIDE_SPACING_Z]}>
      <mesh>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <MeshTransmissionMaterial
          transmission={1}
          roughness={0.08}
          thickness={0.25}
          ior={1.3}
          color={GLASS}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Html
        position={[0, 0, 0.02]}
        center
        transform
        distanceFactor={5}
        style={{
          pointerEvents: "none",
          width: 520,
          padding: 20,
          background: "rgba(5, 7, 13, 0.82)",
          borderRadius: 12,
          border: "1px solid rgba(122, 240, 255, 0.25)",
          color: "#c9e7ff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "left",
          userSelect: "none",
          opacity: isActive ? 1 : 0.7,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16, color: ACCENT }}>
          {title}
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{content}</p>
      </Html>
    </group>
  );
}

function ReturnPortal({ onReturn }: { onReturn: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lang = useStore((s) => s.language);
  const label = lang === "ko" ? "프로젝트 목록으로 돌아가기" : "Back to Works";

  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <group position={[32, 0, -12]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onReturn();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <torusGeometry args={[1.5, 0.15, 24, 48]} />
        <MeshTransmissionMaterial transmission={1} thickness={0.3} roughness={0.1} color={ACCENT} />
      </mesh>
      <Html center position={[0, 0, 2]} distanceFactor={4} style={{ pointerEvents: "none", color: "#c9e7ff", fontSize: 12, whiteSpace: "nowrap" }}>
        {label}
      </Html>
    </group>
  );
}

export function ProjectRoomScene() {
  const activeProject = useStore((s) => s.activeProject);
  const projectRoomSlideIndex = useStore((s) => s.projectRoomSlideIndex);
  const setActiveProject = useStore((s) => s.setActiveProject);

  const project = activeProject ? projects.find((p) => p.slug === activeProject) : null;

  if (!project) {
    return (
      <group>
        <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshPhysicalMaterial color={GLASS} transparent opacity={0.06} transmission={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[2, 0]} />
          <meshPhysicalMaterial color={ACCENT} transparent opacity={0.35} transmission={0.85} thickness={0.2} roughness={0.15} />
        </mesh>
      </group>
    );
  }

  const slides = project.slides ?? [];

  return (
    <group>
      <fog attach="fog" args={["#05070d", 8, 35]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, RAIL_LOOK_Z - 2]} intensity={2} color={project.accentColor ?? ACCENT} />
      <spotLight position={[10, 6, 0]} intensity={1.5} angle={0.4} penumbra={0.5} color={GLASS} />

      <ProjectCore coreType={project.coreType} accentColor={project.accentColor} slideIndex={projectRoomSlideIndex} />

      {slides.map((slide, index) => (
        <SlidePanel
          key={index}
          slide={slide}
          index={index}
          isActive={index === projectRoomSlideIndex}
        />
      ))}

      <ReturnPortal
        onReturn={() => {
          setActiveProject(null);
          scrollToProgress(PORTFOLIO_MID);
        }}
      />
    </group>
  );
}
