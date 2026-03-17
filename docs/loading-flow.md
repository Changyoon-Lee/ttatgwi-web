# 최초 로딩 흐름 (의도 반영 후)

## 1. 페이지 마운트 ~ 캔버스 마운트

| 순서 | 동작 | 담당 |
|------|------|------|
| 1 | 페이지 마운트. `canvasReady=false`, `sceneReady=false` | `page.tsx` |
| 2 | 로딩 스피너 표시 (`showLoader = !sceneReady`) | `page.tsx` |
| 3 | 2 rAF 후 `canvasReady = true` | `page.tsx` useEffect |
| 4 | `<MainCanvas />` 렌더 → `dynamic()`이 청크 로드 후 MainCanvas 마운트 | Next dynamic |
| 5 | Canvas, ScrollControls, SceneContent 마운트 | MainCanvas |

## 2. scene1 로딩 완료 ~ 화면 표시 + 스크롤 유도

| 순서 | 동작 | 담당 |
|------|------|------|
| 6 | `globalProgress=0` → currentSceneId = "void", visibleIndices = [0,1] (void, hero) | MainCanvas, store |
| 7 | VoidEntranceScene + HeroScene 렌더 | SceneContent |
| 8 | 첫 프레임 그려짐 → SceneReadySignal이 `setSceneReady(true)` → **scene1 로딩 완료** | SceneReadySignal |
| 9 | `sceneReady=true` → 로딩 스피너 제거, **화면만 보여줌 (자동 스크롤 안 함)** | page.tsx |
| 10 | ScrollIndicatorUI가 보이는 상태(progress < 0.12 또는 스크롤 느림) → **스크롤해야 한다는 효과** | ScrollIndicatorUI |

## 3. scene2 로딩 여부에 따른 분기

| 조건 | 동작 |
|------|------|
| **scene2 아직 안 됨** | 사용자가 스크롤할 때까지 스크롤 유도(인디케이터)만 보여줌. |
| **scene2까지 로딩됨** | Void 다음 **두 씬(hero, corridor)** `preloadSceneAssets(callback)` 완료 시 `scene2Ready=true`. 이때 **사용자가 아직 거의 스크롤 안 했으면** (`globalProgress < 0.05`) **1.5초 대기 후 1초 동안** HeroScene 도달 → `scrollToProgressAnimated(0.12, 1000)`. |

## 4. 정리

- **scene1 준비** = `sceneReady` (첫 프레임 렌더 완료, void+hero 표시).
- **scene2 준비** = hero → corridor 순으로 `preloadSceneAssets(callback)` 완료 시 `scene2Ready` (현재는 동기 preload라 곧 true; 나중에 corridor에 실제 에셋 로드 넣으면 그때 완료 시점 반영).
- **스크롤 유도**: scene1 로딩 완료 후 로딩 UI만 숨기고, ScrollIndicatorUI로 스크롤하라는 효과 제공.
- **자동 재생**: scene2(hero+corridor)까지 준비됐고 사용자가 아직 스크롤하지 않았을 때만(progress &lt; 0.05) 1.5초 대기 후 1초 동안 자동 스크롤로 메인(히어로) 구간까지 진행.
- **ScrollIndicatorUI**: Void 구간(progress &lt; 0.12) 또는 **스크롤 속도가 느릴 때**(씬 중간) 페이지 레이어에 표시.
