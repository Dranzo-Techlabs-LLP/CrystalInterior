"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import "./console";
import { reveal, withReveal } from "./reveal";
import { room } from "./store";
import { createTextures, labelTexture, prepareTextures } from "./textures";

/** Paint the room's surfaces ahead of time (called once the code has been fetched). */
export const prepare = () => prepareTextures("room");

/*
 * A living room that builds itself as you scroll: a plan is sketched, walls and
 * joinery rise, furniture is set down in white clay, a sweep of the logo's
 * yellow turns the clay into ebonised oak, marble, linen, brass and saffron
 * velvet, day turns to evening as the lamps come on, and finally the room is
 * styled. The scene is a pure function of scroll progress (`room.p`), so it
 * plays backwards as well as forwards.
 */

/* ---------------------------------------------------------------- timing --- */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Progress through the scroll window [a, b], from 0 to 1. */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const out = (t: number) => 1 - (1 - t) ** 3;
const inOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
/** Ease out with a small overshoot, for objects being set in place. */
const settle = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** When each light comes on (and day turns to evening). */
function lighting(p: number) {
  return {
    night: inOut(seg(p, 0.62, 0.76)),
    cove: out(seg(p, 0.66, 0.705)),
    jaali: out(seg(p, 0.68, 0.725)),
    pendant: out(seg(p, 0.7, 0.745)),
    lamp: out(seg(p, 0.72, 0.765)),
  };
}

/* ------------------------------------------------------------ dimensions --- */

/** Metres. The back wall runs along x, the left wall along z; the room opens to the front and right. */
const H = 2.8; // wall height
const T = 0.14; // wall thickness
const BACK = -2.25; // inner face of the back wall
const LEFT = -3.0; // inner face of the left wall
const RIGHT = 3.0; // open end of the back wall
const FRONT = 2.25; // open end of the left wall
const WIN = { x0: -2.2, x1: -0.4, y0: 0.3, y1: 2.5 };

const SOFA = { x: -2.4, z: 0 };
const TABLE = { x: -1.15, z: 0 };
const CHAIR = { x: 0.3, z: -0.85, rot: -2.78 };
const LAMP = { x: -2.45, z: 1.66 };
const PLANT = { x: -2.55, z: -1.8 };
const JAALI = { x: 1.6, y: 1.05, w: 1.4, h: 1.3 };
const SIDEBOARD = { x: 1.6, w: 2.2, d: 0.45, top: 0.675 };

/* ------------------------------------------------------------------ kit --- */

