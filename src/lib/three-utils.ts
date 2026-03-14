import * as THREE from "three";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVector3(
  a: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
  out: THREE.Vector3
): THREE.Vector3 {
  out.x = lerp(a.x, b.x, t);
  out.y = lerp(a.y, b.y, t);
  out.z = lerp(a.z, b.z, t);
  return out;
}

export const ZERO = new THREE.Vector3(0, 0, 0);
