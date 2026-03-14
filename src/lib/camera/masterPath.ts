import * as THREE from "three";

/** World Z positions for each scene (group position). Align with MainCanvas SCENE_Z. */
const SCENE_Z = [0, -70, -140, -210, -280, -350, -420, -490, -560, -630];

/**
 * Single master path: continuous journey through all scenes.
 * 11 points so progress 0 = entry, 1 = contact.
 * Camera stays near center line (x≈0, y≈0.5~1) for additive local motion.
 */
export function createMasterPath(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 0.5, 25),      // Entry drift
    new THREE.Vector3(0, 0.5, 0),       // Hero approach
    new THREE.Vector3(0, 0.5, -70),     // Hero orbit base
    new THREE.Vector3(0, 0.5, -140),    // Corridor entry
    new THREE.Vector3(0, 1, -210),      // Domains
    new THREE.Vector3(0, 1, -280),     // Method
    new THREE.Vector3(0, 1, -350),     // Portfolio
    new THREE.Vector3(0, 1, -420),     // Project room zone
    new THREE.Vector3(0, 1, -490),     // Tech
    new THREE.Vector3(0, 1, -560),     // Team
    new THREE.Vector3(0, 1, -630),     // Contact
  ];
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

export { SCENE_Z };
