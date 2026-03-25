"use client";

import { useEffect, useState } from "react";
import { getDebugState } from "@/lib/hybridScroll";

const TOGGLE_KEY = "`";

function fmt(v: number): string {
  return Number.isFinite(v) ? v.toFixed(3) : "0.000";
}

export function CameraDebugPanel() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(() => getDebugState());

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === TOGGLE_KEY) setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !open) return;
    const id = window.setInterval(() => setSnapshot(getDebugState()), 120);
    return () => window.clearInterval(id);
  }, [open]);

  if (process.env.NODE_ENV !== "development" || !open) return null;

  return (
    <div
      className="fixed bottom-3 left-3 z-50 rounded-md border border-cyan-200/20 bg-black/75 p-3 text-xs text-cyan-100"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
    >
      <div>scene: {snapshot.sceneId}</div>
      <div>progress: {fmt(snapshot.progress)}</div>
      <div>cp: #{snapshot.checkpointIndex} (scene:{snapshot.checkpointInScene})</div>
      <div>targetCp: {snapshot.targetCheckpointIndex ?? "-"}</div>
      <div>moving: {String(snapshot.moving)}</div>
      <div>locked: {String(snapshot.locked)} ({fmt(snapshot.lockRemainingSec)}s)</div>
      <div>speed: {fmt(snapshot.lastFrameSpeed)}</div>
      <div>
        pos: [{fmt(snapshot.cameraPos[0])}, {fmt(snapshot.cameraPos[1])}, {fmt(snapshot.cameraPos[2])}]
      </div>
      <div>
        look: [{fmt(snapshot.cameraLook[0])}, {fmt(snapshot.cameraLook[1])}, {fmt(snapshot.cameraLook[2])}]
      </div>
      <div className="mt-1 opacity-70">toggle: `</div>
    </div>
  );
}
