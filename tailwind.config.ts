import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "var(--ivory)",
        beige: "var(--beige)",
        sand: "var(--sand)",
        clay: "var(--clay)",
        walnut: {
          DEFAULT: "var(--walnut)",
          deep: "var(--walnut-deep)",
        },
        charcoal: {
          DEFAULT: "var(--charcoal)",
          soft: "var(--charcoal-soft)",
        },
        brass: {
          DEFAULT: "var(--brass)",
          bright: "var(--brass-bright)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.32em",
        wide: "0.18em",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
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
