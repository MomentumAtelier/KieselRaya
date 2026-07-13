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
        // Warm charcoal — matte-black neutral with a whisper of warmth,
        // in the spirit of the brief's "matte black" while still reading
        // as a refined charcoal rather than pure black.
        ink: {
          950: "#1a1816",
          900: "#242220",
          800: "#302d2a",
          700: "#423e3a",
          600: "#5c5751",
          500: "#79746c",
          400: "#9a958c",
          300: "#b8b3a9",
          200: "#d6d1c5",
          100: "#ede9dd",
        },
        // Warm white / soft cream backgrounds.
        parchment: {
          50: "#faf7f0",
          100: "#f3ede0",
          200: "#e8dfcb",
        },
        // Deep burgundy — the brand's primary accent, matching the
        // "MOMENTUM" wordmark and the maroon ring in the actual logo.
        // This is preserved as-is; it is the one color that must never
        // drift, since it's the literal trademark.
        brass: {
          400: "#93384c",
          500: "#7a1f31",
          600: "#5c1524",
        },
        // Champagne gold / muted bronze — the secondary luxury accent
        // from the creative brief, used sparingly (AI panels, dividers,
        // relationship-tier accents) so it never competes with the
        // primary burgundy brand color.
        bronze: {
          400: "#c9a545",
          500: "#a9852a",
          600: "#8a6b1f",
        },
        // Kept distinct from both accent colors so errors read as
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
        panel: "0 1px 2px rgba(26,24,22,0.05), 0 12px 32px -16px rgba(26,24,22,0.16)",
        elevated: "0 2px 4px rgba(26,24,22,0.06), 0 24px 48px -20px rgba(26,24,22,0.22)",
        glow: "0 0 0 1px rgba(169,133,42,0.15), 0 8px 24px -8px rgba(169,133,42,0.25)",
      },
      borderRadius: {
        sm2: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
