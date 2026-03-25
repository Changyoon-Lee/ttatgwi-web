import type { SceneId } from "@/lib/store";
import { useStore } from "@/lib/store";
import { SCENE_RANGES, getSceneIdFromProgress } from "@/lib/camera/sceneRanges";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type SceneCheckpointPlan = {
  id: SceneId;
  checkpoints?: number[];
  entryLockSec?: number;
  holdSec?: number;
  moveMaxSpeed?: number;
};

type InternalCheckpoint = {
  progress: number;
  sceneId: SceneId;
  indexInScene: number;
  holdSec: number;
  moveMaxSpeed: number;
};

export const DEFAULT_ENTRY_LOCK_SEC = 0.9;
export const DEFAULT_HOLD_SEC = 0.8;
export const DEFAULT_MOVE_MAX_SPEED = 0.0016;
const SAME_SCENE_BOOST_MULTIPLIER = 1.25;
const SAME_SCENE_BOOST_FRAMES = 10;

const SCENE_PLANS: SceneCheckpointPlan[] = [
  { id: "hero", checkpoints: [0.1, 0.14, 0.17], holdSec: 1.0 },
  { id: "corridor", checkpoints: [0.2, 0.24, 0.27], holdSec: 1.1, moveMaxSpeed: 0.0013 },
  { id: "method", checkpoints: [0.42, 0.46, 0.5], holdSec: 1.0 },
  // portfolio 구간(0.52~0.66): 패널들을 가까이 볼 수 있도록 4개 지점 추가
  { id: "portfolio", checkpoints: [0.54, 0.57, 0.6, 0.63, 0.65], holdSec: 1.0 },
];

const planMap = new Map<SceneId, SceneCheckpointPlan>();
SCENE_PLANS.forEach((p) => planMap.set(p.id, p));

const CHECKPOINTS: InternalCheckpoint[] = SCENE_RANGES.flatMap((range) => {
  const plan = planMap.get(range.id);
  const raw = plan?.checkpoints?.length
    ? plan.checkpoints
    : [(range.start + range.end) * 0.5];

  return raw
    .map((p) => clamp(p, range.start, range.end))
    .sort((a, b) => a - b)
    .map((progress, indexInScene) => ({
      progress,
      sceneId: range.id,
      indexInScene,
      holdSec: plan?.holdSec ?? DEFAULT_HOLD_SEC,
      moveMaxSpeed: plan?.moveMaxSpeed ?? DEFAULT_MOVE_MAX_SPEED,
    }));
});

let _progress = CHECKPOINTS[0]?.progress ?? 0;
let _currentCheckpointIndex = 0;
let _targetCheckpointIndex: number | null = null;
let _moving = false;
let _animating = false;
let _lockUntilMs = 0;
let _boostFrames = 0;
let _lastFrameSpeed = 0;
let _queueDir: -1 | 1 | null = null;
let _cameraPos: [number, number, number] = [0, 0, 0];
let _cameraLook: [number, number, number] = [0, 0, 0];

function findNearestCheckpointIndex(p: number): number {
  if (CHECKPOINTS.length === 0) return 0;
  let best = 0;
  let bestDist = Math.abs(CHECKPOINTS[0].progress - p);
  for (let i = 1; i < CHECKPOINTS.length; i++) {
    const d = Math.abs(CHECKPOINTS[i].progress - p);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  }
  return best;
}

function lockForCheckpoint(index: number): void {
  const cp = CHECKPOINTS[index];
  if (!cp) return;
  const entryLock = cp.indexInScene === 0
    ? planMap.get(cp.sceneId)?.entryLockSec ?? DEFAULT_ENTRY_LOCK_SEC
    : 0;
  const hold = Math.max(cp.holdSec, entryLock);
  _lockUntilMs = performance.now() + hold * 1000;
}

function forwardCrossesSceneBoundary(): boolean {
  const nextIdx = clamp(_currentCheckpointIndex + 1, 0, CHECKPOINTS.length - 1);
  if (nextIdx <= _currentCheckpointIndex) return false;
  const curCp = CHECKPOINTS[_currentCheckpointIndex];
  const nextCp = CHECKPOINTS[nextIdx];
  return Boolean(curCp && nextCp && nextCp.sceneId !== curCp.sceneId);
}

function startMoveByDir(dir: -1 | 1): void {
  if (CHECKPOINTS.length === 0) return;
  if (
    dir === 1 &&
    forwardCrossesSceneBoundary() &&
    !useStore.getState().nextScenePreloadReady
  ) {
    return;
  }
  const next = clamp(_currentCheckpointIndex + dir, 0, CHECKPOINTS.length - 1);
  if (next === _currentCheckpointIndex) return;
  _targetCheckpointIndex = next;
  _moving = true;
  _boostFrames = 0;
  _queueDir = null;
}

