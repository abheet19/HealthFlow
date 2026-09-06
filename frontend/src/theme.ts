import { createTheme } from "@mui/material/styles";

// MUI theme mirroring the shared dark/glass design tokens defined in
// tailwind.config.js (colors.bg, colors.surface, colors.accent, fonts).
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0b0d12",
      paper: "#11141c",
    },
    primary: {
      main: "#61dafb",
      dark: "#3178c6",
      contrastText: "#061018",
    },
    secondary: {
      main: "#3178c6",
      contrastText: "#e8eaf0",
    },
    text: {
      primary: "#e8eaf0",
      secondary: "#9aa1b2",
    },
    success: { main: "#4ade80" },
    error: { main: "#f87171" },
    divider: "rgba(255,255,255,0.08)",
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
