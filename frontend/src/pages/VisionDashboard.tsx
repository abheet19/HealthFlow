import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { PatientContext } from "../context/PatientContext";

const VisionDashboard: React.FC = () => {
  const [reVision, setReVision] = useState("6/6");
  const [leVision, setLeVision] = useState("6/6");
  const [reColor, setReColor] = useState("");
  const [leColor, setLeColor] = useState("");
  const [reSquint, setReSquint] = useState("");
  const [leSquint, setLeSquint] = useState("");
  const [manualPatientId, setManualPatientId] = useState("");

  const { updateDepartment, patientData, updatePatientId, resetPatientData } = useContext(PatientContext);
  const location = useLocation();

  // Initialize local state from context (if already set)
  useEffect(() => {
    if (patientData.vision) {
      setReVision(patientData.vision.re_vision || "6/6");
      setLeVision(patientData.vision.le_vision || "6/6");
      setReColor(patientData.vision.re_color_blindness || "");
      setLeColor(patientData.vision.le_color_blindness || "");
      setReSquint(patientData.vision.re_squint || "");
      setLeSquint(patientData.vision.le_squint || "");
    }
  }, [patientData.vision]);

  useEffect(() => {
    // Optionally, if patientData.patientId is absent, prompt user to enter it
    if (!patientData.patientId && manualPatientId) {
      // update context with manually provided patient id
      // ...call updatePatientId(manualPatientId)
    }
  }, [patientData.patientId, manualPatientId]);

  // Automatically read patientId from the URL and update context if not already set
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pid = params.get("patientId");
    if (pid && !patientData.patientId) {
      updatePatientId(pid);
    }
  }, [location, patientData.patientId, updatePatientId]);

  // Add new effect to reset form when patientId is cleared
  useEffect(() => {
    if (!patientData.patientId) {
      resetForm();
    }
  }, [patientData.patientId]);

  const updateVision = (updates: Partial<Record<string, string>>) => {
    // Don't update department data until submit button is clicked
  };

  const resetForm = () => {
    setReVision("6/6");
    setLeVision("6/6");
    setReColor("");
    setLeColor("");
    setReSquint("");
    setLeSquint("");
  };

  const handleSubmit = () => {
    const allFields = {
      re_vision: reVision,
      le_vision: leVision,
      re_color_blindness: reColor,
      le_color_blindness: leColor,
      re_squint: reSquint,
      le_squint: leSquint,
    };

    if (Object.values(allFields).some(value => !value)) {
      alert("Please fill all fields before submitting.");
      return;
    }

    updateDepartment("vision", allFields);
    alert("Vision data saved successfully.");
    resetForm();
    resetPatientData("vision"); // Specify department
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        {patientData.patientId ? (
          <>
            <div className="mb-4 text-gray-600">
              <p>Patient Number: <span className="font-bold">{patientData.patientId}</span></p>
              {patientData.it?.name && (
                <p>Patient Name: <span className="font-bold">{patientData.it.name}</span></p>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
              Vision Examination Report
            </h1>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Right Eye
              </h2>
              <div className="flex flex-wrap gap-2">
                <TextField
                  label="Vision"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  value={reVision}
                  onChange={(e) => {
                    setReVision(e.target.value);
                  }}
                />
                <FormControl variant="outlined" size="small" className="w-full sm:w-64">
                  <InputLabel>Color Blindness</InputLabel>
                  <Select
                    label="Color Blindness"
                    value={reColor}
                    onChange={(e) => {
                      setReColor(e.target.value as string);
                    }}
                  >
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="YES">YES</MenuItem>
                  </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" className="w-full sm:w-64">
                  <InputLabel>Squint</InputLabel>
                  <Select
                    label="Squint"
                    value={reSquint}
                    onChange={(e) => {
                      setReSquint(e.target.value as string);
                    }}
                  >
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="YES">YES</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Left Eye</h2>
              <div className="flex flex-wrap gap-2">
                <TextField
                  label="Vision"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  value={leVision}
                  onChange={(e) => {
                    setLeVision(e.target.value);
                  }}
                />
                <FormControl variant="outlined" size="small" className="w-full sm:w-64">
                  <InputLabel>Color Blindness</InputLabel>
                  <Select
                    label="Color Blindness"
                    value={leColor}
                    onChange={(e) => {
                      setLeColor(e.target.value as string);
                    }}
                  >
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="YES">YES</MenuItem>
                  </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" className="w-full sm:w-64">
                  <InputLabel>Squint</InputLabel>
                  <Select
                    label="Squint"
                    value={leSquint}
                    onChange={(e) => {
                      setLeSquint(e.target.value as string);
                    }}
                  >
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="YES">YES</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                className="w-full sm:w-64 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <h2 className="text-xl text-gray-600">
              Waiting for patient ID from IT Department...
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionDashboard;