function createKit() {
  const tex = createTextures();
  const std = (params: THREE.MeshStandardMaterialParameters) => withReveal(new THREE.MeshStandardMaterial(params));
  const geometries = new Map<string, THREE.BufferGeometry>();
  const shape = <G extends THREE.BufferGeometry>(key: string, make: () => G) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key) as G;
  };

  const materials = {
    plinth: new THREE.MeshStandardMaterial({ color: "#f3eee6", roughness: 0.92 }),
    groundShadow: new THREE.MeshBasicMaterial({
      color: "#0b0b0c",
      alphaMap: tex.glow,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
    line: new THREE.MeshBasicMaterial({ color: "#0b0b0c", transparent: true }),
    plaster: std({ map: tex.plaster, roughness: 0.95 }),
    cap: std({ color: "#0b0b0c", roughness: 0.6 }),
    floor: std({ map: tex.floor, roughness: 0.5 }),
    /** ebonised oak: the walnut grain stained almost black (the slats echo the logo's bars) */
    ebony: std({ color: "#3a3531", map: tex.walnut, roughness: 0.42 }),
    ebonyDeep: std({ color: "#2a2623", map: tex.walnut, roughness: 0.5 }),
    lacquer: std({ color: "#121213", roughness: 0.3 }),
    marquina: std({ map: tex.marbleDark, roughness: 0.16 }),
    calacatta: std({ map: tex.marbleLight, roughness: 0.2 }),
    linen: std({ color: "#f6f1e8", map: tex.linen, roughness: 0.95 }),
    rug: std({ map: tex.rug, roughness: 1 }),
    brass: std({ color: "#d4ad66", metalness: 1, roughness: 0.28 }),
    brassInside: std({ color: "#d4ad66", metalness: 1, roughness: 0.28, side: THREE.DoubleSide }),
    steel: std({ color: "#18181a", metalness: 0.7, roughness: 0.4 }),
    /** the brand's saffron, as velvet */
    velvet: std({ color: "#f2b705", roughness: 0.78 }),
    velvetBlack: std({ color: "#1b1b1d", roughness: 0.75 }),
    glaze: std({ color: "#141416", roughness: 0.18, side: THREE.DoubleSide }),
    pot: std({ color: "#cdbca2", map: tex.slab, roughness: 0.85 }),
    soil: std({ color: "#3b2c21", roughness: 1 }),
    leaf: std({ color: "#76835a", roughness: 0.75, flatShading: true }),
    leafDeep: std({ color: "#58653f", roughness: 0.75, flatShading: true }),
    paper: std({ color: "#efe7da", roughness: 0.9 }),
    bookYellow: std({ color: "#ffcb04", roughness: 0.8 }),
    bookBlack: std({ color: "#1a1a1c", roughness: 0.8 }),
    art: std({ map: tex.art, roughness: 0.92 }),
    jaali: std({ color: "#4a4440", map: tex.walnut, alphaMap: tex.lattice, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 }),
    niche: std({ color: "#efe6d8", emissive: "#ffc27c", emissiveIntensity: 0, roughness: 0.9 }),
    shade: std({
      color: "#f4ece0",
      map: tex.linen,
      emissive: "#ffcf93",
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
      roughness: 0.95,
    }),
    bulb: std({ color: "#efe6d8", emissive: "#ffd49a", emissiveIntensity: 0, side: THREE.BackSide, roughness: 0.9 }),
    cove: std({ color: "#efe6d8", emissive: "#ffdcaa", emissiveIntensity: 0, roughness: 0.9 }),
    sky: skyMaterial(),
  };

  return {
    tex,
    ...materials,
    shape,
    box: (w: number, h: number, d: number, r = 0.015) =>
      shape(`box:${w}:${h}:${d}:${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01))),
    cyl: (top: number, bottom: number, h: number, segments = 40, open = false) =>
      shape(`cyl:${top}:${bottom}:${h}:${segments}:${open}`, () => new THREE.CylinderGeometry(top, bottom, h, segments, 1, open)),
    plane: shape("plane", () => new THREE.PlaneGeometry(1, 1)),
    unit: shape("unit", () => new THREE.BoxGeometry(1, 1, 1)),
    dispose() {
      geometries.forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      Object.values(tex).forEach((t) => t.dispose());
    },
  };
}

type Kit = ReturnType<typeof createKit>;
const KitContext = createContext<Kit | null>(null);
const useKit = () => useContext(KitContext)!;

/** The view through the window: a pale sky by day, dusk blue with a warm horizon by evening. */
function skyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uNight: { value: 0 },
      uDayTop: { value: new THREE.Color("#c9d9e2") },
      uDayLow: { value: new THREE.Color("#f7eddf") },
      uNightTop: { value: new THREE.Color("#121a2a") },
      uNightLow: { value: new THREE.Color("#353750") },
      uDusk: { value: new THREE.Color("#e9a867") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform vec3 uDayTop, uDayLow, uNightTop, uNightLow, uDusk;
      varying vec2 vUv;
      void main() {
        vec3 top = mix(uDayTop, uNightTop, uNight);
        vec3 low = mix(uDayLow, uNightLow, uNight);
        vec3 col = mix(low, top, smoothstep(0.05, 0.95, vUv.y));
        col += uDusk * uNight * 0.4 * (1.0 - smoothstep(0.0, 0.3, vUv.y));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/* ------------------------------------------------------------- helpers --- */

type Vec3 = [number, number, number];

function Solid({ geo, mat, at, rot, cast = true }: { geo: THREE.BufferGeometry; mat: THREE.Material; at: Vec3; rot?: Vec3; cast?: boolean }) {
  return <mesh geometry={geo} material={mat} position={at} rotation={rot} castShadow={cast} receiveShadow />;
}

/** Rise from the floor (scale in y from the group's origin). */
function grow(o: THREE.Object3D, t: number) {
  o.visible = t > 0;
  o.scale.y = Math.max(t, 1e-4);
}

/** Lowered into place from above, turning slightly as it lands. */
function useDrop(ref: RefObject<THREE.Group | null>, from: number, to: number, lift = 1.3, spin = 0.35) {
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = seg(room.p, from, to);
    const e = out(t);
    g.visible = t > 0;
    g.position.y = (1 - e) * lift;
    g.rotation.y = (1 - e) * spin;
  });
}

/** Set down with a small settle, for the styling at the end. */
function usePlace(ref: RefObject<THREE.Group | null>, from: number, to: number, drop = 0.25) {
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = seg(room.p, from, to);
    g.visible = t > 0;
    g.scale.setScalar(Math.max(0.55 + 0.45 * settle(t), 1e-4));
    g.position.y = (1 - out(t)) * drop;
  });
}

/** A soft contact shadow on the floor, darkening as its object arrives. */
function Blob({ x, z, w, d, rot = 0, from, to, strength = 0.42 }: { x: number; z: number; w: number; d: number; rot?: number; from: number; to: number; strength?: number }) {
  const k = useKit();
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0b0b0c",
        alphaMap: k.tex.glow,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    [k],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    material.opacity = strength * out(seg(room.p, from, to));
  });
  return (
    <mesh geometry={k.plane} material={material} position={[x, 0.034, z]} rotation={[-Math.PI / 2, 0, rot]} scale={[w, d, 1]} renderOrder={1} />
  );
}

/* ---------------------------------------------------------------- camera --- */

const DEG = Math.PI / 180;
/** Radius of the model around the camera target, used to fit it to any screen shape. */
const RADIUS = 4.6;
/** The camera's path: plan view → axonometric → a low, close view of the finished room. */
const SHOTS: { p: number; v: [number, number, number, number, number, number] }[] = [
  // az°, el°, distance (× fitted), target x, y, z
  { p: 0.0, v: [8, 74, 1.02, 0.0, 0.0, 0.2] },
  { p: 0.16, v: [16, 64, 1.0, -0.1, 0.2, 0.1] },
  { p: 0.3, v: [30, 42, 1.0, -0.3, 0.6, -0.15] },
  { p: 0.45, v: [38, 34, 0.96, -0.4, 0.8, -0.3] },
  { p: 0.62, v: [42, 29, 0.93, -0.4, 0.9, -0.35] },
  { p: 0.8, v: [46, 24, 0.92, -0.4, 0.95, -0.35] },
  { p: 1.0, v: [48, 20, 0.9, -0.35, 0.9, -0.3] },
];

function catmull(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
}

function shotAt(p: number, target: Float64Array) {
  let i = 0;
  while (i < SHOTS.length - 2 && p > SHOTS[i + 1].p) i++;
  const a = SHOTS[Math.max(0, i - 1)].v;
  const b = SHOTS[i].v;
  const c = SHOTS[i + 1].v;
  const d = SHOTS[Math.min(SHOTS.length - 1, i + 2)].v;
  const t = clamp01((p - SHOTS[i].p) / (SHOTS[i + 1].p - SHOTS[i].p));
  for (let j = 0; j < 6; j++) target[j] = catmull(a[j], b[j], c[j], d[j], t);
}

function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const shift = useRef({ x: 0, y: 0 });
  const shot = useMemo(() => new Float64Array(6), []);

  // Framing comes from CSS (--room-shift-x/y), where the page layout lives.
  useLayoutEffect(() => {
    const css = getComputedStyle(gl.domElement);
    shift.current.x = parseFloat(css.getPropertyValue("--room-shift-x")) || 0;
    shift.current.y = parseFloat(css.getPropertyValue("--room-shift-y")) || 0;
    camera.fov = size.width < size.height ? 40 : 30;
    camera.setViewOffset(
      size.width,
      size.height,
      -shift.current.x * size.width,
      shift.current.y * size.height,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
  }, [camera, gl, size]);

  useFrame(() => {
    shotAt(room.p, shot);
    const [az, el, dist, tx, ty, tz] = shot;
    const aspect = (size.width / size.height) * (1 - 2 * Math.abs(shift.current.x));
    const vfov = camera.fov * DEG;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const d = (RADIUS / Math.sin(Math.min(vfov, hfov) / 2)) * dist;
    camera.position.set(
      tx + d * Math.cos(el * DEG) * Math.sin(az * DEG),
      ty + d * Math.sin(el * DEG),
      tz + d * Math.cos(el * DEG) * Math.cos(az * DEG),
    );
    camera.lookAt(tx, ty, tz);
  });
  return null;
}

/* ---------------------------------------------------------------- lights --- */

const COLORS = {
  sunDay: new THREE.Color("#fff1dc"),
  sunSet: new THREE.Color("#ffc58a"),
  skyDay: new THREE.Color("#fff6ea"),
  skyNight: new THREE.Color("#7d8db0"),
  groundDay: new THREE.Color("#d6c5ab"),
  groundNight: new THREE.Color("#3a3029"),
};

function Lights() {
  const k = useKit();
  const scene = useThree((s) => s.scene);
  const small = useThree((s) => s.size.width < 700);
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const fill = useRef<THREE.DirectionalLight>(null!);
  const pendant = useRef<THREE.PointLight>(null!);
  const lamp = useRef<THREE.PointLight>(null!);
  const niche = useRef<THREE.PointLight>(null!);

  useFrame(() => {
    const l = lighting(room.p);
    sun.current.intensity = 3.2 * (1 - l.night);
    sun.current.color.lerpColors(COLORS.sunDay, COLORS.sunSet, l.night);
    hemi.current.intensity = lerp(1.05, 0.22, l.night);
    hemi.current.color.lerpColors(COLORS.skyDay, COLORS.skyNight, l.night);
    hemi.current.groundColor.lerpColors(COLORS.groundDay, COLORS.groundNight, l.night);
    fill.current.intensity = lerp(0.35, 0.06, l.night);
    scene.environmentIntensity = lerp(0.5, 0.14, l.night);
    k.sky.uniforms.uNight.value = l.night;
    k.cove.emissiveIntensity = 2.4 * l.cove;
    niche.current.intensity = 2.2 * l.jaali;
    k.niche.emissiveIntensity = 2.4 * l.jaali;
    pendant.current.intensity = 5 * l.pendant;
    k.bulb.emissiveIntensity = 2.6 * l.pendant;
    lamp.current.intensity = 4 * l.lamp;
    k.shade.emissiveIntensity = 1.2 * l.lamp;
  });

  const map = small ? 1024 : 2048;
  return (
    <>
      <hemisphereLight ref={hemi} />
      {/* the sun, low behind the back wall, so daylight falls through the window */}
      <directionalLight
        ref={sun}
        position={[-3.6, 5.2, -7.4]}
        castShadow
        shadow-mapSize={[map, map]}
        shadow-radius={4}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.5, 25]} />
      </directionalLight>
      <directionalLight ref={fill} position={[7, 5, 8]} />
      <pointLight ref={pendant} position={[TABLE.x, 1.8, TABLE.z]} decay={2} color="#ffc58a" intensity={0} />
      <pointLight ref={lamp} position={[LAMP.x, 1.46, LAMP.z]} decay={2} color="#ffcf94" intensity={0} />
      {/* the jaali niche spills warm light onto the sideboard and the floor */}
      <pointLight ref={niche} position={[JAALI.x, JAALI.y + JAALI.h / 2, BACK + 0.45]} decay={2} color="#ffc98a" intensity={0} />
      <CoveWash />
      <Glows />
    </>
  );
}

/**
 * The cove light washing down the walls in the evening: a soft additive glow
 * just in front of each wall. (Real area lights looked the same but made every
 * surface's shader far heavier to compile and to draw, so the room was slow to
 * appear and to scroll on phones.)
 */
function CoveWash() {
  const k = useKit();
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffd6a0",
        alphaMap: k.tex.wash,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [k],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    material.opacity = 0.5 * lighting(room.p).cove;
  });
  const drop = 1.7;
  const y = H - 0.03 - drop / 2;
  return (
    <>
      {/* the back wall, either side of the window */}
      <mesh geometry={k.plane} material={material} position={[(LEFT + WIN.x0) / 2, y, BACK + 0.008]} scale={[WIN.x0 - LEFT, drop, 1]} />
      <mesh geometry={k.plane} material={material} position={[(WIN.x1 + RIGHT) / 2, y, BACK + 0.008]} scale={[RIGHT - WIN.x1, drop, 1]} />
      {/* the left wall, glowing between the slats */}
      <mesh
        geometry={k.plane}
        material={material}
        position={[LEFT + 0.008, y, (BACK + FRONT) / 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[FRONT - BACK, drop, 1]}
      />
    </>
  );
}

/** Soft halos around the lamps, so the evening reads as light and not just colour. */
function Glows() {
  const k = useKit();
  const materials = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.SpriteMaterial({
            map: k.tex.glow,
            color: "#ffc27a",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [k],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useFrame(() => {
    const l = lighting(room.p);
    materials[0].opacity = 0.55 * l.pendant;
    materials[1].opacity = 0.5 * l.lamp;
    materials[2].opacity = 0.35 * l.jaali;
  });
  return (
    <>
      <sprite material={materials[0]} position={[TABLE.x, 1.78, TABLE.z]} scale={[1.2, 1.2, 1]} />
      <sprite material={materials[1]} position={[LAMP.x, 1.5, LAMP.z]} scale={[1.1, 1.1, 1]} />
      <sprite material={materials[2]} position={[JAALI.x, JAALI.y + JAALI.h / 2, BACK + 0.2]} scale={[2.4, 2, 1]} />
    </>
  );
}

/* ------------------------------------------------------ plinth + floor --- */

function Base() {
  const k = useKit();
  return (
    <>
      {/* the model's plinth, and its soft shadow on the page */}
      <mesh geometry={k.box(7.0, 0.3, 5.75, 0.03)} material={k.plinth} position={[0.05, -0.15, 0.175]} receiveShadow />
      <mesh geometry={k.plane} material={k.groundShadow} position={[0.1, -0.31, 0.3]} rotation={[-Math.PI / 2, 0, 0]} scale={[10.5, 8.6, 1]} />
      <mesh geometry={k.box(RIGHT - LEFT, 0.02, FRONT - BACK, 0.004)} material={k.floor} position={[0, 0.01, 0]} receiveShadow />
    </>
  );
}

/* ---------------------------------------------------------------- sketch --- */

type Line = { a: [number, number]; b: [number, number]; w: number; t0: number; t1: number };
type Seg = [number, number, number, number];

const rect = (x0: number, z0: number, x1: number, z1: number): Seg[] => [
  [x0, z0, x1, z0],
  [x1, z0, x1, z1],
  [x1, z1, x0, z1],
  [x0, z1, x0, z0],
];

const circle = (cx: number, cz: number, r: number, n: number): Seg[] =>
  Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    return [cx + r * Math.cos(a0), cz + r * Math.sin(a0), cx + r * Math.cos(a1), cz + r * Math.sin(a1)];
  });

/** A rectangle footprint turned by `angle` around its centre (matching an object's y rotation). */
function turnedRect(cx: number, cz: number, hw: number, hd: number, angle: number): Seg[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const corner = (x: number, z: number): [number, number] => [cx + x * c + z * s, cz - x * s + z * c];
  const pts = [corner(-hw, -hd), corner(hw, -hd), corner(hw, hd), corner(-hw, hd)];
  return pts.map((p, i) => [...p, ...pts[(i + 1) % 4]] as Seg);
}

/** Walls first, then the furniture, then the dimensions, each line drawn in turn. */
function planLines() {
  const lines: Line[] = [];
  const draw = (segs: Seg[], w: number, from: number, to: number) => {
    const total = segs.reduce((sum, [x0, z0, x1, z1]) => sum + Math.hypot(x1 - x0, z1 - z0), 0);
    let done = 0;
    for (const [x0, z0, x1, z1] of segs) {
      const t0 = from + ((to - from) * done) / total;
      done += Math.hypot(x1 - x0, z1 - z0);
      const t1 = from + ((to - from) * done) / total;
      lines.push({ a: [x0, z0], b: [x1, z1], w, t0, t1: Math.max(t1, t0 + 0.004) });
    }
  };
  draw(
    [
      [LEFT - T, BACK - T, RIGHT, BACK - T],
      [RIGHT, BACK - T, RIGHT, BACK],
      [RIGHT, BACK, WIN.x1, BACK],
      [WIN.x1, BACK, WIN.x1, BACK - T],
      [WIN.x0, BACK - T, WIN.x0, BACK],
      [WIN.x0, BACK, LEFT, BACK],
      [LEFT, BACK, LEFT, FRONT],
      [LEFT, FRONT, LEFT - T, FRONT],
      [LEFT - T, FRONT, LEFT - T, BACK - T],
    ],
    0.035,
    0.02,
    0.09,
  );
  draw([[WIN.x0, BACK - T / 2, WIN.x1, BACK - T / 2]], 0.012, 0.09, 0.1);
  draw(
    [
      ...rect(SOFA.x - 0.475, -1.25, SOFA.x + 0.475, 1.25),
      [SOFA.x - 0.23, -1.04, SOFA.x - 0.23, 1.04],
      ...circle(TABLE.x, TABLE.z, 0.58, 28),
      ...rect(-2.1, -1.6, 0.9, 1.6),
      [SIDEBOARD.x - SIDEBOARD.w / 2, BACK, SIDEBOARD.x - SIDEBOARD.w / 2, BACK + SIDEBOARD.d],
      [SIDEBOARD.x - SIDEBOARD.w / 2, BACK + SIDEBOARD.d, SIDEBOARD.x + SIDEBOARD.w / 2, BACK + SIDEBOARD.d],
      [SIDEBOARD.x + SIDEBOARD.w / 2, BACK + SIDEBOARD.d, SIDEBOARD.x + SIDEBOARD.w / 2, BACK],
      ...turnedRect(CHAIR.x, CHAIR.z, 0.4, 0.42, CHAIR.rot),
      ...circle(PLANT.x, PLANT.z, 0.22, 16),
      ...circle(LAMP.x, LAMP.z, 0.17, 12),
    ],
    0.018,
    0.08,
    0.16,
  );
  draw(
    [
      [LEFT - T, 2.72, RIGHT, 2.72],
      [LEFT - T, 2.62, LEFT - T, 2.82],
      [RIGHT, 2.62, RIGHT, 2.82],
      [3.3, BACK - T, 3.3, FRONT],
      [3.2, BACK - T, 3.4, BACK - T],
      [3.2, FRONT, 3.4, FRONT],
    ],
    0.012,
    0.15,
    0.19,
  );
  return lines;
}

function Sketch() {
  const k = useKit();
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const lines = useMemo(() => planLines(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const labels = useMemo(() => {
    const make = (text: string) =>
      new THREE.MeshBasicMaterial({ map: labelTexture(text), transparent: true, opacity: 0, depthWrite: false });
    return [make("6.00 m"), make("4.50 m")];
  }, []);
  useEffect(
    () => () =>
      labels.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      }),
    [labels],
  );

  useFrame(() => {
    const p = room.p;
    const fade = 1 - seg(p, 0.36, 0.44);
    k.line.opacity = fade;
    labels.forEach((m) => (m.opacity = fade * seg(p, 0.17, 0.2)));
    const m = mesh.current;
    m.visible = fade > 0 && p > 0.005;
    if (!m.visible) return;
    lines.forEach((line, i) => {
      const t = out(seg(p, line.t0, line.t1));
      const dx = line.b[0] - line.a[0];
      const dz = line.b[1] - line.a[1];
      dummy.position.set(line.a[0] + (dx * t) / 2, 0.024, line.a[1] + (dz * t) / 2);
      dummy.rotation.set(0, -Math.atan2(dz, dx), 0);
      // a line not yet started takes no space at all (not even a dot)
      if (t > 0) dummy.scale.set(Math.hypot(dx, dz) * t, 0.003, line.w);
      else dummy.scale.setScalar(1e-5);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[k.unit, k.line, lines.length]} frustumCulled={false} />
      <mesh geometry={k.plane} material={labels[0]} position={[-0.07, 0.026, 2.9]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.9, 0.225, 1]} />
      <group position={[3.44, 0.026, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={k.plane} material={labels[1]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.9, 0.225, 1]} />
      </group>
    </>
  );
}

/* ----------------------------------------------------------------- walls --- */

function Walls() {
  const k = useKit();
  const back = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  useFrame(() => {
    grow(back.current, inOut(seg(room.p, 0.2, 0.29)));
    grow(left.current, inOut(seg(room.p, 0.215, 0.305)));
  });
  const bz = BACK - T / 2;
  const winW = WIN.x1 - WIN.x0;
  const winX = (WIN.x0 + WIN.x1) / 2;
  return (
    <>
      <group ref={back}>
        <Solid geo={k.box(WIN.x0 - (LEFT - T), H, T, 0.006)} mat={k.plaster} at={[(LEFT - T + WIN.x0) / 2, H / 2, bz]} />
        <Solid geo={k.box(RIGHT - WIN.x1, H, T, 0.006)} mat={k.plaster} at={[(RIGHT + WIN.x1) / 2, H / 2, bz]} />
        <Solid geo={k.box(winW, WIN.y0, T, 0.006)} mat={k.plaster} at={[winX, WIN.y0 / 2, bz]} />
        <Solid geo={k.box(winW, H - WIN.y1, T, 0.006)} mat={k.plaster} at={[winX, (H + WIN.y1) / 2, bz]} />
        <Solid geo={k.box(RIGHT - (LEFT - T), 0.012, T, 0.004)} mat={k.cap} at={[(RIGHT + LEFT - T) / 2, H + 0.006, bz]} />
        <mesh geometry={k.box(RIGHT - LEFT, 0.025, 0.035, 0.008)} material={k.cove} position={[(RIGHT + LEFT) / 2, H - 0.07, BACK + 0.02]} />
        <Window />
      </group>
      <group ref={left}>
        <Solid geo={k.box(T, H, FRONT - BACK, 0.006)} mat={k.plaster} at={[LEFT - T / 2, H / 2, (FRONT + BACK) / 2]} />
        <Solid geo={k.box(T, 0.012, FRONT - BACK, 0.004)} mat={k.cap} at={[LEFT - T / 2, H + 0.006, (FRONT + BACK) / 2]} />
        <mesh geometry={k.box(0.035, 0.025, FRONT - BACK, 0.008)} material={k.cove} position={[LEFT + 0.02, H - 0.07, (FRONT + BACK) / 2]} />
      </group>
    </>
  );
}

function Window() {
  const k = useKit();
  const z = BACK - T / 2;
  const w = WIN.x1 - WIN.x0;
  const h = WIN.y1 - WIN.y0;
  const cx = (WIN.x0 + WIN.x1) / 2;
  const cy = (WIN.y0 + WIN.y1) / 2;
  const bar = 0.05;
  return (
    <>
      <mesh geometry={k.plane} material={k.sky} position={[cx, cy, z - 0.02]} scale={[w, h, 1]} />
      <Solid geo={k.box(bar, h, 0.07, 0.01)} mat={k.steel} at={[WIN.x0 + bar / 2, cy, z]} />
      <Solid geo={k.box(bar, h, 0.07, 0.01)} mat={k.steel} at={[WIN.x1 - bar / 2, cy, z]} />
      <Solid geo={k.box(w, bar, 0.07, 0.01)} mat={k.steel} at={[cx, WIN.y1 - bar / 2, z]} />
      <Solid geo={k.box(w, bar, 0.07, 0.01)} mat={k.steel} at={[cx, WIN.y0 + bar / 2, z]} />
      <Solid geo={k.box(0.035, h, 0.055, 0.008)} mat={k.steel} at={[cx, cy, z]} />
      <Solid geo={k.box(w, 0.035, 0.055, 0.008)} mat={k.steel} at={[cx, 2.02, z]} />
    </>
  );
}

/* --------------------------------------------------------------- joinery --- */

/** Walnut slats behind the sofa, fitted one after another. */
function Slats() {
  const k = useKit();
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = 27;
  const height = 2.62;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = mesh.current;
    const p = room.p;
    m.visible = p > 0.27;
    if (!m.visible) return;
    for (let i = 0; i < count; i++) {
      const t = out(seg(p, 0.27 + i * 0.0026, 0.3 + i * 0.0026));
      const h = Math.max(height * t, 1e-4);
      dummy.position.set(LEFT + 0.03, h / 2, -1.43 + i * 0.11);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[k.box(0.045, 1, 0.075, 0.012), k.ebony, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

/** A carved jaali screen in front of a niche that glows in the evening. */
function Jaali() {
  const k = useKit();
  const g = useRef<THREE.Group>(null!);
  useFrame(() => grow(g.current, out(seg(room.p, 0.3, 0.355))));
  const { x, w, h } = JAALI;
  return (
    <group ref={g} position={[0, JAALI.y, 0]}>
      <mesh geometry={k.plane} material={k.niche} position={[x, h / 2, BACK + 0.004]} scale={[w, h, 1]} />
      <mesh geometry={k.plane} material={k.jaali} position={[x, h / 2, BACK + 0.06]} scale={[w - 0.04, h - 0.04, 1]} castShadow />
      <Solid geo={k.box(w + 0.1, 0.05, 0.09, 0.01)} mat={k.brass} at={[x, h + 0.025, BACK + 0.045]} />
      <Solid geo={k.box(w + 0.1, 0.05, 0.09, 0.01)} mat={k.brass} at={[x, -0.025, BACK + 0.045]} />
      <Solid geo={k.box(0.05, h, 0.09, 0.01)} mat={k.brass} at={[x - w / 2 - 0.025, h / 2, BACK + 0.045]} />
      <Solid geo={k.box(0.05, h, 0.09, 0.01)} mat={k.brass} at={[x + w / 2 + 0.025, h / 2, BACK + 0.045]} />
    </group>
  );
}

/** A built-in sideboard in black lacquer with a Calacatta top, sliding out of the wall. */
function Sideboard() {
  const k = useKit();
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const t = out(seg(room.p, 0.29, 0.345));
    g.current.visible = t > 0;
    g.current.position.z = (1 - t) * -0.5;
  });
  const { x, w, d } = SIDEBOARD;
  const z = BACK + d / 2;
  return (
    <group ref={g}>
      <Solid geo={k.box(w - 0.1, 0.08, d - 0.05, 0.01)} mat={k.ebonyDeep} at={[x, 0.04, z - 0.01]} />
      <Solid geo={k.box(w, 0.56, d, 0.02)} mat={k.lacquer} at={[x, 0.36, z]} />
      <Solid geo={k.box(w + 0.04, 0.035, d + 0.02, 0.01)} mat={k.calacatta} at={[x, 0.6575, z + 0.005]} />
      {[-0.55, 0, 0.55].map((dx) => (
        <mesh key={dx} geometry={k.box(0.006, 0.5, 0.006, 0.002)} material={k.brass} position={[x + dx, 0.36, z + d / 2 + 0.001]} />
      ))}
      {[-0.825, -0.275, 0.275, 0.825].map((dx) => (
        <mesh key={dx} geometry={k.box(0.12, 0.012, 0.02, 0.005)} material={k.brass} position={[x + dx, 0.585, z + d / 2 + 0.01]} castShadow />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------- furniture --- */

/** The rug unrolls from beside the sofa. */
function Rug() {
  const k = useKit();
  const flat = useRef<THREE.Mesh>(null!);
  const roll = useRef<THREE.Mesh>(null!);
  const x0 = -2.1;
  const length = 3.0;
  const depth = 3.2;
  const thick = 0.012;
  useFrame(() => {
    const t = inOut(seg(room.p, 0.3, 0.345));
    const laid = Math.max(length * t, 1e-4);
    flat.current.visible = t > 0;
    flat.current.scale.x = laid / length;
    flat.current.position.x = x0 + laid / 2;
    const r = Math.sqrt(((length - laid) * thick) / Math.PI) + thick;
    roll.current.visible = t > 0 && t < 1;
    roll.current.position.set(x0 + laid + r * 0.3, 0.02 + r, 0);
    roll.current.scale.set(r, 1, r);
  });
  return (
    <>
      <mesh ref={flat} geometry={k.box(length, thick, depth, 0.004)} material={k.rug} position={[0, 0.02 + thick / 2, 0]} receiveShadow />
      <mesh ref={roll} geometry={k.cyl(1, 1, depth, 32)} material={k.rug} rotation={[Math.PI / 2, 0, 0]} castShadow />
    </>
  );
}

function Sofa() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  useDrop(g, 0.31, 0.36);
  return (
    <group position={[SOFA.x, 0, SOFA.z]}>
      <group ref={g}>
        <Solid geo={k.box(0.8, 0.1, 2.3, 0.02)} mat={k.ebonyDeep} at={[0.03, 0.05, 0]} />
        <Solid geo={k.box(0.95, 0.26, 2.5, 0.06)} mat={k.linen} at={[0, 0.23, 0]} />
        {[-0.7, 0, 0.7].map((z) => (
          <Solid key={`seat${z}`} geo={k.box(0.7, 0.14, 0.68, 0.06)} mat={k.linen} at={[0.1, 0.43, z]} />
        ))}
        {[-0.7, 0, 0.7].map((z) => (
          <Solid key={`back${z}`} geo={k.box(0.24, 0.46, 0.68, 0.08)} mat={k.linen} at={[-0.33, 0.6, z]} rot={[0, 0, 0.12]} />
        ))}
        {[-1.15, 1.15].map((z) => (
          <Solid key={`arm${z}`} geo={k.box(0.95, 0.4, 0.2, 0.07)} mat={k.linen} at={[0, 0.36, z]} />
        ))}
      </group>
    </group>
  );
}

function CoffeeTable() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  useDrop(g, 0.33, 0.37, 1.1);
  return (
    <group position={[TABLE.x, 0, TABLE.z]}>
      <group ref={g}>
        <Solid geo={k.cyl(0.34, 0.37, 0.3, 48)} mat={k.brass} at={[0, 0.15, 0]} />
        <Solid geo={k.cyl(0.58, 0.58, 0.045, 64)} mat={k.marquina} at={[0, 0.3225, 0]} />
      </group>
    </group>
  );
}

/** A lounge chair in ebonised oak and saffron velvet, facing the sofa across the table. */
function Armchair() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  useDrop(g, 0.34, 0.38);
  return (
    <group position={[CHAIR.x, 0, CHAIR.z]} rotation={[0, CHAIR.rot, 0]}>
      <group ref={g}>
        {[-0.39, 0.39].map((z) => (
          <Solid key={z} geo={k.box(0.8, 0.52, 0.05, 0.02)} mat={k.ebony} at={[0, 0.26, z]} />
        ))}
        <Solid geo={k.box(0.7, 0.13, 0.73, 0.05)} mat={k.velvet} at={[0.04, 0.33, 0]} />
        <Solid geo={k.box(0.15, 0.55, 0.73, 0.06)} mat={k.velvet} at={[-0.3, 0.62, 0]} rot={[0, 0, 0.22]} />
        <Solid geo={k.box(0.05, 0.05, 0.78, 0.015)} mat={k.ebony} at={[-0.36, 0.12, 0]} />
      </group>
    </group>
  );
}

function FloorLamp() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  useDrop(g, 0.36, 0.39, 1.0, 0);
  return (
    <group position={[LAMP.x, 0, LAMP.z]}>
      <group ref={g}>
        <Solid geo={k.cyl(0.16, 0.17, 0.025, 48)} mat={k.brass} at={[0, 0.0125, 0]} />
        <Solid geo={k.cyl(0.011, 0.011, 1.38, 12)} mat={k.brass} at={[0, 0.715, 0]} />
        <Solid geo={k.cyl(0.2, 0.24, 0.3, 48, true)} mat={k.shade} at={[0, 1.5, 0]} />
      </group>
    </group>
  );
}

/** A brass dome pendant, lowered over the coffee table. */
function Pendant() {
  const k = useKit();
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const t = seg(room.p, 0.37, 0.41);
    g.current.visible = t > 0;
    g.current.position.y = (1 - out(t)) * 1.2;
  });
  const dome = k.shape("dome", () => new THREE.SphereGeometry(0.27, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2));
  return (
    <group position={[TABLE.x, 0, TABLE.z]}>
      <group ref={g}>
        <mesh geometry={k.cyl(0.005, 0.005, 1.5, 8)} material={k.steel} position={[0, 2.17 + 0.75, 0]} />
        <mesh geometry={dome} material={k.brass} position={[0, 1.9, 0]} castShadow />
        <mesh geometry={dome} material={k.bulb} position={[0, 1.9, 0]} scale={0.97} />
      </group>
    </group>
  );
}

/* --------------------------------------------------------------- styling --- */

/** A framed canvas hung on the slatted wall above the sofa. */
function Art() {
  const k = useKit();
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const t = seg(room.p, 0.8, 0.84);
    g.current.visible = t > 0;
    g.current.position.y = (1 - out(t)) * 0.3;
  });
  return (
    <group ref={g}>
      <Solid geo={k.box(0.035, 0.98, 1.34, 0.01)} mat={k.brass} at={[LEFT + 0.1, 1.72, SOFA.z]} />
      <mesh geometry={k.plane} material={k.art} position={[LEFT + 0.12, 1.72, SOFA.z]} rotation={[0, Math.PI / 2, 0]} scale={[1.26, 0.9, 1]} />
    </group>
  );
}

const LEAVES: [number, number, number, number][] = [
  [0.0, 1.55, 0.0, 0.34],
  [0.2, 1.35, 0.12, 0.26],
  [-0.18, 1.4, -0.1, 0.28],
  [0.1, 1.8, -0.08, 0.26],
  [-0.12, 1.75, 0.14, 0.22],
  [0.24, 1.62, -0.16, 0.2],
  [-0.25, 1.2, 0.1, 0.2],
  [0.02, 1.15, -0.22, 0.18],
];

/** An olive tree in a stone pot, by the window. It grows in. */
function Plant() {
  const k = useKit();
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const t = seg(room.p, 0.82, 0.87);
    const e = out(t);
    g.current.visible = t > 0;
    g.current.scale.set(0.6 + 0.4 * e, Math.max(0.3 + 0.7 * settle(t), 1e-4), 0.6 + 0.4 * e);
  });
  const leaf = k.shape("leaf", () => new THREE.IcosahedronGeometry(1, 1));
  return (
    <group position={[PLANT.x, 0, PLANT.z]}>
      <group ref={g}>
        <Solid geo={k.cyl(0.21, 0.17, 0.44, 40)} mat={k.pot} at={[0, 0.22, 0]} />
        <mesh geometry={k.cyl(0.19, 0.19, 0.02, 32)} material={k.soil} position={[0, 0.43, 0]} />
        <Solid geo={k.cyl(0.018, 0.028, 0.9, 10)} mat={k.ebonyDeep} at={[0.02, 0.88, 0]} rot={[0.05, 0, -0.06]} />
        {LEAVES.map(([x, y, z, r], i) => (
          <mesh
            key={i}
            geometry={leaf}
            material={i % 2 ? k.leafDeep : k.leaf}
            position={[x, y, z]}
            scale={[r, r * 0.8, r]}
            rotation={[i, i * 0.7, 0]}
            castShadow
            receiveShadow
          />
        ))}
      </group>
    </group>
  );
}

function Cushions() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  usePlace(g, 0.83, 0.87);
  return (
    <group position={[SOFA.x, 0, SOFA.z]}>
      <group ref={g}>
        <Solid geo={k.box(0.14, 0.42, 0.42, 0.07)} mat={k.velvet} at={[-0.2, 0.72, -0.72]} rot={[0.12, 0.3, 0.3]} />
        <Solid geo={k.box(0.14, 0.4, 0.4, 0.07)} mat={k.velvetBlack} at={[-0.2, 0.71, 0.74]} rot={[-0.1, -0.25, 0.26]} />
      </group>
    </group>
  );
}

const BOWL = [
  [0.0, 0.0],
  [0.09, 0.0],
  [0.13, 0.03],
  [0.15, 0.075],
].map(([x, y]) => new THREE.Vector2(x, y));

const VASE = [
  [0.0, 0.0],
  [0.07, 0.0],
  [0.1, 0.05],
  [0.11, 0.14],
  [0.085, 0.24],
  [0.045, 0.29],
  [0.04, 0.33],
  [0.047, 0.345],
].map(([x, y]) => new THREE.Vector2(x, y));

/** Books and a brass bowl on the coffee table. */
function TableStyling() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  usePlace(g, 0.85, 0.89);
  const bowl = k.shape("bowl", () => new THREE.LatheGeometry(BOWL, 40));
  return (
    <group position={[TABLE.x, 0.345, TABLE.z]}>
      <group ref={g}>
        <Solid geo={k.box(0.28, 0.035, 0.21, 0.005)} mat={k.paper} at={[0.14, 0.0175, 0.14]} rot={[0, 0.3, 0]} />
        <Solid geo={k.box(0.24, 0.03, 0.18, 0.005)} mat={k.bookYellow} at={[0.15, 0.05, 0.13]} rot={[0, 0.5, 0]} />
        <mesh geometry={bowl} material={k.brassInside} position={[-0.2, 0, -0.14]} castShadow />
      </group>
    </group>
  );
}

/** A black glazed vase with dried branches, books and a brass sphere on the sideboard. */
function SideboardStyling() {
  const k = useKit();
  const g = useRef<THREE.Group>(null);
  usePlace(g, 0.86, 0.9);
  const vase = k.shape("vase", () => new THREE.LatheGeometry(VASE, 32));
  const z = BACK + SIDEBOARD.d / 2;
  return (
    <group position={[0, SIDEBOARD.top, 0]}>
      <group ref={g}>
        <mesh geometry={vase} material={k.glaze} position={[SIDEBOARD.x - 0.7, 0, z]} scale={1.4} castShadow />
        {[
          [0.25, 0.1],
          [-0.3, 0.6],
          [0.05, -0.5],
        ].map(([tiltX, tiltZ], i) => (
          <mesh
            key={i}
            geometry={k.cyl(0.004, 0.007, 0.75, 6)}
            material={k.ebonyDeep}
            position={[SIDEBOARD.x - 0.7 + tiltZ * 0.2, 0.75, z + tiltX * 0.15]}
            rotation={[tiltX * 0.5, 0, -tiltZ * 0.5]}
            castShadow
          />
        ))}
        <Solid geo={k.box(0.3, 0.04, 0.22, 0.005)} mat={k.paper} at={[SIDEBOARD.x + 0.55, 0.02, z]} />
        <Solid geo={k.box(0.26, 0.035, 0.2, 0.005)} mat={k.bookBlack} at={[SIDEBOARD.x + 0.55, 0.0575, z]} rot={[0, 0.2, 0]} />
        <mesh geometry={k.shape("sphere", () => new THREE.SphereGeometry(0.075, 32, 16))} material={k.brass} position={[SIDEBOARD.x + 0.55, 0.15, z]} castShadow />
      </group>
    </group>
  );
}

/* ----------------------------------------------------------------- stage --- */

function Furnishing() {
  return (
    <>
      <Rug />
      <Sofa />
      <CoffeeTable />
      <Armchair />
      <FloorLamp />
      <Pendant />
      <Blob x={SOFA.x} z={SOFA.z} w={1.5} d={3.0} from={0.31} to={0.36} strength={0.45} />
      <Blob x={TABLE.x} z={TABLE.z} w={1.6} d={1.6} from={0.33} to={0.37} />
      <Blob x={CHAIR.x} z={CHAIR.z} w={1.3} d={1.3} rot={CHAIR.rot} from={0.34} to={0.38} />
      <Blob x={SIDEBOARD.x} z={BACK + 0.25} w={2.8} d={0.9} from={0.29} to={0.345} strength={0.36} />
      <Blob x={LAMP.x} z={LAMP.z} w={0.55} d={0.55} from={0.36} to={0.39} strength={0.35} />
      <Blob x={PLANT.x} z={PLANT.z} w={0.8} d={0.8} from={0.82} to={0.87} strength={0.45} />
    </>
  );
}

function Styling() {
  return (
    <>
      <Art />
      <Plant />
      <Cushions />
      <TableStyling />
      <SideboardStyling />
    </>
  );
}

/** The sweep of materials, from 0.44 to 0.58 of the scroll. */
function Sweep() {
  useFrame(() => {
    reveal.uReveal.value = lerp(-0.02, 1.12, inOut(seg(room.p, 0.44, 0.58)));
  });
  return null;
}

function Stage({ onReady }: { onReady?: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const [kit] = useState(createKit);
  const root = useRef<THREE.Group>(null!);
  const shown = useRef(false);

  useEffect(() => () => kit.dispose(), [kit]);

  useEffect(() => {
    room.invalidate = invalidate;
    return () => {
      room.invalidate = undefined;
    };
  }, [invalidate]);

  // Soft reflections from a procedural studio room: nothing to download.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const studio = new RoomEnvironment();
    const env = pmrem.fromScene(studio, 0.04).texture;
    studio.dispose();
    scene.environment = env;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  // Upload every texture and compile every shader before the first visible frame
  // (the room mounts well ahead of the section), so scrolling in never stutters.
  useEffect(() => {
    let live = true;
    Object.values(kit.tex).forEach((t) => gl.initTexture(t));
    gl.compileAsync(scene, camera).then(() => {
      if (!live) return;
      root.current.visible = true;
      invalidate();
    });
    return () => {
      live = false;
    };
  }, [gl, scene, camera, invalidate, kit]);

  useFrame(() => {
    if (shown.current || !root.current.visible) return;
    shown.current = true;
    requestAnimationFrame(() => onReady?.());
  });

  return (
    <KitContext.Provider value={kit}>
      <Lights />
      <CameraRig />
      <Sweep />
      <group ref={root} visible={false}>
        <Base />
        <Sketch />
        <Walls />
        <Slats />
        <Jaali />
        <Sideboard />
        <Furnishing />
        <Styling />
      </group>
    </KitContext.Provider>
  );
}

export default function Room({ onReady }: { onReady?: () => void }): ReactNode {
  // phones draw at a slightly lower pixel density, which keeps scrolling smooth
  const [dpr] = useState(() => (window.innerWidth < 760 ? 1.25 : 1.5));
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, dpr]}
      frameloop="demand"
      camera={{ fov: 30, near: 0.5, far: 100, position: [8, 14, 12] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
      }}
      onCreated={({ gl }) => {
        // shader diagnostics are for development; three recommends skipping them in production
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
      }}
    >
      <Stage onReady={onReady} />
    </Canvas>
  );
}
