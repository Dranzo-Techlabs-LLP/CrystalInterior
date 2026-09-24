import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // the brand palette (app/globals.css holds the same tokens)
      colors: {
        yellow: {
          DEFAULT: "var(--yellow)",
          deep: "var(--yellow-deep)",
          soft: "var(--yellow-soft)",
        },
        ink: "var(--ink)",
        night: {
          DEFAULT: "var(--night)",
          2: "var(--night-2)",
          3: "var(--night-3)",
        },
        ivory: "var(--ivory)",
        paper: "var(--paper)",
        sand: "var(--sand)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Didot", "serif"],
        label: ["var(--font-label)", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.3em",
        wide: "0.18em",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.23, 1, 0.32, 1)",
        gentle: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
};

export default config;
