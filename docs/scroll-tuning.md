# 스크롤·씬 이동 감각 조절

## 최초 Hero 자동 이동 / 네비 클릭이 안 되었던 원인

1. **스크롤 컨테이너를 잘못 찾음**  
   drei `ScrollControls`는 `gl.domElement.parentNode`에 스크롤용 div를 **appendChild**로 붙인다.  
   우리는 `[data-canvas-wrapper]`의 첫 번째 자식의 **두 번째 자식**(`inner.children[1]`)을 가정했는데, 실제 DOM에서는 그 시점에 자식이 **한 개뿐**이었다 (R3F/Next 구조상 canvas만 있는 div가 먼저 있고, 스크롤 div는 그와 형제로 붙지만 다른 레벨에 있거나 마운트 순서 차이로 인해 인덱스로 찾기 불안정).

2. **해결**  
   인덱스(`children[1]`) 대신 **wrapper 아래에서 `overflow-y: auto/scroll` 이고 `scrollHeight > clientHeight` 인 요소를 찾는** 방식(`findScrollableIn`)으로 바꿨다.  
   구조가 바뀌어도 스크롤 div 하나만 찾으면 되므로 한 번에 찾을 수 있다.

3. **자동 스크롤 타이머가 리셋되던 문제**  
   `useEffect` 의존 배열에 `globalProgress`가 있어서, 매 프레임 progress가 바뀔 때마다 effect가 다시 돌고 **1.5초 타이머가 계속 clear + 재설정**되어 실제로는 스크롤이 한 번도 실행되지 않았다.  
   의존 배열을 `[scene2Ready]`만 두고, 타이머 콜백 안에서 `useStore.getState().globalProgress`로 “이미 스크롤했는지”만 확인하도록 바꿔 해결했다.

---

## “엄청 돌려도 안 되다가 어느 순간 팍 이동”하는 이유 (로딩 아님)

스크롤은 **바로** 반영되지만, 씬/카메라가 움직이는 값은 **두 단계**를 거쳐서 따라옵니다.

1. **drei ScrollControls**  
   휠 → 스크롤 컨테이너 `scrollTop`은 즉시 변함.  
   하지만 씬이 사용하는 `state.offset`은 **매 프레임 `scroll.current`를 향해 damping**되며, **한 프레임에 움직일 수 있는 양이 `maxSpeed`로 제한**됨 (현재 0.15).  
   → 휠을 많이 돌려도 `state.offset`은 이 상한만큼씩만 올라가서, “돌려도 안 움직이다가 나중에 한꺼번에 따라오는” 느낌이 남.

2. **CameraRig + scrollMapper**  
   `scroll.offset`(＝`state.offset`)을 목표로 **또 한 번** `easeProgress(..., PROGRESS_LERP)`로 보간.  
   → 이중으로 늦게 반응해서 “어느 순간 팍” 이동하는 느낌이 더 커짐.

**다른 씬에서도 비슷한 현상**이 나오는 이유도 같습니다. Void만의 문제가 아니라, **전체 스크롤에 공통으로 적용된 이중 보간 + maxSpeed** 때문입니다. 로딩 여부와는 무관합니다.

## Void → Hero가 특히 심하게 느껴지는 이유

- **Void 구간이 전체 progress의 8%만 차지** (0~0.08).  
  전체 스크롤 길이가 11페이지라서 Void에 해당하는 **실제 픽셀 거리가 짧음**.
- 위의 이중 보간이 겹치면, “조금만 돌려도 넘어가야 할” 구간인데도 progress가 천천히 올라가서, **스크롤이 안 먹는다**고 느껴짐.

## 조절 포인트 (빨리/느리게)

| 목적 | 파일 | 항목 |
|------|------|------|
| **휠 한 번에 progress가 따라오는 최대 속도** | `MainCanvas.tsx` | `ScrollControls`의 **`maxSpeed`** (현재 0.15). 키우면 휠에 더 빨리 반응, 줄이면 덜 덜컹거림. |
| **스크롤바 위치 → progress 보간 속도** | `scrollMapper.ts` | **`PROGRESS_LERP`** (0.12). 키우면 카메라/씬이 스크롤 위치에 더 빨리 맞춤, 줄이면 더 부드럽지만 지연 느낌. |
| **카메라 위치/시선이 목표로 다가가는 속도** | `CameraRig.tsx` | **`SMOOTH_POS`**, **`SMOOTH_LOOK`** (0.06). 키우면 카메라가 더 날카롭게 따라옴, 줄이면 더 부드럽고 느림. |
| **Void 구간 비중** | `orchestrationSpec.ts` | void의 `progressEnd`를 0.08 → 0.10 등으로 살짝 키우면 Void 구간 스크롤 거리가 늘어나서 “조금만 돌려도 넘어감” 느낌이 줄어듦. |

