"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { materials as palette } from "@/data/home";
import "./console";
import { board, landing } from "./store";
import { createBoardTextures, prepareTextures } from "./textures";

/** Paint the samples' surfaces ahead of time (called once the code has been fetched). */
export const prepare = () => prepareTextures("board");

/*
 * The palette, as a designer lays it out: material samples float in the dark,
 * turning slowly, then settle one after another into a moodboard on the
 * studio table while a pool of light comes up under them. Like the room, the
 * scene is a pure function of scroll progress (`board.p`), so it plays
 * backwards too; the only thing time adds is a gentle float while in the air.
 */

/* ---------------------------------------------------------------- timing --- */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const out = (t: number) => 1 - (1 - t) ** 3;
const inOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------- geometry --- */

/** Every shape sits on y = 0, so a pose's y is simply what it rests on. */
function slab(w: number, h: number, d: number, r = 0.012) {
  const g = new RoundedBoxGeometry(w, h, d, 3, r);
  g.translate(0, h / 2, 0);
  return g;
}

function disc(radius: number, h: number) {
  const g = new THREE.CylinderGeometry(radius, radius, h, 72);
  g.translate(0, h / 2, 0);
  return g;
}

/** A marble arch, lying flat with its curve away from the viewer. */
function arch(w: number, h: number, depth: number) {
  const r = w / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-r, -h / 2);
  shape.lineTo(r, -h / 2);
  shape.lineTo(r, h / 2 - r);
  shape.absarc(0, h / 2 - r, r, 0, Math.PI, false);
  shape.lineTo(-r, -h / 2);
  const bevel = 0.008;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 48,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  // a planar projection from above, so the (non-repeating) marble maps once across the face
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, -pos.getZ(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** mergeGeometries needs every part indexed the same way (RoundedBoxGeometry is already non-indexed). */
const unindexed = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);

/** A fluted walnut panel: half-round reeds on a thin backing board. */
function flutes(w: number, d: number, count: number) {
  const radius = w / count / 2;
  const back = unindexed(new RoundedBoxGeometry(w, 0.03, d, 2, 0.006));
  back.translate(0, 0.015, 0);
  const reeds: THREE.BufferGeometry[] = [back];
  for (let i = 0; i < count; i++) {
    const reed = unindexed(new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, d, 20, 1, false, Math.PI / 2, Math.PI));
    reed.rotateX(Math.PI / 2);
    reed.translate(-w / 2 + radius + i * radius * 2, 0.03, 0);
    reeds.push(reed);
  }
  const merged = mergeGeometries(reeds)!;
  reeds.forEach((g) => g.dispose());
  return merged;
}

