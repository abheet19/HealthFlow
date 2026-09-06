import { createTheme } from "@mui/material/styles";

// MUI theme mirroring the shared dark/glass design tokens defined in
// tailwind.config.js (colors.bg, colors.surface, colors.accent, fonts).
// HealthFlow's clinical emerald/mint family - one green hue carried from a
// light highlight (#5EE6A8) through the mid accent (#3ECF8E) to a deep
// forest edge (#1E9A66) - kept deliberately distinct from the sibling
// projects' own accent families.
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0A0D0B",
      paper: "#10140F",
    },
    primary: {
      main: "#3ECF8E",
      light: "#5EE6A8",
      dark: "#1E9A66",
      contrastText: "#04140D",
    },
    secondary: {
      main: "#1E9A66",
      contrastText: "#E6F5EE",
    },
    text: {
      primary: "#E6F5EE",
      secondary: "#93AFA3",
    },
    success: { main: "#4ade80" },
    error: { main: "#f87171" },
    divider: "rgba(94,230,168,0.14)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    h1: { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' },
    h2: { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' },
    h3: { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' },
    h4: { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' },
    h5: { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' },
    h6: { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.08)",
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
          borderBottom: "1px solid rgba(255,255,255,0.08)",
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
  },
});

export default theme;
