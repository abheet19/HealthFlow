/** @type {import('tailwindcss').Config} */

// Small helper for the standard Tailwind "CSS-variable + dark mode" recipe:
// the variable holds a bare "R G B" triple so Tailwind's own `/opacity`
// modifiers (bg-accent/10, text-danger/50, ...) keep working, while the
// variable itself can be redefined per theme in index.css.
function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${variable}))` : `rgb(var(${variable}) / ${opacityValue})`;
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shared "Zeno glass" ecosystem tokens - a restrained cyan/amber
        // accent pair over a near-black ground, the same design language as
        // the sibling Weft/Vantage projects. Values live as CSS variables in
        // index.css (dark-first, with a light override) so the in-app theme
        // toggle can flip every one of these at once.
        bg: withOpacity("--hf-bg"),
        "bg-2": "rgb(var(--hf-bg-2))",
        surface: "var(--hf-surface)",
        "surface-solid": withOpacity("--hf-surface-solid"),
        "surface-hi": "var(--hf-surface-hi)",
        glass: "var(--hf-surface)",
        "glass-border": "var(--hf-border)",
        "border-hi": "var(--hf-border-hi)",
        text: {
          DEFAULT: withOpacity("--hf-ink"),
          dim: withOpacity("--hf-ink-dim"),
          faint: "rgb(var(--hf-ink-faint))",
        },
        accent: {
          DEFAULT: withOpacity("--hf-accent"),
          light: "rgb(var(--hf-accent-light))",
          2: withOpacity("--hf-accent-2"),
        },
        "on-accent": "rgb(var(--hf-on-accent))",
        success: withOpacity("--hf-good"),
        danger: withOpacity("--hf-critical"),
        // Per-department accent family - lets patient rows, avatars and
        // nav badges read as distinct at a glance without a second brand hue.
        hue: {
          it: "rgb(var(--hf-hue-it))",
          ent: "rgb(var(--hf-hue-ent))",
          vision: "rgb(var(--hf-hue-vision))",
          general: "rgb(var(--hf-hue-general))",
          dental: "rgb(var(--hf-hue-dental))",
          patients: "rgb(var(--hf-hue-patients))",
        },
      },
      fontFamily: {
        // Display (Newsreader serif) + body (Manrope) + mono (IBM Plex Mono) -
        // the same three-family type system used across the ecosystem.
        display: ['"Newsreader"', '"Iowan Old Style"', "Georgia", "serif"],
        // Match the design artifact's body stack verbatim (-apple-system before
        // Segoe UI, no system-ui) so the computed font-family is identical.
        body: ["Manrope", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", '"SFMono-Regular"', "Menlo", "monospace"],
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, rgb(var(--hf-accent)), rgb(var(--hf-accent-2)))",
        "app-glow":
          "radial-gradient(1200px 600px at 20% -10%, rgb(var(--hf-accent) / 0.16), transparent), radial-gradient(1000px 500px at 90% 10%, rgb(var(--hf-accent-2) / 0.10), transparent)",
      },
      backdropBlur: {
        xl: "20px",
      },
      boxShadow: {
        glass: "inset 0 1px 0 rgba(255,255,255,.08), 0 18px 50px -28px var(--hf-shadow)",
      },
    },
  },
  plugins: [],
}
