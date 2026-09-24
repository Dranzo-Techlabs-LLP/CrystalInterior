import * as THREE from "three";

/**
 * The "honest materials" moment: every surface starts as white clay, like an
 * architect's model, and a line of the logo's yellow sweeps across the room
 * turning it into oak, marble, linen, brass and velvet. One shared uniform
 * drives every material.
 */
export const reveal = {
  /** Sweep front: 0 = all clay, ~1.12 = every surface finished. */
  uReveal: { value: 0 },
  uClay: { value: new THREE.Color("#ece6dc") },
  uEdge: { value: new THREE.Color("#ffcb04") },
};

const SWEEP = /* glsl */ `
  uniform float uReveal;
  uniform vec3 uClay;
  uniform vec3 uEdge;
  varying vec3 vRevealPos;
  // 0 at the room's back-left corner, 1 at its open front-right corner
  float sweepCoord() {
    return clamp((vRevealPos.x + vRevealPos.z + 5.6) / 11.8, 0.0, 1.0);
  }
  float revealAmount() {
    return 1.0 - smoothstep(uReveal - 0.1, uReveal, sweepCoord());
  }
  // a fine line of yellow light riding just behind the sweep front
  float revealEdge() {
    float s = sweepCoord();
    float band = smoothstep(uReveal - 0.06, uReveal - 0.035, s) * (1.0 - smoothstep(uReveal - 0.035, uReveal - 0.01, s));
    return band * step(0.001, uReveal) * step(uReveal, 1.1);
  }
`;

/** Patch a standard material so it starts as clay and takes its real finish as the sweep passes. */
export function withReveal<T extends THREE.MeshStandardMaterial>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = reveal.uReveal;
    shader.uniforms.uClay = reveal.uClay;
    shader.uniforms.uEdge = reveal.uEdge;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRevealPos;")
      .replace(
        "#include <project_vertex>",
        /* glsl */ `#include <project_vertex>
        vec4 revealPos = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          revealPos = instanceMatrix * revealPos;
        #endif
        vRevealPos = (modelMatrix * revealPos).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${SWEEP}`)
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
        float revealed = revealAmount();
        diffuseColor.rgb = mix(uClay, diffuseColor.rgb, revealed);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.9, roughnessFactor, revealed);",
      )
      .replace(
        "#include <metalnessmap_fragment>",
        "#include <metalnessmap_fragment>\nmetalnessFactor = mix(0.0, metalnessFactor, revealed);",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uEdge * revealEdge() * 0.9;",
      );
  };
  material.customProgramCacheKey = () => "reveal";
  return material;
}
