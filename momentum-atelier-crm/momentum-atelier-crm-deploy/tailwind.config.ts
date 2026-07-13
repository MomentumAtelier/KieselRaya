import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cool charcoal/steel — matches the logo's silver ring and the
        // gray "ATELIER" wordmark, replacing the previous warm brown-black.
        ink: {
          950: "#16171a",
          900: "#202226",
          800: "#2a2d32",
          700: "#3a3d43",
          600: "#52565d",
          500: "#6c7078",
          400: "#8a8e96",
          300: "#a9adb4",
          200: "#c8cbd1",
          100: "#e5e7ea",
        },
        // Cool near-white backgrounds, replacing the previous warm cream.
        parchment: {
          50: "#fafafb",
          100: "#f1f2f4",
          200: "#e3e5e8",
        },
        // Deep burgundy/maroon — the brand's primary accent, matching the
        // "MOMENTUM" wordmark and the maroon ring in the logo.
        brass: {
          400: "#93384c",
          500: "#7a1f31",
          600: "#5c1524",
        },
        // Kept distinct from the burgundy brand accent so errors read as
        // "something's wrong," not "this is a branded element."
        clay: {
          500: "#c1461f",
          600: "#9c3919",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(22,23,26,0.06), 0 8px 24px -12px rgba(22,23,26,0.18)",
      },
      borderRadius: {
        sm2: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
