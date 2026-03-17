"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { preloadSceneAssets } from "@/lib/preload";
import { getSceneRange, getSectionProgress } from "@/lib/camera/sceneRanges";

const TUBE_RADIUS = 4;
const TUBE_SEGMENTS = 120;
const TUBE_RADIAL = 64;
const FLOW_RING_RADIUS = 4.1;
const FLOW_RING_TUBE = 0.05;
const RING_Z = [-5, -10, -15, -20];
const PARTICLE_COUNT = 800;
const TUBE_PHASE_THRESHOLD = 0.55;

/** Corridor fog when in corridor segment. Mount in Canvas (e.g. MainCanvas). */
export function CorridorFog() {
  const { scene } = useThree();
  const currentScene = useStore((s) => s.currentScene);
  const prevFog = useRef<THREE.Fog | THREE.FogExp2 | null>(null);

  useEffect(() => {
    if (currentScene !== "corridor") return;
    prevFog.current = scene.fog;
    scene.fog = new THREE.Fog("#05070d", 10, 40);
    return () => {
      if (prevFog.current) scene.fog = prevFog.current;
    };
  }, [currentScene, scene]);

  return null;
}

/** Particles flowing backward (speed effect) inside tunnel */
function CorridorParticleFlow() {
  const ref = useRef<THREE.Points>(null);
  const { positions, geometry } = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * (TUBE_RADIUS - 0.5);
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = Math.sin(theta) * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return { positions: arr, geometry: g };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      (pos.array as Float32Array)[i * 3 + 2] += 0.05;
      if ((pos.array as Float32Array)[i * 3 + 2] > 5)
        (pos.array as Float32Array)[i * 3 + 2] = -30;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.04}
        color="#7af0ff"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function GlassCorridorScene() {
  const groupRef = useRef<THREE.Group>(null);
  const currentScene = useStore((s) => s.currentScene);
  const globalProgress = useStore((s) => s.globalProgress);

  const corridorRange = useMemo(() => getSceneRange("corridor"), []);
  const corridorLocal =
    corridorRange != null
      ? getSectionProgress(globalProgress, corridorRange.start, corridorRange.end)
      : 0;

  const showTube = corridorLocal < TUBE_PHASE_THRESHOLD;
  const showRingsAndEffects = corridorLocal >= TUBE_PHASE_THRESHOLD;

  const tubePath = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -20),
        new THREE.Vector3(0, 1, -40),
        new THREE.Vector3(0, 0, -70),
      ],
      false,
      "catmullrom",
      0.5
    );
  }, []);

  const tubeGeometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        tubePath,
        TUBE_SEGMENTS,
        TUBE_RADIUS,
        TUBE_RADIAL,
        false
      ),
    [tubePath]
  );

  useEffect(() => {
    if (currentScene === "corridor") preloadSceneAssets();
  }, [currentScene]);

  return (
    <group ref={groupRef}>
      {showTube && (
        <mesh geometry={tubeGeometry} scale={1}>
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.8}
            roughness={0.05}
            ior={1.45}
            chromaticAberration={0.04}
            anisotropy={0.2}
            color="#c9e7ff"
            side={THREE.BackSide}
          />
        </mesh>
      )}
      {showRingsAndEffects && (
        <>
          {RING_Z.map((z, i) => (
            <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[FLOW_RING_RADIUS, FLOW_RING_TUBE, 16, 200]} />
              <meshBasicMaterial color="#7af0ff" />
            </mesh>
          ))}
          <CorridorParticleFlow />
          <ambientLight intensity={0.3} />
          <pointLight
            position={[0, 0, -15]}
            intensity={2}
            color="#7af0ff"
            distance={50}
          />
        </>
      )}
    </group>
  );
}

