import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PatientContext } from "../context/PatientContext";
import { useToast } from "../context/ToastContext";
import DashboardShell from "../components/DashboardShell";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";

const ENTDashboard: React.FC = () => {
  const { showToast } = useToast();
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
  const [saving, setSaving] = useState(false);

  const { updateDepartment, patientData, updatePatientId } = useContext(PatientContext);
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

    setSaving(true);
    try {
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
    } catch {
      showToast("Error saving ENT data.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="ENT Examination Report">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">Left Ear</h2>
        <div className="flex flex-wrap gap-2">
          <LabeledSelect
            label="Deformity"
            value={leftEarDeformity}
            onChange={(v) => {
              setLeftEarDeformity(v);
              handleInputChange('left_ear_deformity', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Wax"
            value={leftEarWax}
            onChange={(v) => {
              setLeftEarWax(v);
              handleInputChange('left_ear_wax', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Tympanic Membrane"
            value={leftEarTympanic}
            onChange={(v) => {
              setLeftEarTympanic(v);
              handleInputChange('left_ear_tympanic_membrane', v);
            }}
            options={["Seen", "Unseen"]}
          />
          <LabeledSelect
            label="Discharge"
            value={leftEarDischarge}
            onChange={(v) => {
              setLeftEarDischarge(v);
              handleInputChange('left_ear_discharge', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Normal Hearing"
            value={leftEarNormHearing}
            onChange={(v) => {
              setLeftEarNormHearing(v);
              handleInputChange('left_ear_normal_hearing', v);
            }}
            options={["Yes", "No"]}
          />
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
          Right Ear
        </h2>
        <div className="flex flex-wrap gap-2">
          <LabeledSelect
            label="Deformity"
            value={rightEarDeformity}
            onChange={(v) => {
              setRightEarDeformity(v);
              handleInputChange('right_ear_deformity', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Wax"
            value={rightEarWax}
            onChange={(v) => {
              setRightEarWax(v);
              handleInputChange('right_ear_wax', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Tympanic Membrane"
            value={rightEarTympanic}
            onChange={(v) => {
              setRightEarTympanic(v);
              handleInputChange('right_ear_tympanic_membrane', v);
            }}
            options={["Seen", "Unseen"]}
          />
          <LabeledSelect
            label="Discharge"
            value={rightEarDischarge}
            onChange={(v) => {
              setRightEarDischarge(v);
              handleInputChange('right_ear_discharge', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Normal Hearing"
            value={rightEarNormHearing}
            onChange={(v) => {
              setRightEarNormHearing(v);
              handleInputChange('right_ear_normal_hearing', v);
            }}
            options={["Yes", "No"]}
          />
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">Nose</h2>
        <div className="flex flex-wrap gap-2">
          <LabeledSelect
            label="Left Obstruction"
            value={leftNoseObstruction}
            onChange={(v) => {
              setLeftNoseObstruction(v);
              handleInputChange('left_nose_obstruction', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Left Discharge"
            value={leftNoseDischarge}
            onChange={(v) => {
              setLeftNoseDischarge(v);
              handleInputChange('left_nose_discharge', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Right Obstruction"
            value={rightNoseObstruction}
            onChange={(v) => {
              setRightNoseObstruction(v);
              handleInputChange('right_nose_obstruction', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Right Discharge"
            value={rightNoseDischarge}
            onChange={(v) => {
              setRightNoseDischarge(v);
              handleInputChange('right_nose_discharge', v);
            }}
            options={["Yes", "No"]}
          />
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
          Throat & Neck
        </h2>
        <div className="flex flex-wrap gap-2">
          <LabeledSelect
            label="Throat Pain"
            value={throatPain}
            onChange={(v) => {
              setThroatPain(v);
              handleInputChange('throat_pain', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Neck Nodes"
            value={neckNodes}
            onChange={(v) => {
              setNeckNodes(v);
              handleInputChange('neck_nodes', v);
            }}
            options={["Present", "Absent"]}
          />
          <LabeledSelect
            label="Tonsils"
            value={tonsils}
            onChange={(v) => {
              setTonsils(v);
              handleInputChange('tonsils', v);
            }}
            options={["Enlarged", "Not Enlarged"]}
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

export default ENTDashboard;
