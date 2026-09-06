/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        surface: "#11141c",
        glass: "rgba(255,255,255,0.04)",
        "glass-border": "rgba(255,255,255,0.08)",
        text: {
          DEFAULT: "#e8eaf0",
          dim: "#9aa1b2",
        },
        accent: {
          DEFAULT: "#61dafb",
          2: "#3178c6",
        },
        success: "#4ade80",
        danger: "#f87171",
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Segoe UI"', "system-ui", "sans-serif"],
        body: ["Inter", '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #3178C6, #61dafb)",
        "app-glow":
          "radial-gradient(1200px 600px at 20% -10%, rgba(22,35,58,0.2), transparent), radial-gradient(1000px 500px at 90% 10%, rgba(26,42,26,0.13), transparent)",
      },
      backdropBlur: {
        xl: "16px",
      },
    },
  },
  plugins: [],
}
