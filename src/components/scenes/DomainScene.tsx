"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Html } from "@react-three/drei";
import { useStore } from "@/lib/store";
import translations from "@/data/translations.json";

const FLOOR_COLOR = "#0a0c14";
const ACCENT = "#7af0ff";
const GLASS = "#c9e7ff";
const VIOLET = "#b48dff";

/** Domain sculpture config: position (local to DomainScene), key for i18n, element type */
const DOMAINS = [
  { key: "structure" as const, pos: [-6, 0, -2] as [number, number, number], element: "frames" as const },
  // { key: "insight" as const, pos: [0, 0, -8] as [number, number, number], element: "liquidSphere" as const },
  // { key: "build" as const, pos: [6, 0, -2] as [number, number, number], element: "modules" as const },
  // { key: "experience" as const, pos: [0, 0, 4] as [number, number, number], element: "organic" as const },
];

function GalleryFloor() {
  return null;
}

/** Glass structural frames: Icosahedron + wireframe overlay */
function StructureSculpture() {
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, 2), []);
  return (
    <group>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.6}
          roughness={0.05}
          ior={1.45}
          chromaticAberration={0.02}
          color={GLASS}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={ACCENT}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

/** Surface distortion for liquid sphere (vertex noise along normal) */
const insightVertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  float n(vec3 p) {
    return sin(p.x * 2. + uTime) * sin(p.y * 3. + uTime * 0.7) * sin(p.z * 2.5 + uTime * 0.5);
  }
  void main() {
    vNormal = normal;
    vec3 pos = position + normal * n(position) * 0.1;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const insightFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float f = 0.5 + 0.5 * dot(vNormal, vec3(0, 1, 0));
    gl_FragColor = vec4(0.47, 0.94, 1.0, 0.85 * f);
  }
`;

function InsightSculpture() {
  const geometry = useMemo(() => new THREE.SphereGeometry(2, 64, 64), []);
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: insightVertexShader,
      fragmentShader: insightFragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      side: THREE.DoubleSide,
    });
    return m;
  }, []);

  useFrame((_, delta) => {
    if (material.uniforms?.uTime) material.uniforms.uTime.value += delta;
  });

  return (
    <mesh ref={ref} geometry={geometry} material={material} />
  );
}

/** Modular glass cubes at spec positions */
const BUILD_POSITIONS: [number, number, number][] = [
  [0, 0, 0],
  [1.2, 0, 0],
  [-1.2, 0, 0],
  [0, 1.2, 0],
];

function BuildSculpture() {
  return (
    <group>
      {BUILD_POSITIONS.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[1, 1, 1]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.5}
            roughness={0.08}
            ior={1.45}
            color={GLASS}
          />
        </mesh>
      ))}
    </group>
  );
}

function ExperienceSculpture() {
  const geometry = useMemo(
    () => new THREE.TorusKnotGeometry(1.8, 0.4, 200, 32),
    []
  );
  return (
    <mesh geometry={geometry}>
      <MeshTransmissionMaterial
        transmission={1}
        roughness={0.1}
        thickness={0.7}
        ior={1.45}
        chromaticAberration={0.02}
        color={VIOLET}
      />
    </mesh>
  );
}

function DomainLabel({
  domainKey,
  hovered,
}: {
  domainKey: (typeof DOMAINS)[number]["key"];
  hovered: boolean;
}) {
  const lang = useStore((s) => s.language);
  const suffix = lang === "ko" ? "_kr" : "_en";
  const title = (translations.domains as Record<string, string>)[`${domainKey}${suffix}`] ?? domainKey;
  const descKey = `${domainKey}_desc${suffix}`;
  const desc = (translations.domains as Record<string, string>)[descKey] ?? "";

  if (!hovered) return null;

  return (
    <Html
      center
      position={[0, 2.8, 0]}
      distanceFactor={8}
      style={{
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        textAlign: "center",
        color: "#c9e7ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.9rem",
        opacity: 0.95,
        textShadow: "0 0 20px rgba(122, 240, 255, 0.4)",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>{title}</div>
        <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>{desc}</div>
      </div>
    </Html>
  );
}

const TARGET_SCALE = 1.3;
const LERP_FACTOR = 0.1;

export function DomainScene() {
  const [hovered, setHovered] = useState<string | null>(null);
  const groupRefs = useRef<Record<string, THREE.Group | null>>({
    structure: null,
    insight: null,
    build: null,
    experience: null,
  });
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1));

  useFrame(() => {
    DOMAINS.forEach((d) => {
      const g = groupRefs.current[d.key];
      if (!g) return;
      const target = hovered === d.key ? TARGET_SCALE : 1;
      scaleVec.current.set(target, target, target);
      g.scale.lerp(scaleVec.current, LERP_FACTOR);
    });
  });

  return (
    <group>
      <GalleryFloor />

      <ambientLight intensity={0.4} />
      <spotLight position={[0, 10, 5]} intensity={3} color={GLASS} angle={0.5} penumbra={0.6} />
      <pointLight position={[0, 4, -5]} intensity={2} color={ACCENT} />
      <pointLight position={[5, 3, 2]} intensity={1} color={VIOLET} />

      {DOMAINS.map((d) => (
        <group
          key={d.key}
          ref={(el) => {
            groupRefs.current[d.key] = el;
          }}
          position={d.pos}
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHovered(d.key);
          }}
          onPointerLeave={() => setHovered(null)}
          onPointerOver={(e) => e.stopPropagation()}
        >
          {d.element === "frames" && <StructureSculpture />}
          {/* {d.element === "liquidSphere" && <InsightSculpture />}
          {d.element === "modules" && <BuildSculpture />}
          {d.element === "organic" && <ExperienceSculpture />} */}
          <DomainLabel domainKey={d.key} hovered={hovered === d.key} />
        </group>
      ))}
    </group>
  );
}
