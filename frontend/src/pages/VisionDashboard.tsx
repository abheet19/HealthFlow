import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PatientContext } from "../context/PatientContext";
import { useToast } from "../context/ToastContext";
import DashboardShell from "../components/DashboardShell";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";
import Field from "../components/Field";

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
    // Apply a field patch immediately: a pending debounce must not overwrite a save/reset.
    updateDepartment('vision', { [field]: value });
  };

  return (
    <DashboardShell title="Vision Examination Report" description="Right and left eye acuity, colour vision, and squint check.">
      <div className="hf-form-section">
        <h2>
          Right Eye
        </h2>
        <div className="hf-field-row">
          <Field
            label="Vision"
            value={reVision}
            onChange={(v) => {
              setReVision(v);
              handleInputChange('re_vision', v);
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

      <div className="hf-form-section">
        <h2>Left Eye</h2>
        <div className="hf-field-row">
          <Field
            label="Vision"
            value={leVision}
            onChange={(v) => {
              setLeVision(v);
              handleInputChange('le_vision', v);
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
