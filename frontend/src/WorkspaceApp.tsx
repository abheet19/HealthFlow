import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
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

// Builds the MUI theme from the shared light/dark mode so any MUI component
// follows the same toggle that drives the CSS-variable-based glass chrome.
// NOTE: we deliberately do NOT render <CssBaseline/>. Its body typography is
// injected as *unlayered* CSS, which always beats Tailwind's `@layer base`
// body rule (cascade layers lose to unlayered CSS regardless of order), so it
// was silently forcing MUI's 16px/1.5 onto the body instead of the design
// artifact's 15.5px/1.55. Tailwind's own Preflight already provides the box
// model / margin resets, so dropping CssBaseline restores the design rhythm.
const MuiThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useThemeMode();
  const theme = React.useMemo(() => buildTheme(mode), [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
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
