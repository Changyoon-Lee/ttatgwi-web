import * as THREE from "three";

/** LookAt targets: where the camera looks at each stage (slightly ahead or scene center). */
const SCENE_Z = [0, -70, -140, -210, -280, -350, -420, -490, -560, -630];

export function createLookAtPath(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 0, 10),       // Entry: ahead
    new THREE.Vector3(0, 0, -20),      // Hero approach
    new THREE.Vector3(0, 0, -70),      // Hero: blob center
    new THREE.Vector3(0, 0, -160),     // Corridor: path ahead
    new THREE.Vector3(0, 0, -212),    // Domains: gallery center
    new THREE.Vector3(0, 0, -280),     // Method: core
    new THREE.Vector3(0, 0, -370),     // Portfolio: gallery
    new THREE.Vector3(0, 0, -420),     // Project room
    new THREE.Vector3(0, 0, -490),     // Tech: core
    new THREE.Vector3(0, 0, -560),     // Team: core
    new THREE.Vector3(0, 0, -630),     // Contact: resolve
  ];
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}