정리하면, **“돌려도 안 되다가 팍”을 줄이려면** `maxSpeed`와 `PROGRESS_LERP`를 **올리는 것**이 효과적입니다.  
반대로 **너무 날카롭거나 덜컹거리면** 이 값들을 내리면 됨.

---

## 씬별 시점(위치·속도) 설정 위치

**진행률 구간(어디서 머무르는지)**  
→ `src/lib/camera/orchestrationSpec.ts`  
각 씬의 `progressStart`, `progressEnd`. 이 구간이 넓을수록 해당 씬에서 스크롤 거리가 길어져 머무는 시간이 길어짐.

**카메라 목표 위치·시선·궤적**  
→ `src/components/three/CameraRig.tsx`  
`useFrame` 안 `switch (sceneId)` 블록. 씬별로 `pos.current`, `lookAt.current`를 어떻게 잡는지 정해 둠.

| 씬 | 위치/시선 설정 위치 | 비고 |
|----|---------------------|------|
| void | `masterPath.getPointAt(progress)`, `lookAtPath.getPointAt(progress)` | 경로만 사용 |
| hero | `heroLocal < 0.4`면 master/lookAt 경로, 이상이면 궤도: 반지름 `r=6`, 중심 z=-70, `time*0.1` 회전 | 궤도 속도: `0.1` |
| corridor | `corridorPath.getPointAt(corridorLocal)` + time으로 x/y 미세 흔들림 `0.03`, `0.02` | 경로: `camera-path.ts` |
| domains | 반지름 10, y=2, 중심 z=-212, `time*0.2` 회전 | 궤도 속도: `0.2` |
| method | x=0, y=2, z는 `-268 + methodLocal*3`, lookAt z=-280 | progress에 비례 전진 |
| portfolio | 반지름 12, 중심 z=-350, lookAt z=-370, `time*0.15` | 궤도 속도: `0.15` |
| projectRoom | `projectRoomRail.getPointAt(projectRoomProgress)` (슬라이드 인덱스 기반) | 경로: `camera-path.ts` |
| tech | 반지름 10, 중심 z=-490, `time*0.12` | 궤도 속도: `0.12` |
| team | 반지름 10, 중심 z=-560, `time*0.1` | 궤도 속도: `0.1` |
| contact | masterPath + lookAtPath + time으로 x/y 미세 흔들림 | 경로만 사용 + 떨림 |

**경로 곡선(고정하고 싶은 위치)**  
- **void, hero 접근, projectRoom, contact** 등: `src/lib/camera/masterPath.ts`, `src/lib/camera/lookAtPath.ts`  
  `createMasterPath()`, `createLookAtPath()` 안 Vector3 배열. 포인트를 바꾸면 “이동하고 싶은 위치”를 바꿀 수 있음.  
- **corridor**: `src/lib/camera-path.ts` → `createCorridorTubePath()`  
- **projectRoom 레일**: `src/lib/camera-path.ts` → `createProjectRoomRailPath(baseZ)`

**카메라가 목표로 다가가는 속도(공통)**  
→ `CameraRig.tsx` 상단  
`SMOOTH_POS = 0.06`, `SMOOTH_LOOK = 0.06`.  
`lerpVector3(currentPos, pos.current, smooth, ...)` 에서 쓰임. 키우면 더 빨리, 줄이면 더 천천히 목표 위치/시선으로 이동.

**progress가 스크롤을 따라가는 속도(공통)**  
→ `src/lib/camera/scrollMapper.ts`  
`PROGRESS_LERP = 0.12`.  
스크롤 위치(offset) → 실제 씬에 쓰이는 progress 보간 속도.

**휠 → offset 따라가는 속도(공통)**  
→ `MainCanvas.tsx`  
`ScrollControls`의 `maxSpeed`, `damping`.

---

## 스크롤 속도에 덜 영향받고, 원하는 위치에 오래 머물고, 이동도 적당한 속도로 하고 싶을 때

### 1. 스크롤을 빨리/늦게 해도 카메라가 “비슷한 속도”로 움직이게

