import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { useToast } from "../context/ToastContext";
import { getApiUrl } from "../config/api";  // Import the API URL helper

const VisionDashboard: React.FC = () => {
  const [reVision, setReVision] = useState("6/6");
  const [leVision, setLeVision] = useState("6/6");
  const [reColor, setReColor] = useState("");
  const [leColor, setLeColor] = useState("");
  const [reSquint, setReSquint] = useState("");
  const [leSquint, setLeSquint] = useState("");
  const [manualPatientId, setManualPatientId] = useState("");
  // Add visionData state variable
  const [visionData, setVisionData] = useState<Record<string, string>>({});

  const { updateDepartment, patientData, updatePatientId, resetPatientData } = useContext(PatientContext);
  const { showToast } = useToast();
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

  // Add reset event listener
  useEffect(() => {
    const handleGlobalReset = () => {
      resetForm(); // Reset all form fields
    };
    
    window.addEventListener('patientDataReset', handleGlobalReset);
    
    return () => {
      window.removeEventListener('patientDataReset', handleGlobalReset);
    };
  }, []);

  // Original effect for loading data from context
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
    // Validate all required fields
    if (!reVision || !leVision || !reColor || !leColor || !reSquint || !leSquint) {
      showToast("Please fill all required fields", "error");
      return;
    }

    // Create data object with all field values
    const data = {
      re_vision: reVision,
      le_vision: leVision,
      re_color_blindness: reColor,
      le_color_blindness: leColor,
      re_squint: reSquint,
      le_squint: leSquint,
      isSubmitted: true // Add isSubmitted flag to mark this department as complete
    };

    // Update patient data in context
    updateDepartment("vision", data);
    showToast("Vision data saved successfully", "success");
    resetForm();
  };

  const handleFinalSubmit = async () => {
    // ...validate Vision data...
    try {
      const res = await fetch(getApiUrl("/api/submit_vision"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ /* Vision data */ })
      });
      const result = await res.json();
      if (result.message === "Vision info submitted successfully.") {
        showToast("Vision data submitted successfully.", "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error submitting Vision data.", "error");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Update only the specific field that changed
    updateDepartment('vision', { [field]: value });
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        {patientData.patientId ? (
          <>
            <div className="mb-4 text-gray-600">
              <p>Patient ID: {patientData.patientId}</p>
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
                    handleInputChange('re_vision', e.target.value);
                  }}
                />
                <FormControl variant="outlined" size="small" className="w-full sm:w-64">
                  <InputLabel>Color Blindness</InputLabel>
                  <Select
                    label="Color Blindness"
                    value={reColor}
                    onChange={(e) => {
                      handleInputChange('re_color_blindness', e.target.value as string);
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
                      handleInputChange('re_squint', e.target.value as string);
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
                    handleInputChange('le_vision', e.target.value);
                  }}
                />
                <FormControl variant="outlined" size="small" className="w-full sm:w-64">
                  <InputLabel>Color Blindness</InputLabel>
                  <Select
                    label="Color Blindness"
                    value={leColor}
                    onChange={(e) => {
                      handleInputChange('le_color_blindness', e.target.value as string);
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
                      handleInputChange('le_squint', e.target.value as string);
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
