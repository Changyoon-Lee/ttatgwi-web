# Frame Drop 방지 개선 사항

최초 로딩·자동 전환 완료 이후, 스크롤 및 씬 전환 시 프레임 드랍이 발생하지 않도록 점검·개선할 수 있는 항목을 정리한 문서입니다.

---

## 1. WebGL / Three.js

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| **DPR 제한** | `dpr={[1, 2]}` 대신 `dpr={[1, Math.min(2, window.devicePixelRatio)]}` 또는 고정값으로 상한 두어 저사양에서 과도한 픽셀 수 방지. | 중 |
| **Geometry 재사용** | BlobMesh, ParticleMist 등에서 매 프레임 새 BufferGeometry 생성 금지. `useMemo`/ref로 한 번 생성 후 재사용. | 높음 |
| **Material 인스턴스** | 동일 머티리얼은 `MeshStandardMaterial` 등 인스턴스 공유로 draw call 감소. | 중 |
| **Dispose** | 씬 전환 시 보이지 않는 씬의 geometry/material/texture는 `dispose()` 호출해 VRAM 해제. | 중 |
| **Environment HDR** | `Environment` 파일 로드는 한 번만. 이미 로드된 경우 캐시 사용 확인. | 낮음 |

---

## 2. React Three Fiber (R3F)

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| **useFrame 부담** | 매 프레임 호출되는 훅 안에서 무거운 연산·새 객체 생성 지양. `currentProgressRef` 등 ref로 값만 갱신. | 높음 |
| **불필요한 리렌더** | `useStore(selector)`는 selector가 반환하는 값이 바뀔 때만 리렌더. 넓은 객체 대신 원시값 구독. | 높음 |
| **Suspense / 지연 로드** | 무거운 컴포넌트(예: DomainScene, PortfolioScene)는 `React.lazy` + Suspense로 뷰포트 근처에서만 로드 고려. | 중 |
| **인스턴싱** | 반복 메시(파티클, 갤러리 오브젝트)는 `InstancedMesh` 사용 검토. | 중 |

---

## 3. 스크롤·카메라

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| **easeProgress / PROGRESS_LERP** | `scrollMapper`의 lerp 값이 너무 작으면 스크롤 반응이 느리고, 너무 크면 덜컹거림. 0.08~0.12 유지. | 낮음 |
| **경로 샘플링** | `masterPath`, `corridorPath` 등 `getPointAt` 호출 횟수 최소화. 필요 시 샘플 캐시. | 낮음 |
| **scrollToProgressAnimated** | rAF 기반 애니메이션은 이미 구현됨. 스크롤 컨테이너 `scrollTop` 직접 설정만 하므로 레이아웃 스래싱 주의. | 낮음 |

---

## 4. 데이터·에셋

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| **preload 시점** | N+1 preload(PreloadTrigger) 유지. 다음 씬 진입 전에 에셋 로드 완료되도록 corridor 등에 실제 `useGLTF.preload` 추가 시 완료 콜백으로 `scene2Ready` 연동. | 중 |
| **이미지/비디오** | DOM 오버레이 이미지·비디오는 `loading="lazy"`, `decode` 또는 Intersection Observer로 뷰포트 진입 시 로드. | 중 |
| **JSON/번들** | `projects.json` 등은 이미 정적. 동적 데이터가 커지면 청크 분리 또는 API로 지연 로드 검토. | 낮음 |

---

## 5. 기타

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| **Context loss 대응** | `WebGLContextHandler`에서 context lost 시 `preventDefault`, restored 시 `invalidate` 이미 적용. 복구 후 에셋 재로드 필요 시 별도 플로우 문서화. | 낮음 |
| **개발 시 프로파일링** | Chrome Performance 탭으로 프레임별 Long Task, Layout/Paint 비용 확인. R3F `frameloop="demand"`는 스크롤 기반이면 사용하지 않는 것이 좋음. | 참고 |

---

## 체크리스트 (구현 후 점검)

- [ ] Void → Hero 자동 전환 시 프레임 드랍 없음
- [ ] 수동 스크롤로 씬 전환 시 (void, hero, corridor 등) FPS 안정
- [ ] BlobMesh·ParticleMist 등 무거운 오브젝트가 있는 구간에서도 목표 FPS 유지
- [ ] 탭 백그라운드 후 복귀 시 context 복구 및 한 프레임 이내 정상 렌더
-
이 문서는 로딩 플로우 정리(`loading-flow.md`)와 함께 유지하며, 측정 결과나 추가 이슈가 생기면 항목을 보완하는 것을 권장합니다.

---

## 6. Hero–Corridor 전환 이후 추가 개선 체크리스트

Hero → GlassCorridor 전환 구간에서의 frame drop을 줄이기 위해, 코드 구조 변경 외에 추후 적용할 수 있는 항목들입니다.

- [ ] **GlassCorridor 튜브 지오메트리 경량화** – `TubeGeometry`의 세그먼트 수(`TUBE_SEGMENTS`)와 radial 세그먼트(`TUBE_RADIAL`)를 줄여 폴리곤 수 감소.
- [ ] **토러스(링) 지오메트리 경량화** – `torusGeometry`의 radial 세그먼트와 튜브 세그먼트를 줄여 draw call·폴리곤 수 감소.
- [ ] **CorridorParticleFlow 개수 축소** – `PARTICLE_COUNT`를 단계적으로 낮추어(예: 800 → 400) 시각 품질과 성능 균형점 찾기.
- [ ] **MeshTransmissionMaterial 파라미터 완화** – `chromaticAberration`, `anisotropy` 등을 줄이거나 제거하고, 필요 시 `MeshPhysicalMaterial` + `transmission` 조합으로 대체 검토.
- [ ] **파티클 이동 로직 최적화** – 매 프레임 position 전체를 갱신하는 대신, 속도/오프셋을 attribute로 두고 셰이더에서 이동 처리하는 방식 검토.
