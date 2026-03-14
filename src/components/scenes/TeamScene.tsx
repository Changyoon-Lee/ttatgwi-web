"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Html, Line } from "@react-three/drei";
import { useStore } from "@/lib/store";
import teamData from "@/data/team.json";
import translations from "@/data/translations.json";

const ACCENT = "#7af0ff";
const GLASS = "#c9e7ff";
const MEMBER_ORBIT_RADIUS = 5;
const MEMBER_ORBIT_Y = 1;
const SKILL_PARTICLE_RADIUS = 1.3;
const SKILL_COUNT_PER_MEMBER = 6;

type Member = {
  id: string;
  name: string;
  title_en: string;
  title_kr: string;
  bio_en: string;
  bio_kr: string;
  primary_domain: string;
  secondary_domains: string[];
  skills: string[];
  projects: string[];
};

type DomainMap = Record<string, { label_en: string; label_kr: string }>;

const team = teamData as { members: Member[]; domains: DomainMap; links: string[][] };
const { members, domains, links } = team;

function teamPosition(index: number): [number, number, number] {
  const angle = (index / members.length) * Math.PI * 2;
  return [
    Math.cos(angle) * MEMBER_ORBIT_RADIUS,
    MEMBER_ORBIT_Y,
    Math.sin(angle) * MEMBER_ORBIT_RADIUS,
  ];
}

function TeamCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.8, 4), []);

  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y = state.clock.elapsedTime * 0.06;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <MeshTransmissionMaterial
        transmission={1}
        thickness={0.9}
        roughness={0.05}
        ior={1.45}
        color={ACCENT}
      />
    </mesh>
  );
}

function DomainRing({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.x = state.clock.elapsedTime * 0.1;
  });
  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.3, 0.05, 16, 64]} />
      <meshBasicMaterial
        color={ACCENT}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function SkillParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + i * 0.5;
      const r = SKILL_PARTICLE_RADIUS * (0.7 + Math.random() * 0.3);
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y += 0.008;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.12}
        color={GLASS}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function CollaborationLinks() {
  const idToIndex = useMemo(
    () => Object.fromEntries(members.map((m, i) => [m.id, i])),
    []
  );
  const segments = useMemo(() => {
    return (links as [string, string][])
      .filter((link) => link.length >= 2)
      .map((link) => {
        const [a, b] = link;
        const i = idToIndex[a];
        const j = idToIndex[b];
        if (i == null || j == null) return null;
        return { start: teamPosition(i), end: teamPosition(j) };
      })
      .filter((s): s is { start: [number, number, number]; end: [number, number, number] } => s != null);
  }, [idToIndex]);

  return (
    <group>
      {segments.map(({ start, end }, i) => (
        <Line
          key={i}
          points={[start, end]}
          color={ACCENT}
          lineWidth={0.4}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  );
}

function MemberNode({
  member,
  index,
  isHovered,
  onHover,
}: {
  member: Member;
  index: number;
  isHovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const pos = useMemo(() => teamPosition(index), [index]);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.9, 2), []);
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1));

  useFrame(() => {
    if (meshRef.current) {
      scaleVec.current.lerp(
        new THREE.Vector3(isHovered ? 1.2 : 1, isHovered ? 1.2 : 1, isHovered ? 1.2 : 1),
        0.1
      );
      meshRef.current.scale.copy(scaleVec.current);
    }
  });

  const lang = useStore((s) => s.language);
  const primaryLabel = domains[member.primary_domain]
    ? domains[member.primary_domain][`label_${lang === "ko" ? "kr" : "en"}`]
    : member.primary_domain;

  return (
    <group position={pos}>
      <DomainRing position={[0, 0, 0]} />
      <SkillParticles count={SKILL_COUNT_PER_MEMBER} />
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerEnter={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          onHover(false);
          document.body.style.cursor = "default";
        }}
      >
        <meshStandardMaterial
          color={ACCENT}
          emissive={isHovered ? ACCENT : "#0a2a4a"}
          emissiveIntensity={isHovered ? 0.25 : 0.05}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      {isHovered && (
        <MemberPanel member={member} primaryLabel={primaryLabel} />
      )}
    </group>
  );
}

function MemberPanel({ member, primaryLabel }: { member: Member; primaryLabel: string }) {
  const lang = useStore((s) => s.language);
  const title = lang === "ko" ? member.title_kr : member.title_en;
  const bio = lang === "ko" ? member.bio_kr : member.bio_en;

  return (
    <Html
      center
      position={[0, 1.8, 0]}
      distanceFactor={5}
      style={{
        pointerEvents: "none",
        width: 280,
        padding: 14,
        background: "rgba(5, 7, 13, 0.88)",
        borderRadius: 10,
        border: "1px solid rgba(122, 240, 255, 0.3)",
        color: "#c9e7ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{member.name}</div>
      <div style={{ color: ACCENT, marginBottom: 6, fontSize: 11 }}>{title}</div>
      <div style={{ marginBottom: 6, opacity: 0.95 }}>{bio}</div>
      <div style={{ marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: ACCENT }}>Domain</span> {primaryLabel}
      </div>
      <div style={{ fontSize: 10, opacity: 0.85 }}>
        {member.skills.slice(0, 4).join(" · ")}
      </div>
    </Html>
  );
}

function TeamMessage() {
  const lang = useStore((s) => s.language);
  const key = lang === "ko" ? "message_kr" : "message_en";
  const text = (translations.team as Record<string, string>)[key] ?? "";

  return (
    <Html
      position={[6, 0, 4]}
      transform
      distanceFactor={5}
      style={{
        pointerEvents: "none",
        width: 240,
        color: "#c9e7ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        opacity: 0.95,
      }}
    >
      {text}
    </Html>
  );
}

export function TeamScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <group>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color={ACCENT} distance={20} decay={2} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color={GLASS} />

      <TeamCore />
      <CollaborationLinks />

      {members.map((member, index) => (
        <MemberNode
          key={member.id}
          member={member}
          index={index}
          isHovered={hoveredId === member.id}
          onHover={(v) => setHoveredId(v ? member.id : null)}
        />
      ))}

      <TeamMessage />
    </group>
  );
}
