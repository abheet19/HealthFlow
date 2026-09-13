import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { PatientProvider } from "./context/PatientContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeModeContext";
import { buildTheme } from "./theme";

// Department forms are sizeable and most users work in one station at a time.
// Route chunks prevent one station from downloading every other form up front.
const ITDashboard = React.lazy(() => import("./pages/ITDashboard"));
const ENT = React.lazy(() => import("./pages/ENTDashboard"));
const Vision = React.lazy(() => import("./pages/VisionDashboard"));
const General = React.lazy(() => import("./pages/GeneralDashboard"));
const Dental = React.lazy(() => import("./pages/DentalDashboard"));
const PatientsList = React.lazy(() => import("./pages/PatientsList"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

// Builds the MUI theme from the shared light/dark mode so every MUI
// component (TextField, Select, Table, Snackbar, ...) follows the same
// toggle that drives the CSS-variable-based glass chrome.
const MuiThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useThemeMode();
  const theme = React.useMemo(() => buildTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

function WorkspaceApp() {
  return (
    <ThemeModeProvider>
      <MuiThemeBridge>
        <PatientProvider>
          <ToastProvider>
            <Router>
              <AppShell>
                <React.Suspense
                  fallback={
                    <div className="min-h-[70vh] grid place-items-center text-text-dim" aria-busy="true" aria-live="polite">
                      Loading department…
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<ITDashboard />} />
                    <Route path="/it" element={<ITDashboard />} />
                    <Route path="/ent" element={<ENT />} />
                    <Route path="/vision" element={<Vision />} />
                    <Route path="/general" element={<General />} />
                    <Route path="/dental" element={<Dental />} />
                    <Route path="/patients" element={<PatientsList />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </React.Suspense>
              </AppShell>
            </Router>
          </ToastProvider>
        </PatientProvider>
      </MuiThemeBridge>
    </ThemeModeProvider>
  );
}

export default WorkspaceApp;
