"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./console";
import { gem } from "./store";

/**
 * The studio's crystal, in 3D: a cut gem that refracts a warm interior light
 * and splits it into colour at the facets. It turns with the page's scroll and
 * leans toward the pointer (both driven from Intro.tsx through `gem`).
 */

/**
 * A brilliant-style cut, culet to table: rings of [radius, height, twist]. A
 * ring twisted by half a step against its neighbour is joined in triangles
 * (star and girdle facets) rather than flat bands, which is where the sparkle
 * comes from.
 */
const RINGS: [number, number, number][] = [
  [0.0, -0.95, 0],
  [0.34, -0.66, 0.5],
  [0.72, -0.3, 0],
  [1.0, -0.04, 0.5],
  [1.0, 0.04, 0.5],
  [0.84, 0.2, 0],
  [0.58, 0.4, 0.5],
];
const FACETS = 16;

function gemGeometry() {
  const at = (ring: number, i: number) => {
    const [r, y, twist] = RINGS[ring];
    const a = ((i + twist) / FACETS) * Math.PI * 2;
    return new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
  };
  const centre = new THREE.Vector3(0, -0.2, 0);
  const positions: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    // wind every facet so its normal faces out of the (convex) stone
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const mid = a.clone().add(b).add(c).divideScalar(3).sub(centre);
    const [p, q] = n.dot(mid) < 0 ? [c, b] : [b, c];
    positions.push(a.x, a.y, a.z, p.x, p.y, p.z, q.x, q.y, q.z);
  };
  for (let ring = 0; ring < RINGS.length - 1; ring++) {
    const offset = RINGS[ring + 1][2] - RINGS[ring][2];
    for (let i = 0; i < FACETS; i++) {
      const a0 = at(ring, i);
      const a1 = at(ring, i + 1);
      const b0 = at(ring + 1, i);
      const b1 = at(ring + 1, i + 1);
      if (RINGS[ring][0] === 0) tri(a0, b0, b1);
      else if (offset !== 0) {
        // twisted rings: triangles pointing up, then down
        const twistUp = offset > 0;
        tri(a0, a1, twistUp ? b0 : b1);
        tri(twistUp ? b0 : a0, b1, twistUp ? a1 : b0);
      } else {
        tri(a0, a1, b1);
        tri(a0, b1, b0);
      }
    }
  }
  // the flat table on top
  const last = RINGS.length - 1;
  const table = new THREE.Vector3(0, RINGS[last][1], 0);
  for (let i = 0; i < FACETS; i++) tri(table, at(last, i), at(last, i + 1));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  // unshared vertices: one normal per facet, so each facet catches its own light
  geometry.computeVertexNormals();
  return geometry;
}

