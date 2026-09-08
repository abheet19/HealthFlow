import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Navigation from "./components/Navigation";
import ITDashboard from "./pages/ITDashboard";
import ENT from "./pages/ENTDashboard";
import Vision from "./pages/VisionDashboard";
import General from "./pages/GeneralDashboard";
import Dental from "./pages/DentalDashboard";
import PatientsList from "./pages/PatientsList";
import { PatientProvider } from "./context/PatientContext";
import { ToastProvider } from "./context/ToastContext";
import AccessGate from "./components/AccessGate";
import { hasAccessCode } from "./config/api";

function App() {
  const [unlocked, setUnlocked] = React.useState(hasAccessCode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {unlocked ? (
        <PatientProvider>
          <ToastProvider>
            <Router>
              <Navigation />
              <Routes>
                <Route path="/" element={<ITDashboard />} />
                <Route path="/it" element={<ITDashboard />} />
                <Route path="/ent" element={<ENT />} />
                <Route path="/vision" element={<Vision />} />
                <Route path="/general" element={<General />} />
                <Route path="/dental" element={<Dental />} />
                <Route path="/patients" element={<PatientsList />} />
              </Routes>
            </Router>
          </ToastProvider>
        </PatientProvider>
      ) : (
        <AccessGate onUnlock={() => setUnlocked(true)} />
      )}
    </ThemeProvider>
  );
}

export default App;
