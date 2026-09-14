import { createTheme, Theme } from "@mui/material/styles";

export type ThemeMode = "dark" | "light";

// MUI palette mirroring the shared dark/glass design tokens defined as CSS
// variables in index.css (--hf-*): a restrained cyan/amber accent pair over
// a near-black ground in dark mode, and the same pair re-tuned for contrast
// on a warm-white ground in light mode. Tailwind-styled parts of the app
// read the CSS variables directly (and follow the theme toggle instantly);
// this factory gives MUI's own components (TextField, Select, Table,
// Snackbar, Skeleton, ...) matching concrete values for each mode.
const PALETTES: Record<ThemeMode, {
  bg: string; paper: string; paperHi: string;
  accent: string; accentLight: string; accentDark: string; accent2: string;
  onAccent: string; text: string; textDim: string;
  success: string; danger: string; divider: string;
}> = {
  dark: {
    bg: "#070b10",
    paper: "#101a22",
    paperHi: "rgba(30,44,54,0.62)",
    accent: "#49d3e8",
    accentLight: "#8ce7f2",
    accentDark: "#2aa9bd",
    accent2: "#f0ae4e",
    onAccent: "#04262c",
    text: "#e9f3f5",
    textDim: "#93b0b6",
    success: "#3ecf8e",
    danger: "#ef6f6f",
    divider: "rgba(150,198,206,0.16)",
  },
  light: {
    bg: "#f2f7f8",
    paper: "#ffffff",
    paperHi: "rgba(255,255,255,0.86)",
    accent: "#0e8fa6",
    accentLight: "#35b0c4",
    accentDark: "#0a6d7f",
    accent2: "#a86a17",
    onAccent: "#ffffff",
    text: "#0e1f26",
    textDim: "#4c6771",
    success: "#1e9a66",
    danger: "#c23b3b",
    divider: "rgba(16,64,74,0.14)",
  },
};

export const buildTheme = (mode: ThemeMode): Theme => {
  const p = PALETTES[mode];
  return createTheme({
    palette: {
      mode,
      background: {
        default: p.bg,
        paper: p.paper,
      },
      primary: {
        main: p.accent,
        light: p.accentLight,
        dark: p.accentDark,
        contrastText: p.onAccent,
      },
      secondary: {
        main: p.accent2,
        contrastText: p.onAccent,
      },
      text: {
        primary: p.text,
        secondary: p.textDim,
      },
      success: { main: p.success },
      error: { main: p.danger },
      divider: p.divider,
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Manrope", -apple-system, "Segoe UI", sans-serif',
      h1: { fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif' },
      h2: { fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif' },
      h3: { fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif' },
      h4: { fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif' },
      h5: { fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif' },
      h6: { fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif' },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${p.divider}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${p.divider}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: 11,
          },
        },
      },
    },
  });
};

// Back-compat default export (dark) - nothing else in the app imports this
// directly any more (WorkspaceApp builds a theme from ThemeModeContext), but
// keeping it avoids breaking any external tooling that imports the module.
export default buildTheme("dark");
