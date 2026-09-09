import * as React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navigation from "./components/Navigation";
import { PatientProvider } from "./context/PatientContext";
import { ToastProvider } from "./context/ToastContext";
import theme from "./theme";

// Department forms are sizeable and most users work in one station at a time.
// Route chunks prevent one station from downloading every other form up front.
const ITDashboard = React.lazy(() => import("./pages/ITDashboard"));
const ENT = React.lazy(() => import("./pages/ENTDashboard"));
const Vision = React.lazy(() => import("./pages/VisionDashboard"));
const General = React.lazy(() => import("./pages/GeneralDashboard"));
const Dental = React.lazy(() => import("./pages/DentalDashboard"));
const PatientsList = React.lazy(() => import("./pages/PatientsList"));

function WorkspaceApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PatientProvider>
        <ToastProvider>
          <Router>
            <Navigation />
            <React.Suspense
              fallback={
                <main className="min-h-[70vh] grid place-items-center text-text-dim" aria-busy="true" aria-live="polite">
                  Loading department…
                </main>
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
              </Routes>
            </React.Suspense>
          </Router>
        </ToastProvider>
      </PatientProvider>
    </ThemeProvider>
  );
}

export default WorkspaceApp;
