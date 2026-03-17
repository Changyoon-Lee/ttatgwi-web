"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls, Environment } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { getSceneIdFromProgress } from "@/lib/camera/sceneRanges";
import { getSceneIndex, getVisibleSceneIndices } from "@/lib/camera/orchestrationSpec";
import { getSceneConfigs } from "@/lib/camera/sceneRegistry";
import { CameraRig } from "./CameraRig";
import { ScrollController } from "./ScrollController";
import { PreloadTrigger } from "./PreloadTrigger";
import { SceneReadySignal } from "./SceneReadySignal";
import { VoidEnvironment } from "./VoidEnvironment";
import { WebGLContextHandler } from "./WebGLContextHandler";
import { GlassCorridorScene, CorridorFog } from "@/components/scenes/GlassCorridorScene";

const sceneConfigs = getSceneConfigs();

function SceneContent() {
  const globalProgress = useStore((s) => s.globalProgress);
  const currentSceneId = getSceneIdFromProgress(globalProgress);
  const currentIndex = getSceneIndex(currentSceneId);
  const visibleIndices = getVisibleSceneIndices(currentIndex);

  return (
    <>
      <WebGLContextHandler />
      <SceneReadySignal />
      <VoidEnvironment />
      <CorridorFog />
      <CameraRig />
      <ScrollController />
      <PreloadTrigger />
      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 10, 6]} intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={0.4} color="#7af0ff" />
      <spotLight position={[5, 5, 5]} intensity={2} angle={0.4} penumbra={0.5} color="#c9e7ff" />
      <Environment files="/hdr/studio_small_1k.hdr" />
      {sceneConfigs.map(
        (cfg, index) =>
          visibleIndices.includes(index) && (
            <group key={cfg.id} position={[0, 0, cfg.z]}>
              <cfg.Component />
            </group>
          )
      )}
    </>
  );
}

export function MainCanvas() {
  const [dprMax, setDprMax] = useState(2);
  useEffect(() => {
    setDprMax(Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 2));
  }, []);

  return (
    <div className="fixed inset-0 bg-[#05070d]" data-canvas-wrapper>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 50], fov: 50 }}
        dpr={[1, dprMax]}
      >
        <ScrollControls
          pages={11}
          damping={0.12}
          maxSpeed={0.04}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <SceneContent />
        </ScrollControls>
      </Canvas>
    </div>
  );
}
