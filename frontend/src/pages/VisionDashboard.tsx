import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TextField } from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { useToast } from "../context/ToastContext";
import DashboardShell from "../components/DashboardShell";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";

const VisionDashboard: React.FC = () => {
  const [reVision, setReVision] = useState("6/6");
  const [leVision, setLeVision] = useState("6/6");
  const [reColor, setReColor] = useState("");
  const [leColor, setLeColor] = useState("");
  const [reSquint, setReSquint] = useState("");
  const [leSquint, setLeSquint] = useState("");
  const [saving, setSaving] = useState(false);

  const { updateDepartment, patientData, updatePatientId } = useContext(PatientContext);
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

    setSaving(true);
    try {
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
    } catch {
      showToast("Error saving Vision data.", "error");
    } finally {
      setSaving(false);
    }
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
      updateDepartment('vision', { [field]: value });
    }, 300); // 300ms debounce delay - adjust if needed
  };

  return (
    <DashboardShell title="Vision Examination Report">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
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
              handleInputChange('re_vision', e.target.value);
            }}
          />
          <LabeledSelect
            label="Color Blindness"
            value={reColor}
            onChange={(v) => {
              setReColor(v);
              handleInputChange('re_color_blindness', v);
            }}
            options={["No", "YES"]}
          />
          <LabeledSelect
            label="Squint"
            value={reSquint}
            onChange={(v) => {
              setReSquint(v);
              handleInputChange('re_squint', v);
            }}
            options={["No", "YES"]}
          />
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">Left Eye</h2>
        <div className="flex flex-wrap gap-2">
          <TextField
            label="Vision"
            variant="outlined"
            size="small"
            className="w-full sm:w-64"
            value={leVision}
            onChange={(e) => {
              setLeVision(e.target.value);
              handleInputChange('le_vision', e.target.value);
            }}
          />
          <LabeledSelect
            label="Color Blindness"
            value={leColor}
            onChange={(v) => {
              setLeColor(v);
              handleInputChange('le_color_blindness', v);
            }}
            options={["No", "YES"]}
          />
          <LabeledSelect
            label="Squint"
            value={leSquint}
            onChange={(v) => {
              setLeSquint(v);
              handleInputChange('le_squint', v);
            }}
            options={["No", "YES"]}
          />
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <SubmitButton onClick={handleSubmit} loading={saving}>
          Save
        </SubmitButton>
      </div>
    </DashboardShell>
  );
};

export default VisionDashboard;
