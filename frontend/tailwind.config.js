/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-rye)", "serif"],
        body: ["var(--font-special-elite)", "serif"],
        mono: ["var(--font-special-elite)", "serif"],
      },
      colors: {
        parchment: {
          50:  "#fdf8f0",
          100: "#f9edda",
          200: "#f2d9b0",
          300: "#e8c07f",
          400: "#dca050",
          500: "#c8852e",
          600: "#a86820",
          700: "#864f18",
          800: "#6b3d14",
          900: "#542f10",
        },
        saddle: {
          50:  "#fdf5ec",
          100: "#f8e4c8",
          200: "#f0c48d",
          300: "#e59e4e",
          400: "#d4792a",
          500: "#b85e18",
          600: "#964913",
          700: "#753710",
          800: "#5d2b0d",
          900: "#48210a",
        },
        dirt:   "#2c1a0e",
        dusk:   "#8b2e2e",
        sage:   "#4a7c59",
        copper: "#b5651d",
        gold:   "#d4a017",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        "poster": "4px 4px 0 #2c1a0e, 8px 8px 0 rgba(44,26,14,0.3)",
        "stamp":  "inset 0 0 0 3px currentColor, inset 0 0 0 5px transparent, inset 0 0 0 7px currentColor",
      },
      keyframes: {
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "sway": {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        "stampIn": {
          "0%": { opacity: "0", transform: "scale(2) rotate(-15deg)" },
          "60%": { opacity: "1", transform: "scale(0.95) rotate(2deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
      },
      animation: {
        "flicker": "flicker 3s ease-in-out infinite",
        "sway": "sway 4s ease-in-out infinite",
        "stamp-in": "stampIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
};
