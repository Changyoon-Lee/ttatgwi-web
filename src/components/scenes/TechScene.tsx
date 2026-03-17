"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Text, Html, Billboard, Image } from "@react-three/drei";
import { useStore } from "@/lib/store";
import translations from "@/data/translations.json";

const CORE_COLOR = "#9be8ff";
const NODE_COLOR = "#7af0ff";
const RING_COLOR = "#3a4aff";
const PARTICLE_COUNT = 2000;

const ICON_COLOR = "7af0ff";

type TechItem = {
  id: string;
  name: string;
  labelEn: string;
  labelKr: string;
  descEn: string;
  descKr: string;
  radius: number;
  speed: number;
  angleOffset: number;
  /** simpleicons slug for cdn.simpleicons.org */
  iconSlug: string;
};

const TECH_ITEMS: TechItem[] = [
  { id: "react", name: "React", labelEn: "UI layer", labelKr: "UI 레이어", descEn: "Frontend architecture", descKr: "프론트엔드 아키텍처", radius: 4.2, speed: 0.4, angleOffset: 0, iconSlug: "react" },
  { id: "node", name: "Node.js", labelEn: "Runtime", labelKr: "런타임", descEn: "Server-side JavaScript", descKr: "서버 사이드 JavaScript", radius: 4.2, speed: 0.35, angleOffset: 1.2, iconSlug: "nodedotjs" },
  { id: "python", name: "Python", labelEn: "Logic & data", labelKr: "로직·데이터", descEn: "Backend and tooling", descKr: "백엔드 및 도구", radius: 4.5, speed: 0.38, angleOffset: 2.1, iconSlug: "python" },
  { id: "unity", name: "Unity", labelEn: "Experience", labelKr: "경험", descEn: "Interactive experiences", descKr: "인터랙티브 경험", radius: 4.5, speed: 0.33, angleOffset: 3, iconSlug: "unity" },
  { id: "elastic", name: "Elasticsearch", labelEn: "Search", labelKr: "검색", descEn: "Search and analytics engine", descKr: "검색·분석 엔진", radius: 5.8, speed: 0.28, angleOffset: 0.5, iconSlug: "elasticsearch" },
  { id: "polars", name: "Polars", labelEn: "Data processing", labelKr: "데이터 처리", descEn: "Fast dataframes", descKr: "고속 데이터프레임", radius: 5.8, speed: 0.3, angleOffset: 1.8, iconSlug: "polars" },
  { id: "pandas", name: "Pandas", labelEn: "Analysis", labelKr: "분석", descEn: "Data analysis", descKr: "데이터 분석", radius: 6, speed: 0.26, angleOffset: 3.2, iconSlug: "pandas" },
  { id: "docker", name: "Docker", labelEn: "Containers", labelKr: "컨테이너", descEn: "Deployment and isolation", descKr: "배포·격리", radius: 6.8, speed: 0.22, angleOffset: 0.8, iconSlug: "docker" },
  { id: "k8s", name: "Kubernetes", labelEn: "Infrastructure", labelKr: "인프라", descEn: "Orchestration at scale", descKr: "대규모 오케스트레이션", radius: 6.8, speed: 0.2, angleOffset: 2.4, iconSlug: "kubernetes" },
];

function CoreCrystal() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.OctahedronGeometry(2.5, 3), []);

  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y = state.clock.elapsedTime * 0.08;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <MeshTransmissionMaterial
        transmission={1}
        thickness={1.2}
        roughness={0}
        ior={1.5}
        chromaticAberration={0.04}
        color={CORE_COLOR}
      />
    </mesh>
  );
}

const RING_RADII = [3.8, 5.3, 6.8];

function OrbitPaths() {
  return (
    <group>
      {RING_RADII.map((inner, i) => {
        const outer = inner + 0.2;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[inner, outer, 64]} />
            <meshBasicMaterial
              color={RING_COLOR}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function OrbitNode({
  tech,
  isHovered,
  onHover,
}: {
  tech: TechItem;
  isHovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleGroupRef = useRef<THREE.Group>(null);
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1));
  const iconUrl = `https://cdn.simpleicons.org/${tech.iconSlug}/${ICON_COLOR}`;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = t * tech.speed + tech.angleOffset;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle) * tech.radius;
      groupRef.current.position.z = Math.sin(angle) * tech.radius;
    }
    if (scaleGroupRef.current) {
      scaleVec.current.lerp(
        new THREE.Vector3(isHovered ? 1.2 : 1, isHovered ? 1.2 : 1, isHovered ? 1.2 : 1),
        0.12
      );
      scaleGroupRef.current.scale.copy(scaleVec.current);
    }
  });

  const lang = useStore((s) => s.language);
  const label = lang === "ko" ? tech.labelKr : tech.labelEn;
  const desc = lang === "ko" ? tech.descKr : tech.descEn;

  return (
    <group ref={groupRef}>
      <group ref={scaleGroupRef}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <group
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
          <Image
            url={iconUrl}
            position={[0, 0, 0]}
            scale={0.7}
            transparent
            opacity={0.95}
          />
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.28}
            color="#c9e7ff"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.5}
          >
            {tech.name}
          </Text>
          {!isHovered && (
            <Text
              position={[0, 0.25, 0]}
              fontSize={0.16}
              color="rgba(201,231,255,0.8)"
              anchorX="center"
              anchorY="middle"
              maxWidth={2.2}
            >
              {label}
            </Text>
          )}
        </group>
        {isHovered && (
          <Html
            center
            position={[0, 0.75, 0]}
            distanceFactor={4}
            style={{
              pointerEvents: "none",
              color: "#c9e7ff",
              fontSize: 11,
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {desc}
          </Html>
        )}
      </Billboard>
      </group>
    </group>
  );
}

function ParticleEnergy() {
  const ref = useRef<THREE.Points>(null);
  const { positions, geometry } = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 2.5 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(theta) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return { positions: arr, geometry: g };
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.002;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        color={CORE_COLOR}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function TechPhilosophy() {
  const lang = useStore((s) => s.language);
  const suffix = lang === "ko" ? "_kr" : "_en";
  const tech = translations.tech as Record<string, string>;
  const line1 = tech[`philosophy${suffix}`] ?? "";
  const line2 = tech[`philosophy_sub${suffix}`] ?? "";

  return (
    <Html
      position={[-8, 0, 4]}
      transform
      distanceFactor={6}
      style={{
        pointerEvents: "none",
        width: 260,
        color: "#c9e7ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        lineHeight: 1.5,
        opacity: 0.95,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{line1}</div>
        <div style={{ opacity: 0.9 }}>{line2}</div>
      </div>
    </Html>
  );
}

export function TechScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={4} color={NODE_COLOR} distance={25} decay={2} />

      <ParticleEnergy />
      <CoreCrystal />
      <OrbitPaths />

      {TECH_ITEMS.map((tech) => (
        <OrbitNode
          key={tech.id}
          tech={tech}
          isHovered={hoveredId === tech.id}
          onHover={(v) => setHoveredId(v ? tech.id : null)}
        />
      ))}

      <TechPhilosophy />
    </group>
  );
}
