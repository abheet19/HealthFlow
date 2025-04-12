import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { useToast } from "../context/ToastContext";
import { getApiUrl } from "../config/api";  // Import the API URL helper

const ENTDashboard: React.FC = () => {
  const { showToast } = useToast();
  // Add entData state variable
  const [entData, setEntData] = useState<Record<string, string>>({});
  // Left Ear fields
  const [leftEarDeformity, setLeftEarDeformity] = useState("");
  const [leftEarWax, setLeftEarWax] = useState("");
  const [leftEarTympanic, setLeftEarTympanic] = useState("");
  const [leftEarDischarge, setLeftEarDischarge] = useState("");
  const [leftEarNormHearing, setLeftEarNormHearing] = useState("");
  // Right Ear fields
  const [rightEarDeformity, setRightEarDeformity] = useState("");
  const [rightEarWax, setRightEarWax] = useState("");
  const [rightEarTympanic, setRightEarTympanic] = useState("");
  const [rightEarDischarge, setRightEarDischarge] = useState("");
  const [rightEarNormHearing, setRightEarNormHearing] = useState("");
  // Nose fields
  const [leftNoseObstruction, setLeftNoseObstruction] = useState("");
  const [leftNoseDischarge, setLeftNoseDischarge] = useState("");
  const [rightNoseObstruction, setRightNoseObstruction] = useState("");
  const [rightNoseDischarge, setRightNoseDischarge] = useState("");
  // Throat & Neck fields
  const [throatPain, setThroatPain] = useState("");
  const [neckNodes, setNeckNodes] = useState("");
  const [tonsils, setTonsils] = useState("");

  const { updateDepartment, patientData, updatePatientId, resetPatientData } = useContext(PatientContext);
  const [manualPatientId, setManualPatientId] = useState("");
  const location = useLocation();

  // Read patientId from URL and update context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pid = params.get("patientId");
    if (pid && !patientData.patientId) {
      updatePatientId(pid);
    }
  }, [location, patientData.patientId, updatePatientId]);

  // Persist ENT form data across tab switches
  useEffect(() => {
    if (patientData.ent) {
      setLeftEarDeformity(patientData.ent.left_ear_deformity || "");
      setLeftEarWax(patientData.ent.left_ear_wax || "");
      setLeftEarTympanic(patientData.ent.left_ear_tympanic_membrane || "");
      setLeftEarDischarge(patientData.ent.left_ear_discharge || "");
      setLeftEarNormHearing(patientData.ent.left_ear_normal_hearing || "");
      setRightEarDeformity(patientData.ent.right_ear_deformity || "");
      setRightEarWax(patientData.ent.right_ear_wax || "");
      setRightEarTympanic(patientData.ent.right_ear_tympanic_membrane || "");
      setRightEarDischarge(patientData.ent.right_ear_discharge || "");
      setRightEarNormHearing(patientData.ent.right_ear_normal_hearing || "");
      setLeftNoseObstruction(patientData.ent.left_nose_obstruction || "");
      setLeftNoseDischarge(patientData.ent.left_nose_discharge || "");
      setRightNoseObstruction(patientData.ent.right_nose_obstruction || "");
      setRightNoseDischarge(patientData.ent.right_nose_discharge || "");
      setThroatPain(patientData.ent.throat_pain || "");
      setNeckNodes(patientData.ent.neck_nodes || "");
      setTonsils(patientData.ent.tonsils || "");
    }
  }, [patientData.ent]);

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

  // Dropdown helper with custom options parameter; default is ["Yes", "No"]
  const dropdown = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: string[] = ["Yes", "No"]
  ) => (
    <FormControl variant="outlined" size="small" className="w-full sm:w-64">
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value as string;
          setValue(newValue);
          
          // Map field name based on label to match backend field names
          let fieldName = '';
          switch (label) {
            // Left Ear
            case "Deformity": 
              fieldName = setValue === setLeftEarDeformity ? 'left_ear_deformity' : 'right_ear_deformity'; 
              break;
            case "Wax": 
              fieldName = setValue === setLeftEarWax ? 'left_ear_wax' : 'right_ear_wax'; 
              break;
            case "Tympanic Membrane": 
              fieldName = setValue === setLeftEarTympanic ? 'left_ear_tympanic_membrane' : 'right_ear_tympanic_membrane'; 
              break;
            case "Discharge": 
              fieldName = setValue === setLeftEarDischarge ? 'left_ear_discharge' : 'right_ear_discharge';
              break;
            case "Normal Hearing": 
              fieldName = setValue === setLeftEarNormHearing ? 'left_ear_normal_hearing' : 'right_ear_normal_hearing';
              break;
            // Nose
            case "Left Obstruction": fieldName = 'left_nose_obstruction'; break;
            case "Left Discharge": fieldName = 'left_nose_discharge'; break;
            case "Right Obstruction": fieldName = 'right_nose_obstruction'; break;
            case "Right Discharge": fieldName = 'right_nose_discharge'; break;
            // Throat & Neck
            case "Throat Pain": fieldName = 'throat_pain'; break;
            case "Neck Nodes": fieldName = 'neck_nodes'; break;
            case "Tonsils": fieldName = 'tonsils'; break;
            default: fieldName = label.toLowerCase().replace(' ', '_');
          }
          
          // Update in real-time
          handleInputChange(fieldName, newValue);
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const resetForm = () => {
    setLeftEarDeformity("");
    setLeftEarWax("");
    setLeftEarTympanic("");
    setLeftEarDischarge("");
    setLeftEarNormHearing("");
    setRightEarDeformity("");
    setRightEarWax("");
    setRightEarTympanic("");
    setRightEarDischarge("");
    setRightEarNormHearing("");
    setLeftNoseObstruction("");
    setLeftNoseDischarge("");
    setRightNoseObstruction("");
    setRightNoseDischarge("");
    setThroatPain("");
    setNeckNodes("");
    setTonsils("");
  };

  const handleInputChange = (field: string, value: string) => {
    // Debounce the context updates to prevent flickering
    if (typeof window.inputDebounceTimers === 'undefined') {
      window.inputDebounceTimers = {};
    }
    
    // Clear any existing timer for this field
    if (window.inputDebounceTimers[field]) {
      clearTimeout(window.inputDebounceTimers[field]);
    }
    
    // Set a new timer to update context after typing stops
    window.inputDebounceTimers[field] = setTimeout(() => {
      // Update only the specific field that changed
      updateDepartment('ent', { [field]: value });
    }, 300); // 300ms debounce delay - adjust if needed
  };

  const handleSubmit = () => {
    // Validate all required fields
    if (!leftEarDeformity || !leftEarWax || !leftEarTympanic || !leftEarDischarge || !leftEarNormHearing ||
        !rightEarDeformity || !rightEarWax || !rightEarTympanic || !rightEarDischarge || !rightEarNormHearing ||
        !leftNoseObstruction || !leftNoseDischarge || !rightNoseObstruction || !rightNoseDischarge ||
        !throatPain || !neckNodes || !tonsils) {
      // Show toast notification for validation errors
      showToast("Please fill all required fields.", "error");
      return;
    }
    
    // Create data object with all field values
    const data = {
      left_ear_deformity: leftEarDeformity,
      left_ear_wax: leftEarWax,
      left_ear_tympanic_membrane: leftEarTympanic,
      left_ear_discharge: leftEarDischarge,
      left_ear_normal_hearing: leftEarNormHearing,
      right_ear_deformity: rightEarDeformity,
      right_ear_wax: rightEarWax,
      right_ear_tympanic_membrane: rightEarTympanic,
      right_ear_discharge: rightEarDischarge,
      right_ear_normal_hearing: rightEarNormHearing,
      left_nose_obstruction: leftNoseObstruction, 
      left_nose_discharge: leftNoseDischarge,
      right_nose_obstruction: rightNoseObstruction,
      right_nose_discharge: rightNoseDischarge,
      throat_pain: throatPain,
      neck_nodes: neckNodes,
      tonsils: tonsils,
      isSubmitted: true // Add isSubmitted flag to mark this department as complete
    };
    
    // Update patient data in context
    updateDepartment("ent", data);
    // Show success notification
    showToast("ENT data saved successfully.", "success");
    resetForm();
  };

  const handleFinalSubmit = async () => {
    // ...validate ENT data...
    try {
      const res = await fetch(getApiUrl("/api/submit_ent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ /* ENT data */ })
      });
      const result = await res.json();
      if (result.message === "ENT info submitted successfully.") {
        showToast("ENT data submitted successfully.", "success");
        // ...other logic...
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error submitting ENT data.", "error");
    }
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
              ENT Examination Report
            </h1>
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Left Ear</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Deformity", leftEarDeformity, setLeftEarDeformity)}
                {dropdown("Wax", leftEarWax, setLeftEarWax)}
                {dropdown(
                  "Tympanic Membrane",
                  leftEarTympanic,
                  setLeftEarTympanic,
                  ["Seen", "Unseen"]
                )}
                {dropdown("Discharge", leftEarDischarge, setLeftEarDischarge)}
                {dropdown(
                  "Normal Hearing",
                  leftEarNormHearing,
                  setLeftEarNormHearing
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Right Ear
              </h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Deformity", rightEarDeformity, setRightEarDeformity)}
                {dropdown("Wax", rightEarWax, setRightEarWax)}
                {dropdown(
                  "Tympanic Membrane",
                  rightEarTympanic,
                  setRightEarTympanic,
                  ["Seen", "Unseen"]
                )}
                {dropdown("Discharge", rightEarDischarge, setRightEarDischarge)}
                {dropdown(
                  "Normal Hearing",
                  rightEarNormHearing,
                  setRightEarNormHearing
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Nose</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown(
                  "Left Obstruction",
                  leftNoseObstruction,
                  setLeftNoseObstruction
                )}
                {dropdown(
                  "Left Discharge",
                  leftNoseDischarge,
                  setLeftNoseDischarge
                )}
                {dropdown(
                  "Right Obstruction",
                  rightNoseObstruction,
                  setRightNoseObstruction
                )}
                {dropdown(
                  "Right Discharge",
                  rightNoseDischarge,
                  setRightNoseDischarge
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Throat & Neck
              </h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Throat Pain", throatPain, setThroatPain)}
                {dropdown("Neck Nodes", neckNodes, setNeckNodes, [
                  "Present",
                  "Absent",
                ])}
                {dropdown("Tonsils", tonsils, setTonsils, [
                  "Enlarged",
                  "Not Enlarged",
                ])}
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
              {!patientData.patientId 
                ? "Waiting for patient ID from IT Department..." 
                : "Waiting for patient information from IT Department..."}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ENTDashboard;
