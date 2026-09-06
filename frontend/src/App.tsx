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
import PatientsList from "./pages/PatientsList"; // added import
import { PatientProvider } from "./context/PatientContext";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
              <Route path="/patients" element={<PatientsList />} /> {/* added route */}
            </Routes>
          </Router>
        </ToastProvider>
      </PatientProvider>
    </ThemeProvider>
  );
}

export default App;
