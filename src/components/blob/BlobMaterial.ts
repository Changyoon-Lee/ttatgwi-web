import * as THREE from "three";
import { blobVertexInject, blobVertexTransform } from "./BlobNoise";

export type BlobMaterialUniforms = {
  uTime: { value: number };
  uAmplitude: { value: number };
  uFrequency: { value: number };
  uSpeed: { value: number };
  uMouse: { value: THREE.Vector3 };
};

export function createBlobMaterial(
  envMap: THREE.Texture | null
): THREE.MeshPhysicalMaterial & { uniforms: BlobMaterialUniforms } {
  const uniforms: BlobMaterialUniforms = {
    uTime: { value: 0 },
    uAmplitude: { value: 0.12 },
    uFrequency: { value: 1.5 },
    uSpeed: { value: 0.4 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
  };

  const material = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 0.5,
    roughness: 0.1,
    metalness: 0,
    color: 0x7af0ff,
    ior: 1.4,
    anisotropy: 0.1,
    ...(envMap ? { envMap, envMapIntensity: 1 } : {}),
    transparent: true,
    opacity: 0.95,
  }) as THREE.MeshPhysicalMaterial & { uniforms: BlobMaterialUniforms };

  material.uniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmplitude = uniforms.uAmplitude;
    shader.uniforms.uFrequency = uniforms.uFrequency;
    shader.uniforms.uSpeed = uniforms.uSpeed;
    shader.uniforms.uMouse = uniforms.uMouse;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>\n${blobVertexInject}`
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      blobVertexTransform
    );
  };

  return material;
}