- **`maxSpeed`(MainCanvas)** 를 **낮추기** (예: 0.15 → 0.08)  
  → 휠을 많이 돌려도 `state.offset`이 프레임당 조금씩만 따라가서, “휠 속도”보다 “한 번에 움직일 수 있는 양”이 더 결정적이 됨.  
- **`PROGRESS_LERP`(scrollMapper)** 를 **낮추기** (예: 0.12 → 0.06~0.08)  
  → 스크롤 위치와 무관하게 progress가 천천히 변해서, 카메라가 일정한 속도로 따라가는 느낌에 가깝게 됨.  

둘 다 낮추면 “스크롤 속도에 크게 영향받지 않고, 어느 정도 고정된 속도로 이동”하는 느낌이 나고, 대신 휠을 돌린 직후 반응이 조금 늦게 느껴질 수 있음.

### 2. 원하는 위치(씬)에 오래 머물게

- **해당 씬의 progress 구간을 넓히기**  
  `orchestrationSpec.ts`에서 그 씬의 `progressEnd - progressStart`를 키움.  
  예: hero를 0.08~0.18 → 0.08~0.22로 하면, hero 구간이 전체 스크롤에서 차지하는 비중이 커져서, 같은 휠 양으로 더 오래 hero에 머무름.  
- **CameraRig에서 “고정” 구간 늘리기**  
  예: hero 씬에서 `heroLocal < 0.4`일 때만 경로를 타고, 0.4~0.9 구간은 같은 궤도 위치를 유지하도록 하면, hero 중간 구간에서 시점이 더 오래 머무름.  
  (같은 `pos`/`lookAt`을 더 넓은 progress 범위에 쓰면 됨.)

### 3. 이동 속도를 “적당히” 맞추기

- **카메라가 목표 위치로 도달하는 속도**  
  `CameraRig.tsx`의 **`SMOOTH_POS`**, **`SMOOTH_LOOK`**.  
  낮추면 부드럽고 느리게, 키우면 빠르게 착지.  
- **진행률이 바뀌는 속도**  
  **`PROGRESS_LERP`**.  
  낮추면 씬 전환이 천천히, 키우면 스크롤에 더 즉각 반응.  
- **궤도/흔들림 속도**  
  `CameraRig` 각 씬 case 안의 `time * 숫자` (예: hero `0.1`, domains `0.2`).  
  숫자를 줄이면 카메라가 그 자리에서 도는/흔들리는 속도가 느려짐.

정리하면, **스크롤 속도에 덜 영향** → `maxSpeed`·`PROGRESS_LERP` 낮추기, **원하는 위치에 오래 머물기** → 해당 씬 progress 구간 넓히기 또는 CameraRig에서 고정 구간 확대, **이동 속도 적당히** → `SMOOTH_POS`/`SMOOTH_LOOK`·`PROGRESS_LERP`·씬별 `time*` 계수로 조절하면 됨.

---

## 씬 전환 시 카메라가 향하는 각도(시선) 조절 — 한눈에 참고

씬이 바뀔 때 **보는 방향(lookAt)** 이 “확” 바뀌는 느낌을 줄이거나, 씬별로 시선을 바꾸고 싶을 때 수정할 위치만 정리한 섹션입니다.  
**수정 후 저장하면 바로 반영되므로, 값만 바꿔가며 테스트**하면 됩니다.

### 1. 공통: 시선이 목표로 따라가는 속도

| 파일 | 항목 | 역할 | 추천 범위 |
|------|------|------|-----------|
| `src/components/three/CameraRig.tsx` | **`SMOOTH_LOOK`** (상단 상수, 현재 0.06) | 매 프레임 `lookAt` 목표값으로 lerp되는 비율. **낮출수록** 씬 넘어갈 때 시선이 천천히 돌아서 “각도가 부드럽게” 바뀜. | 0.03 ~ 0.08 |

- **한 줄 요약**: 씬 경계에서 **각도가 확 바뀌는 속도**를 느리게 하려면 `SMOOTH_LOOK`을 **줄이면** 됩니다 (예: 0.06 → 0.04).

---

### 2. 씬별 “시선 목표(lookAt)”가 정해지는 위치

아래는 **모두 `CameraRig.tsx`의 `useFrame` 안 `switch (sceneId)`** 에서 설정됩니다.  
`lookAt.current.set(...)` 또는 `lookAtPath.getPointAt(...)` / `corridorPath.getPointAt(...)` 등이 **해당 씬에서 카메라가 바라보는 점**을 정합니다.

