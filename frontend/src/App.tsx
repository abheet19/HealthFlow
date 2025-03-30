import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import ITDashboard from "./pages/ITDashboard";
import ENT from "./pages/ENTDashboard";
import Vision from "./pages/VisionDashboard";
import General from "./pages/GeneralDashboard";
import Dental from "./pages/DentalDashboard";
import { PatientProvider } from "./context/PatientContext";

function App() {
  return (
    <PatientProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<ITDashboard />} />
          <Route path="/it" element={<ITDashboard />} />
          <Route path="/ent" element={<ENT />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/general" element={<General />} />
          <Route path="/dental" element={<Dental />} />
        </Routes>
      </Router>
    </PatientProvider>
  );
}

export default App;
