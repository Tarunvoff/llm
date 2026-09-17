import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds & surfaces
        ivory: {
          50: "#FFFFFF",
          100: "#FAF9F5",
          DEFAULT: "#F7F7F2",
          200: "#EFEFE8",
          300: "#E4E2D8",
          400: "#D2CFC2",
          500: "#B8B4A5",
        },
        nearblack: {
          DEFAULT: "#151515",
          50: "#707070",
          100: "#555555",
          200: "#3D3D3D",
          300: "#2B2B2B",
          400: "#1E1E1E",
          900: "#151515",
        },
        // Primary Brand Accent: Coral / Orange
        coral: {
          50: "#FFF3F0",
          100: "#FFE4DE",
          200: "#FFC8BC",
          300: "#FFA391",
          400: "#FF765C",
          DEFAULT: "#FF5734",
          600: "#E64320",
          700: "#BD3012",
          800: "#9C260D",
          900: "#7D1E0B",
        },
        // Secondary Accent: Soft Lavender
        lavender: {
          50: "#F8F5FE",
          100: "#F0E9FD",
          200: "#E0D1FB",
          300: "#CEB6F9",
          DEFAULT: "#B99AF5",
          500: "#A37EF0",
          600: "#8656E6",
          700: "#6C38D4",
        },
        // Highlight Accent: Warm Yellow
        warmyellow: {
          50: "#FFFDF2",
          100: "#FFF9D6",
          200: "#FFF1A3",
          DEFAULT: "#FFCC42",
          500: "#E5B125",
          600: "#C2900C",
        },
        // Educational Muted Green
        academic: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#16A34A",
          DEFAULT: "#16A34A",
          600: "#15803D",
          700: "#166534",
          800: "#14532D",
        },
        // Legacy ink mapping updated for warm theme
        ink: {
          50: "#151515",
          100: "#222222",
          200: "#3A3A3A",
          300: "#555555",
          400: "#6B7280",
          500: "#9CA3AF",
          600: "#D1D5DB",
          700: "#E5E7EB",
          800: "#EFEFEA",
          900: "#F7F7F2",
          950: "#FAF9F5",
        },
        paper: {
          DEFAULT: "#F7F7F2",
          light: "#FFFFFF",
          muted: "#FAF9F5",
          border: "#E8E6DE",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Kodchasan", "sans-serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(21, 21, 21, 0.04), 0 1px 2px -1px rgba(21, 21, 21, 0.03)",
        card: "0 2px 8px -2px rgba(21, 21, 21, 0.06), 0 1px 4px -1px rgba(21, 21, 21, 0.04)",
        elevated: "0 10px 25px -5px rgba(21, 21, 21, 0.08), 0 8px 10px -6px rgba(21, 21, 21, 0.04)",
        floating: "0 20px 35px -10px rgba(255, 87, 52, 0.15), 0 1px 3px 0 rgba(21, 21, 21, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