/** An upholstery sample: a superellipsoid, square in plan and domed like a cushion. */
function cushion(w: number, h: number, d: number) {
  const g = new THREE.SphereGeometry(1, 72, 36);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const r = 7;
  const t = 2.4;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const flat = (Math.abs(v.x) ** r + Math.abs(v.z) ** r) ** (t / r);
    const s = (flat + Math.abs(v.y) ** t) ** (-1 / t);
    pos.setXYZ(i, v.x * s * (w / 2), v.y * s * (h / 2) + h / 2, v.z * s * (d / 2));
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------- samples --- */

type Pose = [x: number, y: number, z: number, rx: number, ry: number, rz: number];
type Poses = { air: Pose; rest: Pose };
type Sample = { key: string; geometry: THREE.BufferGeometry; material: THREE.Material; wide: Poses; tall: Poses };

/**
 * Where every sample floats (`air`, facing the viewer) and where it rests on
 * the table (`rest`, lying flat). Keys match `materials.items`, whose order
 * is the landing order. A wide screen gets a wide board; a phone held upright
 * gets `tall`, the same samples in two columns, so they stay large.
 */
const LAYOUT: Record<string, Poses & { tall: Pose }> = {
  marquina: { air: [-2.35, 1.8, -0.7, 1.15, 0.45, 0.28], rest: [-1.45, 0, -0.62, 0, 0.06, 0], tall: [-0.66, 0, -1.02, 0, Math.PI / 2 + 0.04, 0] },
  calacatta: { air: [-0.15, 2.2, -1.05, 1.3, -0.5, -0.18], rest: [0.15, 0, -0.64, 0, -0.05, 0], tall: [0.66, 0, -1.18, 0, -0.04, 0] },
  walnut: { air: [2.25, 1.65, -0.45, 0.95, 0.8, 0.5], rest: [1.58, 0, -0.56, 0, 0.1, 0], tall: [0.66, 0, 0.04, 0, 0.06, 0] },
  terrazzo: { air: [-2.75, 0.62, 0.55, 1.4, 0.2, -0.6], rest: [-2.02, 0, 0.72, 0, 0, 0], tall: [-0.68, 0, 0.32, 0, 0, 0] },
  linen: { air: [-1.25, 0.3, 1.05, 0.6, -0.3, 0.75], rest: [-1.05, 0, 0.64, 0, -0.12, 0], tall: [-0.62, 0, 1.32, 0, -0.1, 0] },
  velvet: { air: [-0.55, 1.25, 0.45, 0.5, 0.7, -0.4], rest: [-0.78, 0.008, 0.8, 0, 0.35, 0], tall: [-0.5, 0.008, 1.44, 0, 0.32, 0] },
  travertine: { air: [1.05, 0.42, 0.95, 1.0, -0.8, 0.3], rest: [0.32, 0, 0.74, 0, 0.07, 0], tall: [0.62, 0, 0.98, 0, 0.06, 0] },
  brass: { air: [0.85, 1.55, 0.6, 1.5, 0.2, 0.4], rest: [0.46, 0.06, 0.68, 0, 0, 0], tall: [0.72, 0.06, 0.95, 0, 0, 0] },
  cane: { air: [2.65, 0.52, 0.7, 1.2, -0.4, -0.7], rest: [1.48, 0, 0.7, 0, 0.28, 0], tall: [0.56, 0, 1.8, 0, 0.22, 0] },
};

/** On a tall screen the floating cloud is drawn in narrower and higher. */
const narrow = ([x, y, z, rx, ry, rz]: Pose): Pose => [x * 0.42, 0.25 + y * 0.95, z * 0.55, rx, ry, rz];

function createSamples() {
  const tex = createBoardTextures();
  const shapes: Record<string, THREE.BufferGeometry> = {
    marquina: slab(1.7, 0.06, 1.1),
    calacatta: arch(0.95, 1.35, 0.05),
    walnut: flutes(1.05, 0.9, 11),
    terrazzo: disc(0.46, 0.05),
    linen: slab(0.72, 0.008, 0.95, 0.003),
    velvet: cushion(0.82, 0.17, 0.82),
    travertine: slab(0.9, 0.06, 0.55),
    brass: disc(0.3, 0.03),
    cane: slab(0.72, 0.012, 0.72, 0.004),
  };
  const finishes: Record<string, THREE.Material> = {
    marquina: new THREE.MeshPhysicalMaterial({ map: tex.marbleDark, roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.12 }),
    calacatta: new THREE.MeshPhysicalMaterial({ map: tex.marbleLight, roughness: 0.24, clearcoat: 0.5, clearcoatRoughness: 0.14 }),
    walnut: new THREE.MeshStandardMaterial({ map: tex.walnut, roughness: 0.55 }),
    terrazzo: new THREE.MeshStandardMaterial({ map: tex.terrazzo, roughness: 0.4 }),
    linen: new THREE.MeshStandardMaterial({ map: tex.linen, color: "#f4eee3", roughness: 1 }),
    velvet: new THREE.MeshPhysicalMaterial({
      color: "#f0b400",
      roughness: 0.82,
      sheen: 1,
      sheenColor: new THREE.Color("#ffe9a0"),
      sheenRoughness: 0.38,
    }),
    travertine: new THREE.MeshStandardMaterial({ map: tex.travertine, roughness: 0.62 }),
    // brushed brass: mostly metal, with a little diffuse so the spot light warms it even where the studio reflection is dark
    brass: new THREE.MeshStandardMaterial({ color: "#f0c56e", metalness: 0.82, roughness: 0.34, envMapIntensity: 2.6 }),
    cane: new THREE.MeshStandardMaterial({
      map: tex.cane,
      alphaMap: tex.caneHoles,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.7,
    }),
  };
  const samples: Sample[] = palette.items.map((item) => {
    const { air, rest, tall } = LAYOUT[item.key];
    return {
      key: item.key,
      geometry: shapes[item.key],
      material: finishes[item.key],
      wide: { air, rest },
      tall: { air: narrow(air), rest: tall },
    };
  });
  const table = new THREE.MeshStandardMaterial({
    color: "#22365d",
    roughness: 0.9,
    alphaMap: tex.glow,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  return {
    samples,
    table,
    tex,
    dispose() {
      Object.values(shapes).forEach((g) => g.dispose());
      Object.values(finishes).forEach((m) => m.dispose());
      Object.values(tex).forEach((t) => t.dispose());
      table.dispose();
    },
  };
}

type Kit = ReturnType<typeof createSamples>;

/* ---------------------------------------------------------------- motion --- */

const qAir = new THREE.Quaternion();
const qRest = new THREE.Quaternion();
const euler = new THREE.Euler();

function Piece({ sample, index }: { sample: Sample; index: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const tall = useThree((s) => s.size.width < s.size.height);
  const { from, to } = landing(index);
  useFrame(({ clock }) => {
    const p = board.p;
    const t = seg(p, from, to);
    const e = inOut(t);
    const aloft = 1 - e;
    const poses = tall ? sample.tall : sample.wide;
    const [ax, ay, az, arx, ary, arz] = poses.air;
    const [rx, ry, rz, , rry] = poses.rest;
    const time = clock.elapsedTime;
    // in the air: turning slowly with the scroll, bobbing a little with time
    const bob = Math.sin(time * 0.9 + index * 1.7) * 0.06 * aloft;
    const m = mesh.current;
    m.position.set(
      lerp(ax, rx, e),
      lerp(ay, ry, e) + Math.sin(Math.PI * e) * 0.35 + bob,
      lerp(az, rz, e),
    );
    euler.set(arx + Math.sin(time * 0.5 + index) * 0.08 * aloft, ary + p * 1.4, arz);
    qAir.setFromEuler(euler);
    euler.set(0, rry, 0);
    qRest.setFromEuler(euler);
    m.quaternion.slerpQuaternions(qAir, qRest, e);
  });
  return <mesh ref={mesh} geometry={sample.geometry} material={sample.material} castShadow receiveShadow />;
}

/** The table: a dark surface that fades in under a pool of light as the samples come down. */
function Table({ kit }: { kit: Kit }) {
  const spot = useRef<THREE.SpotLight>(null!);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const target = spot.current.target;
    target.position.set(0, 0, 0.1);
    scene.add(target);
    return () => {
      scene.remove(target);
    };
  }, [scene]);
  useFrame(() => {
    const up = out(seg(board.p, 0.14, 0.6));
    kit.table.opacity = up;
    spot.current.intensity = lerp(1.6, 3.6, up);
  });
  const small = useThree((s) => s.size.width < 700);
  const map = small ? 1024 : 2048;
  return (
    <>
      <mesh material={kit.table} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.1]} receiveShadow>
        <planeGeometry args={[11, 8]} />
      </mesh>
      <spotLight
        ref={spot}
        position={[-2.2, 7, 3.2]}
        angle={0.62}
        penumbra={0.85}
        decay={0}
        color="#fff4e2"
        castShadow
        shadow-mapSize={[map, map]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={5}
      />
    </>
  );
}

/* ---------------------------------------------------------------- camera --- */

const DEG = Math.PI / 180;
type Shot = { p: number; v: [number, number, number, number, number, number] };
/**
 * The camera, from facing the floating samples to looking down on the
 * finished board: az°, el°, distance (× fitted), target x, y, z. `fit` is the
 * half-width and half-height of the board the view must hold.
 */
const FRAMING: Record<"wide" | "tall", { fit: [number, number]; shots: Shot[] }> = {
  wide: {
    fit: [2.9, 2.0],
    shots: [
      { p: 0.0, v: [-8, 6, 1.02, 0.0, 1.15, 0.0] },
      { p: 0.14, v: [-5, 11, 1.0, 0.0, 1.0, 0.0] },
      { p: 0.38, v: [2, 28, 0.96, 0.0, 0.55, 0.05] },
      { p: 0.62, v: [9, 48, 0.9, 0.05, 0.12, 0.12] },
      { p: 0.82, v: [13, 57, 0.86, 0.05, 0.0, 0.12] },
      { p: 1.0, v: [15, 60, 0.84, 0.05, 0.0, 0.12] },
    ],
  },
  tall: {
    fit: [1.4, 2.1],
    shots: [
      { p: 0.0, v: [-6, 6, 1.12, 0.0, 1.3, 0.0] },
      { p: 0.14, v: [-4, 12, 1.08, 0.0, 1.15, 0.05] },
      { p: 0.38, v: [2, 30, 1.02, 0.0, 0.6, 0.15] },
      { p: 0.62, v: [5, 50, 1.05, 0.0, 0.1, 0.22] },
      { p: 0.82, v: [7, 58, 1.07, 0.0, 0.0, 0.2] },
      { p: 1.0, v: [8, 62, 1.08, 0.0, 0.0, 0.2] },
    ],
  },
};

function catmull(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
}

function shotAt(SHOTS: Shot[], p: number, target: Float64Array) {
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
  const shift = useRef({ x: 0, y: 0, room: 1 });
  const shot = useMemo(() => new Float64Array(6), []);

  // Framing comes from CSS, where the page layout lives: --board-shift-x/y move the
  // board off-centre (x right, y up) and --board-room is the share of the screen's
  // height left to it between the words above and below.
  useLayoutEffect(() => {
    const css = getComputedStyle(gl.domElement);
    shift.current.x = parseFloat(css.getPropertyValue("--board-shift-x")) || 0;
    shift.current.y = parseFloat(css.getPropertyValue("--board-shift-y")) || 0;
    shift.current.room = parseFloat(css.getPropertyValue("--board-room")) || 1;
    camera.fov = size.width < size.height ? 42 : 30;
    camera.setViewOffset(size.width, size.height, -shift.current.x * size.width, shift.current.y * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
  }, [camera, gl, size]);

  useFrame(() => {
    const { fit, shots } = FRAMING[size.width < size.height ? "tall" : "wide"];
    shotAt(shots, board.p, shot);
    const [az0, el0, dist, tx, ty, tz] = shot;
    const az = az0 + board.leanX * 7;
    const el = el0 - board.leanY * 4;
    const aspect = (size.width / size.height) * (1 - 2 * Math.abs(shift.current.x));
    const vfov = camera.fov * DEG;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const d = Math.max(fit[0] / Math.tan(hfov / 2), fit[1] / shift.current.room / Math.tan(vfov / 2)) * dist;
    camera.position.set(
      tx + d * Math.cos(el * DEG) * Math.sin(az * DEG),
      ty + d * Math.sin(el * DEG),
      tz + d * Math.cos(el * DEG) * Math.cos(az * DEG),
    );
    camera.lookAt(tx, ty, tz);
  });
  return null;
}

/* ----------------------------------------------------------------- stage --- */

function Stage({ onReady }: { onReady?: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const [kit] = useState(createSamples);
  const root = useRef<THREE.Group>(null!);
  const shown = useRef(false);

  useEffect(() => () => kit.dispose(), [kit]);

  useEffect(() => {
    board.invalidate = invalidate;
    return () => {
      board.invalidate = undefined;
    };
  }, [invalidate]);

  // Soft reflections for the marble and brass from a procedural studio: nothing to download.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const studio = new RoomEnvironment();
    const env = pmrem.fromScene(studio, 0.04).texture;
    studio.dispose();
    scene.environment = env;
    scene.environmentIntensity = 0.5;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  // Upload every texture and compile every shader before the first visible frame
  // (the scene mounts well ahead of the section), so scrolling in never stutters.
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
    // keep drawing while the samples float on screen (the scene otherwise renders on demand)
    if (board.active && board.p < 0.75) invalidate();
    if (shown.current || !root.current.visible) return;
    shown.current = true;
    requestAnimationFrame(() => onReady?.());
  });

  return (
    <>
      <hemisphereLight args={["#fff6ea", "#14213d", 0.4]} />
      <directionalLight position={[4.5, 3.5, -4]} intensity={0.9} color="#ffe2a8" />
      <CameraRig />
      <group ref={root} visible={false}>
        <Table kit={kit} />
        {kit.samples.map((s, i) => (
          <Piece key={s.key} sample={s} index={i} />
        ))}
      </group>
    </>
  );
}

export default function Materials({ onReady }: { onReady?: () => void }): ReactNode {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop="demand"
      camera={{ fov: 30, near: 0.3, far: 60, position: [0, 3, 12] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1.05,
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
