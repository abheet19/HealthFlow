/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clinical emerald/mint - HealthFlow's own accent family, distinct
        // from the sibling projects' palettes (Weft teal+indigo, Vantage
        // gold+ochre): a single green hue carried across three depths.
        bg: "#0A0D0B",
        surface: "#10140F",
        glass: "rgba(255,255,255,0.04)",
        "glass-border": "rgba(94,230,168,0.14)",
        text: {
          DEFAULT: "#E6F5EE",
          dim: "#93AFA3",
        },
        accent: {
          DEFAULT: "#3ECF8E",
          light: "#5EE6A8",
          2: "#1E9A66",
        },
        "on-accent": "#04140D",
        success: "#4ade80",
        danger: "#f87171",
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Segoe UI"', "system-ui", "sans-serif"],
        body: ["Inter", '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg, #5EE6A8, #3ECF8E 55%, #1E9A66)",
        "app-glow":
          "radial-gradient(1200px 600px at 20% -10%, rgba(30,154,102,0.16), transparent), radial-gradient(1000px 500px at 90% 10%, rgba(94,230,168,0.10), transparent)",
      },
      backdropBlur: {
        xl: "16px",
      },
    },
  },
  plugins: [],
}