// Shading happens in the stone's own space, so its internal pattern turns with it.
const vertexShader = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalL;
  void main() {
    vLocal = position;
    vNormalL = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform samplerCube uEnv;
  uniform vec3 uCameraLocal;
  uniform mat3 uRotation;
  uniform float uIor;
  uniform float uSpread;
  uniform vec3 uTint;
  varying vec3 vLocal;
  varying vec3 vNormalL;

  const float TAU = 6.2831853;
  const float PAVILION = 16.0;

  // Light inside the stone reflects off one of the pavilion facets and heads back
  // up: snapping to the nearest facet is what gives a brilliant its kaleidoscope.
  vec3 bounce(vec3 ray) {
    vec2 d = ray.xz + vLocal.xz;
    float a = (floor(atan(d.y, d.x) / TAU * PAVILION) + 0.5) / PAVILION * TAU;
    return reflect(ray, normalize(vec3(cos(a) * 0.8, -1.0, sin(a) * 0.8)));
  }

  // look up the studio in world space
  vec3 look(vec3 dir) {
    return textureCube(uEnv, uRotation * dir).rgb;
  }

  void main() {
    vec3 n = normalize(vNormalL);
    vec3 v = normalize(vLocal - uCameraLocal);
    float cosi = clamp(dot(-v, n), 0.0, 1.0);
    // each colour bends by a slightly different amount: that split is a gem's fire
    vec3 fire = vec3(
      look(bounce(refract(v, n, 1.0 / (uIor - uSpread)))).r,
      look(bounce(refract(v, n, 1.0 / uIor))).g,
      look(bounce(refract(v, n, 1.0 / (uIor + uSpread)))).b
    );
    vec3 mirror = look(reflect(v, n));
    float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosi, 5.0);
    gl_FragColor = vec4(mix(fire * uTint, mirror, clamp(fresnel + 0.08, 0.0, 1.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Seeded, so the studio (and every facet's sparkle) is the same on every visit. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0;
    return ((s ^ (s >>> 13)) >>> 0) / 4294967296;
  };
}

/**
 * What the gem sees, lit the way jewellery is photographed: a dark slate room
 * with a thin warm horizon and bright softboxes scattered all around, mostly
 * above, so neighbouring facets flash between light and dark. Rendered once
 * into a cube map.
 */
function renderStudio(gl: THREE.WebGLRenderer, target: THREE.WebGLCubeRenderTarget) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#6a7486");
  const disposables: { dispose(): void }[] = [];
  const add = (geometry: THREE.BufferGeometry, color: THREE.Color, side: THREE.Side = THREE.DoubleSide) => {
    const material = new THREE.MeshBasicMaterial({ color, side });
    disposables.push(geometry, material);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(9, 9, 0.7, 64, 1, true), new THREE.Color("#e9b872").multiplyScalar(1.4), THREE.BackSide).position.y = 0.4;
  const overhead = add(new THREE.PlaneGeometry(7, 7), new THREE.Color("#fff8ee").multiplyScalar(3));
  overhead.position.set(0, 8, 0);
  overhead.lookAt(0, 0, 0);
  const r = random(7);
  for (let k = 0; k < 40; k++) {
    const y = Math.max(-0.4, 1 - r() * 1.4);
    const around = r() * Math.PI * 2;
    const flat = Math.sqrt(1 - y * y);
    const size = 1.2 + r() * 2.2;
    const color = new THREE.Color(k % 5 === 0 ? "#ffc27a" : "#fff6ea").multiplyScalar(3 + r() * 5);
    const box = add(new THREE.PlaneGeometry(size, size * (0.5 + r())), color);
    box.position.set(flat * Math.cos(around) * 8, y * 8, flat * Math.sin(around) * 8);
    box.lookAt(0, 0, 0);
  }
  new THREE.CubeCamera(0.1, 50, target).update(gl, scene);
  disposables.forEach((d) => d.dispose());
}

function Gem({ onReady }: { onReady?: () => void }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const mesh = useRef<THREE.Mesh>(null!);
  const shown = useRef(false);
  const [assets] = useState(() => {
    const target = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uEnv: { value: target.texture },
        uCameraLocal: { value: new THREE.Vector3() },
        uRotation: { value: new THREE.Matrix3() },
        uIor: { value: 2.2 },
        uSpread: { value: 0.12 },
        uTint: { value: new THREE.Color("#fff6ea") },
      },
      vertexShader,
      fragmentShader,
    });
    return { target, material, geometry: gemGeometry() };
  });

  useLayoutEffect(() => {
    renderStudio(gl, assets.target);
    invalidate();
  }, [gl, assets, invalidate]);

  useEffect(
    () => () => {
      assets.geometry.dispose();
      assets.material.dispose();
      assets.target.dispose();
    },
    [assets],
  );

  useEffect(() => {
    gem.invalidate = invalidate;
    return () => {
      gem.invalidate = undefined;
    };
  }, [invalidate]);

  useFrame(() => {
    const m = mesh.current;
    // spin about its own axis, then tip the table toward the viewer
    m.rotation.set(0.42 + gem.tiltX, gem.turn + gem.tiltY, 0);
    m.updateMatrixWorld();
    const { uCameraLocal, uRotation } = assets.material.uniforms;
    m.worldToLocal(uCameraLocal.value.copy(camera.position));
    uRotation.value.setFromMatrix4(m.matrixWorld);
    if (shown.current) return;
    shown.current = true;
    requestAnimationFrame(() => onReady?.());
  });

  return <mesh ref={mesh} geometry={assets.geometry} material={assets.material} />;
}

export default function Crystal({ onReady }: { onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ fov: 26, position: [0, 0, 5.4] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl }) => {
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
      }}
    >
      <Gem onReady={onReady} />
    </Canvas>
  );
}
