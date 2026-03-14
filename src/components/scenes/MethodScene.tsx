"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial, Text } from "@react-three/drei";
import { useScroll } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { getSceneRange } from "@/lib/camera/sceneRanges";
import translations from "@/data/translations.json";

const FRAGMENT_COUNT = 120;
const CORE_COLOR = "#9be8ff";
const methodRange = getSceneRange("method") ?? { start: 0.4, end: 0.52 };
const METHOD_SCROLL_START = methodRange.start;
const METHOD_SCROLL_END = methodRange.end;
const CONVERGE_START = 0.25; // within method segment, 0~1
const CONVERGE_END = 0.75;

function smoothstep(t: number, a: number, b: number): number {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** Glass shards that float then converge to center */
function FloatingFragments() {
  const scroll = useScroll();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const initialPositions = useRef<THREE.Vector3[]>([]);
  const currentPositions = useRef<THREE.Vector3[]>([]);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  if (initialPositions.current.length === 0) {
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      initialPositions.current.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 12
        )
      );
      currentPositions.current.push(
        initialPositions.current[i].clone()
      );
    }
  }

  useFrame((state) => {
    const offset = scroll?.offset ?? 0;
    const methodT = (offset - METHOD_SCROLL_START) / (METHOD_SCROLL_END - METHOD_SCROLL_START);
    const methodProgress = Math.max(0, Math.min(1, methodT));
    const converge = smoothstep(methodProgress, CONVERGE_START, CONVERGE_END);
    const time = state.clock.elapsedTime;

    if (!meshRef.current) return;

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const cur = currentPositions.current[i];
      const init = initialPositions.current[i];
      const drift = new THREE.Vector3(
        Math.sin(time + i * 0.1) * 0.002,
        Math.cos(time + i * 0.07) * 0.002,
        Math.sin(time * 0.5 + i * 0.1) * 0.002
      );
      const floatTarget = init.clone().add(drift);
      const target = converge < 0.001 ? floatTarget : origin.clone().lerp(floatTarget, 1 - converge);
      cur.lerp(target, 0.02);

      dummy.position.copy(cur);
      dummy.scale.setScalar(1);
      dummy.rotation.set(
        time * 0.02 + i * 0.1,
        time * 0.03 + i * 0.12,
        time * 0.01 + i * 0.08
      );
      dummy.updateMatrixWorld();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.6), []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, FRAGMENT_COUNT]} castShadow receiveShadow>
      <MeshTransmissionMaterial
        transmission={1}
        thickness={0.4}
        roughness={0.2}
        ior={1.45}
        color={CORE_COLOR}
      />
    </instancedMesh>
  );
}

/** Central crystal: appears as fragments converge */
function TransformationCore() {
  const scroll = useScroll();
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.OctahedronGeometry(2, 3), []);

  useFrame((state) => {
    const offset = scroll?.offset ?? 0;
    const methodT = (offset - METHOD_SCROLL_START) / (METHOD_SCROLL_END - METHOD_SCROLL_START);
    const methodProgress = Math.max(0, Math.min(1, methodT));
    const visible = smoothstep(methodProgress, 0.15, 0.4);
    if (meshRef.current) {
      meshRef.current.scale.setScalar(visible);
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={0}>
      <MeshTransmissionMaterial
        transmission={1}
        thickness={1}
        roughness={0}
        ior={1.5}
        chromaticAberration={0.05}
        color={CORE_COLOR}
      />
    </mesh>
  );
}

/** One line per stage, opacity by scroll */
function StageText() {
  const scroll = useScroll();
  const lang = useStore((s) => s.language);
  const suffix = lang === "ko" ? "_kr" : "_en";
  const stages = [1, 2, 3, 4, 5] as const;
  const method = translations.method as Record<string, string>;

  return (
    <group position={[0, 3, 5]}>
      {stages.map((n, i) => {
        const key = `stage${n}${suffix}`;
        const label = method[key] ?? "";
        return (
          <StageLine
            key={n}
            index={i}
            total={5}
            label={label}
            scroll={scroll}
          />
        );
      })}
    </group>
  );
}

function StageLine({
  index,
  total,
  label,
  scroll,
}: {
  index: number;
  total: number;
  label: string;
  scroll: ReturnType<typeof useScroll>;
}) {
  const textRef = useRef<THREE.Mesh & { material: THREE.Material }>(null);
  const methodSpan = METHOD_SCROLL_END - METHOD_SCROLL_START;
  const stageSpan = methodSpan / total;
  const stageStart = METHOD_SCROLL_START + index * stageSpan;
  const stageEnd = stageStart + stageSpan * 0.7;
  const fadeIn = 0.15;
  const fadeOut = 0.2;

  useFrame(() => {
    const offset = scroll?.offset ?? 0;
    let opacity = 0;
    if (offset >= stageStart && offset <= stageEnd) {
      const t = (offset - stageStart) / (stageEnd - stageStart);
      opacity = smoothstep(t, 0, fadeIn) * (1 - smoothstep(t, 1 - fadeOut, 1));
    }
    const mesh = textRef.current;
    if (mesh?.material) {
      const mat = mesh.material as THREE.Material & { opacity?: number };
      mat.transparent = true;
      mat.opacity = opacity;
    }
  });

  return (
    <Text
      ref={textRef}
      position={[0, -index * 0.55, 0]}
      fontSize={0.4}
      color="#c9e7ff"
      anchorX="center"
      anchorY="middle"
      maxWidth={8}
    >
      {label}
    </Text>
  );
}

/** Light from center core */
function LightField() {
  return (
    <pointLight
      position={[0, 0, 0]}
      intensity={4}
      color={CORE_COLOR}
      distance={30}
      decay={2}
    />
  );
}

export function MethodScene() {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <LightField />
      <FloatingFragments />
      <TransformationCore />
      <StageText />
    </group>
  );
}
