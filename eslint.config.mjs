import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Photos are plain <img> elements on purpose: Unsplash URLs are already
      // sized and cropped by their query string, so next/image adds nothing.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // The 3D scenes mutate three.js objects every frame inside useFrame, outside
    // React's render: that is react-three-fiber's intended pattern, not state.
    files: ["components/three/**"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The film is a separate Remotion project with its own lint setup.
    "film/**",
    ".backup/**",
    "public/**",
  ]),
]);
