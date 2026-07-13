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
        ink: {
          950: "#14130f",
          900: "#1c1a15",
          800: "#26241d",
          700: "#35322a",
          600: "#4a463a",
          500: "#635e4e",
          400: "#847e6a",
          300: "#a7a08a",
          200: "#cac4ae",
          100: "#e3decb",
        },
        parchment: {
          50: "#fbfaf6",
          100: "#f5f2e9",
          200: "#ece6d5",
        },
        brass: {
          400: "#c7a15a",
          500: "#b08d3f",
          600: "#93752f",
        },
        clay: {
          500: "#a15c3e",
          600: "#8a4a30",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20,19,15,0.06), 0 8px 24px -12px rgba(20,19,15,0.18)",
      },
      borderRadius: {
        sm2: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
