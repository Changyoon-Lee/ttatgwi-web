import * as THREE from "three";

export const SCENE_COUNT = 10;

/** Camera path: Void → Hero → Corridor → Domain → Method → Portfolio → ProjectRoom → Tech → Team → Contact */
export const PATH_NAMES = [
  "void_entrance",
  "hero_orbit",
  "glass_corridor",
  "domain_sculptures",
  "method_chamber",
  "portfolio_gallery",
  "project_room",
  "tech_core",
  "team_installation",
  "contact_space",
] as const;

export function getSceneProgress(sceneIndex: number): number {
  return sceneIndex / (SCENE_COUNT - 1);
}

export function createCameraPath(): THREE.CatmullRomCurve3 {
  const zStep = -70;
  const points = PATH_NAMES.map((_, i) => {
    const z = i === 0 ? 25 : 25 + i * zStep;
    const x = Math.sin(i * 0.25) * 12;
    const y = Math.cos(i * 0.2) * 6;
    return new THREE.Vector3(x, y, z);
  });
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

export function createLookAtPath(): THREE.CatmullRomCurve3 {
  const zStep = -70;
  const points = PATH_NAMES.map((_, i) => {
    const z = i === 0 ? 10 : 25 + i * zStep - 15;
    const x = Math.sin(i * 0.25) * 10;
    const y = Math.cos(i * 0.2) * 5;
    return new THREE.Vector3(x, y, z);
  });
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

/** Tube path for Glass Corridor (world space). Camera follows this when in corridor segment. */
const CORRIDOR_SCENE_Z = -140;
const CORRIDOR_LENGTH = 70;

export function createCorridorTubePath(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 0, CORRIDOR_SCENE_Z),
    new THREE.Vector3(0, 0, CORRIDOR_SCENE_Z - 20),
    new THREE.Vector3(0, 1, CORRIDOR_SCENE_Z - 40),
    new THREE.Vector3(0, 0, CORRIDOR_SCENE_Z - CORRIDOR_LENGTH),
  ];
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

export { CORRIDOR_SCENE_Z, CORRIDOR_LENGTH };

/** Rail path for Project Room: camera moves along this when a project is open. World space (baseZ = scene z). */
export const PROJECT_ROOM_SCENE_Z = -420;

export function createProjectRoomRailPath(baseZ: number): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 0.5, 6 + baseZ),
    new THREE.Vector3(6, 0.4, 4 + baseZ),
    new THREE.Vector3(12, 0.2, 2 + baseZ),
    new THREE.Vector3(18, 0.1, 0 + baseZ),
    new THREE.Vector3(24, 0.3, -2 + baseZ),
    new THREE.Vector3(30, 0.2, -4 + baseZ),
  ];
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}