| 씬 ID | 시선(lookAt) 설정 위치 (파일:줄) | 어떻게 정해지는지 | 수정 시 포인트 |
|-------|----------------------------------|-------------------|-----------------|
| **void** | `CameraRig.tsx` 76행 | `lookAtPath.getPointAt(progress, lookAt.current)` | 전역 경로 사용 → **`lookAtPath`** 수정 |
| **hero** | `CameraRig.tsx` 81–92행 | `heroLocal < 0.4` → `lookAtPath.getPointAt(progress, …)`. `>= 0.4` → **고정** `lookAt.current.set(0, 0, -70)` | Hero 궤도일 때 **바라보는 z** = `-70`. 숫자만 바꾸면 시선 높이/깊이 변경 가능. |
| **corridor** | `CameraRig.tsx` 101–102행 | `corridorPath.getPointAt(Math.min(1, corridorLocal + 0.02), lookAt.current)` | **앞쪽 0.02**만큼 먼 점을 보게 함. `0.02`를 키우면 더 앞을 보며 진행, 줄이면 바로 앞만 봄. 경로 자체는 **`camera-path.ts`** `createCorridorTubePath()`. |
| **domains** | `CameraRig.tsx` 114행 | **고정** `lookAt.current.set(0, 0, -212)` | 도메인 갤러리 **중심 z**. x,y 바꾸면 시선이 옆/위아래로 이동. |
| **method** | `CameraRig.tsx` 122행 | **고정** `lookAt.current.set(0, 0, -280)` | 메서드 씬 **코어 z**. |
| **portfolio** | `CameraRig.tsx` 131행 | **고정** `lookAt.current.set(0, 0, -370)` | 포트폴리오 갤러리 **앞쪽 z**. |
| **projectRoom** | `CameraRig.tsx` 66, 136행 | `projectRoomRail.getPointAt(..., lookAt.current)` (슬라이드 기반) | 레일 경로가 시선도 결정. 경로: **`camera-path.ts`** `createProjectRoomRailPath()`. |
| **tech** | `CameraRig.tsx` 146행 | **고정** `lookAt.current.set(0, 0, -490)` | 테크 씬 중심 z. |
| **team** | `CameraRig.tsx` 156행 | **고정** `lookAt.current.set(0, 0, -560)` | 팀 씬 중심 z. |
| **contact** | `CameraRig.tsx` 162행 | `lookAtPath.getPointAt(progress, lookAt.current)` | 전역 경로 사용 → **`lookAtPath`** 수정. |

---

### 3. 경로 기반 시선(lookAtPath / corridorPath)을 바꾸고 싶을 때

- **void, hero 일부, projectRoom, contact** 에서 쓰는 **전역 lookAt 경로**  
  → **`src/lib/camera/lookAtPath.ts`**  
  → `createLookAtPath()` 안 **Vector3 배열**이 구간별 “바라보는 점”입니다.  
  - 각 인덱스가 progress 0~1 구간에 매핑되므로, **특정 구간의 시선 각도**를 바꾸려면 해당 번호의 `Vector3(x, y, z)` 값을 수정하면 됩니다.

- **corridor** 전용 시선(위치도 같이 사용)  
  → **`src/lib/camera-path.ts`**  
  → `createCorridorTubePath()` 의 **Vector3 배열**.  
  - `getPointAt(corridorLocal + 0.02, lookAt.current)` 로 “경로 상 조금 앞 점”을 보게 하므로, 이 경로 포인트들을 바꾸면 **튜브 안에서 카메라가 보는 방향**이 바뀝니다.

---

### 4. 씬 경계에서 “각도가 확 바뀌는” 느낌을 줄이는 방법 (요약)

1. **`CameraRig.tsx`에서 `SMOOTH_LOOK`** 을 **0.04~0.05** 정도로 낮춰서, 목표 lookAt이 바뀌어도 **실제 시선이 천천히 따라가게** 하기.  
2. **`scrollMapper.ts`의 `PROGRESS_LERP`** 를 조금 낮추면(예: 0.08~0.1) progress가 덜 확 바뀌어서, **씬 전환 자체가 완만**해지고 각도도 덜 “툭” 느껴질 수 있음.  
3. (고급) 씬 경계 구간에서 **이전 씬의 lookAt과 다음 씬의 lookAt을 progress에 따라 lerp** 하도록 CameraRig에 transition zone을 두면, 각도가 “확”이 아니라 “슬쩍” 바뀌게 할 수 있음.

위 표와 경로 파일만 보면서 **해당 씬의 lookAt 설정 부분**만 수정해 보시면 됩니다.
