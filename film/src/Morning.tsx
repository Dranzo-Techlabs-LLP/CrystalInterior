import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { morning } from "./shots";

/**
 * A quiet morning at home — an ambient loop that sits beside the reviews.
 * Every motion is a full sine cycle, so the last frame meets the first and the
 * clip loops without a seam.
 */
export const Morning: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cycle = (frame / durationInFrames) * Math.PI * 2;

  const scale = 1.05 + 0.03 * Math.sin(cycle);
  const driftX = 1.2 * Math.sin(cycle + 0.8);
  const lightX = 28 + 14 * Math.sin(cycle + 1.2);
  const lightAlpha = 0.2 + 0.07 * Math.cos(cycle);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1b1612" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${driftX}%) scale(${scale})`,
          transformOrigin: morning.origin,
        }}
      >
        <Img
          src={morning.src}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: morning.position }}
        />
      </AbsoluteFill>
      {/* Window light drifting across the room. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 48% at ${lightX}% 22%, rgba(255, 228, 186, ${lightAlpha}), rgba(255, 228, 186, 0) 72%)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
