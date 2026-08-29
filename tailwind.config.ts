import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        ink: {
          50: "#f5f7fa",
          100: "#e9edf3",
          200: "#cfd8e3",
          300: "#a9b8cb",
          400: "#7c90ac",
          500: "#5b7191",
          600: "#475a78",
          700: "#3b4a61",
          800: "#334052",
          900: "#1d2734",
          950: "#111823",
        },
        accent: {
          50: "#f0f9f6",
          100: "#daf0e8",
          200: "#b7e1d3",
          300: "#87cab6",
          400: "#54ac95",
          500: "#33907a",
          600: "#237362",
          700: "#1d5c51",
          800: "#1a4a42",
          900: "#173e38",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 24, 35, 0.04), 0 8px 24px -12px rgba(17, 24, 35, 0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.4s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
