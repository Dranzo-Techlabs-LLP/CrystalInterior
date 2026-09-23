import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LightLeak } from "@remotion/light-leaks";
import { cover, shots, type ShotSpec } from "./shots";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** A walking pace: gentle start, steady middle, gentle arrival. */
const walk = Easing.bezier(0.45, 0, 0.55, 1);

/** Feathered on all four sides, so a retouch blends into the photo around it. */
const feather = [
  "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
  "linear-gradient(transparent, #000 25%, #000 75%, transparent)",
].join(", ");

/** One photograph, cover-fitted, with the camera pushing toward its aim point. */
const Shot: React.FC<{ spec: ShotSpec; scale: number }> = ({ spec, scale }) => {
  const { width, height } = useVideoConfig();
  const box = cover(spec, width, height);
  const place = { position: "absolute", width: box.width, height: box.height } as const;

  let retouch: React.ReactNode = null;
  if (spec.retouch) {
    const [x0, y0, x1, y1] = spec.retouch.rect;
    const [dx, dy] = spec.retouch.from;
    const left = box.left + box.width * x0;
    const top = box.top + box.height * y0;
    retouch = (
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: box.width * (x1 - x0),
          height: box.height * (y1 - y0),
          overflow: "hidden",
          maskImage: feather,
          maskComposite: "intersect",
        }}
      >
        <Img
          src={spec.src}
          style={{ ...place, left: box.left - left - box.width * dx, top: box.top - top - box.height * dy }}
        />
      </div>
    );
  }

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${box.originX}px ${box.originY}px`,
      }}
    >
      <Img src={spec.src} style={{ ...place, left: box.left, top: box.top }} />
      {retouch}
    </AbsoluteFill>
  );
};

/**
 * "Walk-in": up the path to the front door, through it as warm light spills
 * out, down the entrance hall, and through a pair of doors into the living
 * room. Timed in seconds so every aspect ratio and frame rate shares one cut.
 */
export const WalkIn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const at = (range: [number, number], out: [number, number], easing = walk) =>
    interpolate(t, range, out, { ...clamp, easing });

  // A — up the path to the front door.
  const exteriorScale = at([0, 4.3], [1, 2.05]);
  const exteriorOpacity = at([3.45, 4.3], [1, 0], Easing.linear);

  // The door opens: warm light blooms from it and floods the frame.
  const door = cover(shots.exterior, width, height);
  const bloom =
    t < 3.95
      ? at([2.85, 3.95], [0, 1], Easing.in(Easing.quad))
      : at([3.95, 4.9], [1, 0], Easing.out(Easing.quad));
  const bloomRadius = at([2.85, 4.2], [width * 0.05, width * 1.15], Easing.in(Easing.cubic));

  // B — down the hall toward the inner doors, which then swing open.
  const hallScale = at([3.45, 7.7], [1.14, 1.52]);
  const swing = at([6.5, 7.9], [0, 84], Easing.in(Easing.cubic));
  const leafShade = at([6.6, 7.85], [0, 0.78], Easing.linear);

  // C — into the living room; the room brightens as we arrive.
  const livingScale = at([6.5, 10], [1, 1.1], Easing.bezier(0.25, 0.1, 0.25, 1));
  const livingVeil = at([6.7, 8.4], [0.45, 0], Easing.out(Easing.quad));

  return (
    <AbsoluteFill style={{ backgroundColor: "#140f0b" }}>
      {/* C — the living room, waiting behind the hall doors. */}
      <Shot spec={shots.living} scale={livingScale} />
      <AbsoluteFill style={{ backgroundColor: "#0c0906", opacity: livingVeil }} />

      {/* B — the hall, rendered as two door leaves that swing open in 3D. */}
      {t < 8.1 && (
        <AbsoluteFill style={{ perspective: `${width * 1.1}px`, perspectiveOrigin: "50% 46%" }}>
          {(["left", "right"] as const).map((side) => (
            <AbsoluteFill
              key={side}
              style={{
                clipPath: side === "left" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
                transformOrigin: side === "left" ? "0% 50%" : "100% 50%",
                transform: `rotateY(${side === "left" ? swing : -swing}deg)`,
              }}
            >
              <Shot spec={shots.hall} scale={hallScale} />
              <AbsoluteFill style={{ backgroundColor: "#0b0806", opacity: leafShade }} />
            </AbsoluteFill>
          ))}
        </AbsoluteFill>
      )}

      {/* A — the approach. */}
      {exteriorOpacity > 0 && (
        <AbsoluteFill style={{ opacity: exteriorOpacity }}>
          <Shot spec={shots.exterior} scale={exteriorScale} />
        </AbsoluteFill>
      )}

      {/* Light spilling from the opened front door: warm white, not neon. */}
      {bloom > 0 && (
        <AbsoluteFill
          style={{
            opacity: bloom * 0.9,
            background: `radial-gradient(circle at ${door.originX}px ${door.originY}px,
              rgba(255, 246, 232, 1) 0px,
              rgba(255, 226, 190, 0.72) ${bloomRadius * 0.38}px,
              rgba(255, 210, 160, 0) ${bloomRadius}px)`,
          }}
        />
      )}
      {/* A light-leak streak across the threshold, screened in softly. */}
      <Sequence from={Math.round(3.05 * fps)} durationInFrames={Math.round(1.7 * fps)}>
        <AbsoluteFill style={{ opacity: 0.4, mixBlendMode: "screen" }}>
          <LightLeak seed={4} hueShift={350} />
        </AbsoluteFill>
      </Sequence>

      {/* A soft lens vignette, constant through the film. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 95% at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,6,4,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
