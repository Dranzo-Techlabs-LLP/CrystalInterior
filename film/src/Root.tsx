import React from "react";
import { Composition } from "remotion";
import { WalkIn } from "./WalkIn";
import { Morning } from "./Morning";

/**
 * Films for The Crystal Interiors website.
 *  - WalkIn / WalkInPortrait: the scroll-scrubbed opening (rendered as frame
 *    sequences for desktop and mobile).
 *  - Morning: the ambient loop beside the reviews (rendered as MP4).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="WalkIn" component={WalkIn} width={1600} height={900} fps={15} durationInFrames={150} />
      <Composition
        id="WalkInPortrait"
        component={WalkIn}
        width={720}
        height={1280}
        fps={10}
        durationInFrames={100}
      />
      <Composition id="Morning" component={Morning} width={1000} height={1000} fps={24} durationInFrames={192} />
    </>
  );
};