function isLocked(now: number): boolean {
  return now < _lockUntilMs;
}

export function getProgress(): number {
  return _progress;
}

export function setProgress(value: number): void {
  _progress = clamp(value, 0, 1);
}

export function setProgressAndTarget(value: number): void {
  const v = clamp(value, 0, 1);
  _progress = v;
  _currentCheckpointIndex = findNearestCheckpointIndex(v);
  _targetCheckpointIndex = null;
  _moving = false;
  _boostFrames = 0;
  _queueDir = null;
  _lockUntilMs = 0;
}

export function setAnimating(value: boolean): void {
  _animating = value;
}

export function notifyWheel(deltaY: number): void {
  if (Math.abs(deltaY) < 1e-3) return;
  if (_animating) return;

  const dir: -1 | 1 = deltaY > 0 ? 1 : -1;
  const now = performance.now();

  if (isLocked(now)) return;

  if (_moving) {
    const target = _targetCheckpointIndex != null ? CHECKPOINTS[_targetCheckpointIndex] : null;
    const current = CHECKPOINTS[_currentCheckpointIndex];
    const sameSceneSegment = Boolean(target && current && target.sceneId === current.sceneId);
    if (sameSceneSegment && _targetCheckpointIndex != null) {
      const moveDir: -1 | 1 = _targetCheckpointIndex > _currentCheckpointIndex ? 1 : -1;
      if (moveDir === dir) _boostFrames = SAME_SCENE_BOOST_FRAMES;
    }
    return;
  }

  startMoveByDir(dir);
}

export function tickProgress(deltaSeconds: number): number {
  _lastFrameSpeed = 0;
  if (_animating) return _progress;

  const now = performance.now();
  if (!_moving) {
    if (isLocked(now)) return _progress;
    if (_queueDir) {
      startMoveByDir(_queueDir);
      _queueDir = null;
    }
    return _progress;
  }

  const targetIndex = _targetCheckpointIndex;
  if (targetIndex == null) {
    _moving = false;
    return _progress;
  }

  const target = CHECKPOINTS[targetIndex];
  const current = CHECKPOINTS[_currentCheckpointIndex];
  if (!target || !current) {
    _moving = false;
    return _progress;
  }

  let speed = target.moveMaxSpeed;
  if (target.sceneId === current.sceneId && _boostFrames > 0) {
    speed = Math.min(target.moveMaxSpeed, target.moveMaxSpeed * SAME_SCENE_BOOST_MULTIPLIER);
    _boostFrames--;
  }

  const diff = target.progress - _progress;
  const stepCap = speed * Math.max(0.5, deltaSeconds * 60);
  const step = Math.abs(diff) <= stepCap ? diff : Math.sign(diff) * stepCap;
  _progress = clamp(_progress + step, 0, 1);
  _lastFrameSpeed = Math.abs(step);

  if (Math.abs(target.progress - _progress) <= stepCap * 0.5) {
    _progress = target.progress;
    _currentCheckpointIndex = targetIndex;
    _targetCheckpointIndex = null;
    _moving = false;
    _boostFrames = 0;
    lockForCheckpoint(_currentCheckpointIndex);
  }

  return _progress;
}

export function getDebugState(): {
  sceneId: SceneId;
  checkpointIndex: number;
  checkpointInScene: number;
  targetCheckpointIndex: number | null;
  moving: boolean;
  locked: boolean;
  lockRemainingSec: number;
  lastFrameSpeed: number;
  progress: number;
  cameraPos: [number, number, number];
  cameraLook: [number, number, number];
} {
  const now = performance.now();
  const cp = CHECKPOINTS[_currentCheckpointIndex];
  return {
    sceneId: cp?.sceneId ?? getSceneIdFromProgress(_progress),
    checkpointIndex: _currentCheckpointIndex,
    checkpointInScene: cp?.indexInScene ?? 0,
    targetCheckpointIndex: _targetCheckpointIndex,
    moving: _moving,
    locked: isLocked(now),
    lockRemainingSec: Math.max(0, (_lockUntilMs - now) / 1000),
    lastFrameSpeed: _lastFrameSpeed,
    progress: _progress,
    cameraPos: _cameraPos,
    cameraLook: _cameraLook,
  };
}

export function setCameraDebug(
  cameraPos: [number, number, number],
  cameraLook: [number, number, number]
): void {
  _cameraPos = cameraPos;
  _cameraLook = cameraLook;
}
