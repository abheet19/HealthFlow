import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { PatientContext } from "../context/PatientContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import DashboardShell from "../components/DashboardShell";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";
import Field from "../components/Field";

const GeneralDashboard: React.FC = () => {
  const { showToast } = useToast();
  // Body Measurements
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  // Appearance
  const [nails, setNails] = useState("");
  const [nailsDesc, setNailsDesc] = useState(""); // Abnormality description
  const [hair, setHair] = useState("");
  const [hairDesc, setHairDesc] = useState(""); // Abnormality description
  const [skin, setSkin] = useState("");
  const [skinDesc, setSkinDesc] = useState(""); // Abnormality description
  // Anemia/Figure & Allergy
  const [anemiaFigure, setAnemiaFigure] = useState("");
  const [allergy, setAllergy] = useState("");
  const [allergyDesc, setAllergyDesc] = useState(""); // Abnormality description for YES
  // Abdomen
  const [abdomenSoft, setAbdomenSoft] = useState("");
  const [abdomenHard, setAbdomenHard] = useState("");
  const [abdomenDistended, setAbdomenDistended] = useState("");
  const [abdomenBowel, setAbdomenBowel] = useState("");
  // CNS fields
  const [cnsConscious, setCnsConscious] = useState("");
  const [cnsOriented, setCnsOriented] = useState("");
  const [cnsPlayful, setCnsPlayful] = useState("");
  const [cnsActive, setCnsActive] = useState("");
  const [cnsAlert, setCnsAlert] = useState("");
  const [cnsSpeech, setCnsSpeech] = useState("");
  const [cnsSpeechDesc, setCnsSpeechDesc] = useState(""); // Speech abnormality description
  // Vital signs & Circumferences
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [hip, setHip] = useState("");
  const [waist, setWaist] = useState("");
  // Past History
  const [pastMedical, setPastMedical] = useState("");
  const [pastSurgical, setPastSurgical] = useState("");
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

  // Persist General form data across tab switches
  useEffect(() => {
    if (patientData.general) {
      setHeight(patientData.general.height || "");
      setWeight(patientData.general.weight || "");
      setBmi(patientData.general.bmi || "");
      setNails(patientData.general.nails || "");
      setNailsDesc(patientData.general.nails_desc || "");
      setHair(patientData.general.hair || "");
      setHairDesc(patientData.general.hair_desc || "");
      setSkin(patientData.general.skin || "");
      setSkinDesc(patientData.general.skin_desc || "");
      setAnemiaFigure(patientData.general.anemia_figure || "");
      setAllergy(patientData.general.allergy || "");
      setAllergyDesc(patientData.general.allergy_desc || "");
      setAbdomenSoft(patientData.general.abdomen_soft || "");
      setAbdomenHard(patientData.general.abdomen_hard || "");
      setAbdomenDistended(patientData.general.abdomen_distended || "");
      setAbdomenBowel(patientData.general.abdomen_bowel_sound || "");
      setCnsConscious(patientData.general.cns_conscious || "");
      setCnsOriented(patientData.general.cns_oriented || "");
      setCnsPlayful(patientData.general.cns_playful || "");
      setCnsActive(patientData.general.cns_active || "");
      setCnsAlert(patientData.general.cns_alert || "");
      setCnsSpeech(patientData.general.cns_speech || "");
      setCnsSpeechDesc(patientData.general.cns_speech_desc || "");
      setPastMedical(patientData.general.past_medical || "");
      setPastSurgical(patientData.general.past_surgical || "");
      setBp(patientData.general.bp || "");
      setPulse(patientData.general.pulse || "");
      setHip(patientData.general.hip || "");
      setWaist(patientData.general.waist || "");
    }
  }, [patientData.general]);

  // Add new effect to reset form when patientId is cleared
  useEffect(() => {
    if (!patientData.patientId) {
      resetForm();
    }
  }, [patientData.patientId]);

  // Modify the useEffect for BMI calculation to prevent infinite loops.
  // Intentionally depends only on height/weight - reading bmi or
  // patientData.general back in here would re-trigger this effect on its
  // own write and loop.
  useEffect(() => {
    if (height && weight) {
      try {
        // Convert height from cm to meters
        const heightInMeters = parseFloat(height) / 100;
        const weightInKg = parseFloat(weight);

        if (heightInMeters > 0 && weightInKg > 0) {
          // BMI formula: weight (kg) / (height (m))²
          const calculatedBMI = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);

          // Only update BMI if it has actually changed
          if (calculatedBMI !== bmi) {
            setBmi(calculatedBMI);

            // Only update in context - don't read back from context in this effect
            updateDepartment('general', {
              height,
              weight,
              bmi: calculatedBMI
            });
          }
        }
      } catch (error) {
        console.error("Error calculating BMI:", error);
      }
    } else {
      // Reset BMI when either height or weight is cleared, but only if BMI is not already empty
      if (bmi !== "") {
        setBmi("");

        // Only update the necessary fields without reading back from context
        updateDepartment('general', {
          height,
          weight,
          bmi: ""
        });
      }
    }
    // Deliberately excludes bmi/patientData.general/updateDepartment: this
    // effect *writes* bmi and patientData.general, so depending on them
    // would re-trigger it on its own write and loop (see comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, weight]);

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

  // Function to determine BMI category
  const getBMICategory = (bmiValue: string): string => {
    if (!bmiValue) return "";

    const bmiNum = parseFloat(bmiValue);

    if (bmiNum < 18.5) return "Underweight";
    if (bmiNum < 25) return "Normal weight";
    if (bmiNum < 30) return "Overweight";
    if (bmiNum < 35) return "Obesity Class I";
    if (bmiNum < 40) return "Obesity Class II";
    return "Obesity Class III";
  };

  // BMI category badge tone, mapped onto the shared glass tokens (cyan /
  // good / amber / critical) via the .hf-bmi-chip modifier classes rather
  // than the off-theme Tailwind pastel palette the mockup never uses.
  const getBMICategoryTone = (bmiValue: string): string => {
    if (!bmiValue) return "tone-muted";
    const bmiNum = parseFloat(bmiValue);
    if (bmiNum < 18.5) return "tone-cyan"; // Underweight
    if (bmiNum < 25) return "tone-good"; // Normal weight
    if (bmiNum < 30) return "tone-amber"; // Overweight
    if (bmiNum < 35) return "tone-amber"; // Obesity Class I
    return "tone-critical"; // Obesity Class II / III
  };

  // Modify the handleInputChange function to prevent updates when values haven't changed
  const handleInputChange = (field: string, value: string) => {
    // Apply a field patch immediately: a pending debounce must not overwrite a save/reset.
    updateDepartment('general', { [field]: value });
  };

  const resetForm = () => {
    setHeight("");
    setWeight("");
    setBmi("");
    setNails("");
    setNailsDesc(""); // Reset nails description
    setHair("");
    setHairDesc(""); // Reset hair description
    setSkin("");
    setSkinDesc(""); // Reset skin description
    setAnemiaFigure("");
    setAllergy("");
    setAllergyDesc(""); // Reset allergy description
    setAbdomenSoft("");
    setAbdomenHard("");
    setAbdomenDistended("");
    setAbdomenBowel("");
    setCnsConscious("");
    setCnsOriented("");
    setCnsPlayful("");
    setCnsActive("");
    setCnsAlert("");
    setCnsSpeech("");
    setCnsSpeechDesc(""); // Reset speech description
    setPastMedical("");
    setPastSurgical("");
    setBp("");
    setPulse("");
    setHip("");
    setWaist("");
  };

  const handleSubmit = () => {
    // Validate all required fields
    if (!bmi || !bp || !pulse || !hip || !waist) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setSaving(true);
    try {
      // Create data object with all field values
      const data = {
        bmi,
        bp,
        pulse,
        hip,
        waist,
        isSubmitted: true // Add isSubmitted flag to mark this department as complete
      };

      // Update patient data in context
      updateDepartment("general", data);
      showToast("General examination data saved successfully.", "success");
      resetForm();
    } catch {
      showToast("Error saving General data.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="General Examination Report" description="Body measurements, systemic exam, past history and vitals.">
      <div className="hf-form-section">
        <h2>
          Body Measurements
        </h2>
        <div className="hf-field-row">
          <Field
            label="Height (cm)"
            value={height}
            onChange={(v) => {
              setHeight(v);
              handleInputChange('height', v);
            }}
            placeholder="Enter height in cm"
          />
          <Field
            label="Weight (kg)"
            value={weight}
            onChange={(v) => {
              setWeight(v);
              handleInputChange('weight', v);
            }}
            placeholder="Enter weight in kg"
          />
          <Field
            label="BMI"
            value={bmi}
            readOnly
            hint="Automatically calculated"
            endAdornment={
              bmi ? (
                <span className={`hf-bmi-chip ${getBMICategoryTone(bmi)}`}>
                  {getBMICategory(bmi)}
                </span>
              ) : null
            }
          />
        </div>
      </div>

      <div className="hf-form-section">
        <h2>
          General Cleanliness
        </h2>
        <div className="hf-field-row mb-3">
          <LabeledSelect
            label="Nails"
            value={nails}
            onChange={(v) => {
              setNails(v);
              handleInputChange('nails', v);
              if (v !== "Abnormality") {
                setNailsDesc("");
                handleInputChange('nails_desc', "");
              }
            }}
            options={["No Abnormality", "Abnormality"]}
          />
          {nails === "Abnormality" && (
            <Field
              label="Nails Abnormality Description"
              wide
              value={nailsDesc}
              onChange={(v) => {
                setNailsDesc(v);
                handleInputChange('nails_desc', v);
              }}
            />
          )}
        </div>
        <div className="hf-field-row mb-3">
          <LabeledSelect
            label="Hair"
            value={hair}
            onChange={(v) => {
              setHair(v);
              handleInputChange('hair', v);
              if (v !== "Abnormality") {
                setHairDesc("");
                handleInputChange('hair_desc', "");
              }
            }}
            options={["No Abnormality", "Abnormality"]}
          />
          {hair === "Abnormality" && (
            <Field
              label="Hair Abnormality Description"
              wide
              value={hairDesc}
              onChange={(v) => {
                setHairDesc(v);
                handleInputChange('hair_desc', v);
              }}
            />
          )}
        </div>
        <div className="hf-field-row">
          <LabeledSelect
            label="Skin"
            value={skin}
            onChange={(v) => {
              setSkin(v);
              handleInputChange('skin', v);
              if (v !== "Abnormality") {
                setSkinDesc("");
                handleInputChange('skin_desc', "");
              }
            }}
            options={["No Abnormality", "Abnormality"]}
          />
          {skin === "Abnormality" && (
            <Field
              label="Skin Abnormality Description"
              wide
              value={skinDesc}
              onChange={(v) => {
                setSkinDesc(v);
                handleInputChange('skin_desc', v);
              }}
            />
          )}
        </div>
      </div>

      <div className="hf-form-section">
        <h2>Figure, Allergy & Abdomen</h2>
        <div className="hf-field-row mb-3">
          <LabeledSelect
            label="Anemia/Figure"
            value={anemiaFigure}
            onChange={(v) => {
              setAnemiaFigure(v);
              handleInputChange('anemia_figure', v);
            }}
            options={["No", "Yes"]}
          />
          <LabeledSelect
            label="Abdomen Soft"
            value={abdomenSoft}
            onChange={(v) => {
              setAbdomenSoft(v);
              handleInputChange('abdomen_soft', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Abdomen Hard"
            value={abdomenHard}
            onChange={(v) => {
              setAbdomenHard(v);
              handleInputChange('abdomen_hard', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Abdomen Distended"
            value={abdomenDistended}
            onChange={(v) => {
              setAbdomenDistended(v);
              handleInputChange('abdomen_distended', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Bowel Sound"
            value={abdomenBowel}
            onChange={(v) => {
              setAbdomenBowel(v);
              handleInputChange('abdomen_bowel_sound', v);
            }}
            options={["Present", "Absent"]}
          />
        </div>
        <div className="hf-field-row">
          <LabeledSelect
            label="Allergy"
            value={allergy}
            onChange={(v) => {
              setAllergy(v);
              handleInputChange('allergy', v);
              if (v !== "YES") {
                setAllergyDesc("");
                handleInputChange('allergy_desc', "");
              }
            }}
            options={["No", "YES"]}
          />
          {allergy === "YES" && (
            <Field
              label="Allergy Description"
              wide
              value={allergyDesc}
              onChange={(v) => {
                setAllergyDesc(v);
                handleInputChange('allergy_desc', v);
              }}
            />
          )}
        </div>
      </div>

      <div className="hf-form-section">
        <h2>Central Nervous System</h2>
        <div className="hf-field-row mb-3">
          <LabeledSelect
            label="Conscious"
            value={cnsConscious}
            onChange={(v) => {
              setCnsConscious(v);
              handleInputChange('cns_conscious', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Oriented"
            value={cnsOriented}
            onChange={(v) => {
              setCnsOriented(v);
              handleInputChange('cns_oriented', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Playful"
            value={cnsPlayful}
            onChange={(v) => {
              setCnsPlayful(v);
              handleInputChange('cns_playful', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Active"
            value={cnsActive}
            onChange={(v) => {
              setCnsActive(v);
              handleInputChange('cns_active', v);
            }}
            options={["Yes", "No"]}
          />
          <LabeledSelect
            label="Alert"
            value={cnsAlert}
            onChange={(v) => {
              setCnsAlert(v);
              handleInputChange('cns_alert', v);
            }}
            options={["Yes", "No"]}
          />
        </div>
        <div className="hf-field-row">
          <LabeledSelect
            label="Speech"
            value={cnsSpeech}
            onChange={(v) => {
              setCnsSpeech(v);
              handleInputChange('cns_speech', v);
              if (v !== "Abnormal") {
                setCnsSpeechDesc("");
                handleInputChange('cns_speech_desc', "");
              }
            }}
            options={["Normal", "Abnormal"]}
          />
          {cnsSpeech === "Abnormal" && (
            <Field
              label="Speech Abnormality Description"
              wide
              value={cnsSpeechDesc}
              onChange={(v) => {
                setCnsSpeechDesc(v);
                handleInputChange('cns_speech_desc', v);
              }}
            />
          )}
        </div>
      </div>

      <div className="hf-form-section">
        <h2>Past History</h2>
        <div className="hf-field-row">
          <LabeledSelect
            label="Medical"
            value={pastMedical}
            onChange={(v) => {
              setPastMedical(v);
              handleInputChange('past_medical', v);
            }}
            options={["Yes", "No", "Not Known"]}
          />
          <LabeledSelect
            label="Surgical"
            value={pastSurgical}
            onChange={(v) => {
              setPastSurgical(v);
              handleInputChange('past_surgical', v);
            }}
            options={["Yes", "No", "Not Known"]}
          />
        </div>
      </div>

      <h2 className="hf-subhead">Vitals Examination Report</h2>

      <div className="hf-form-section">
        <h2>Vital Signs</h2>
        <div className="hf-field-row">
          <Field
            label="BP"
            value={bp}
            onChange={(v) => {
              setBp(v);
              handleInputChange('bp', v);
            }}
            na
            naActive={bp === "NA"}
            onToggleNa={() => {
              const newValue = bp === "NA" ? "" : "NA";
              setBp(newValue);
              handleInputChange('bp', newValue);
            }}
          />
          <Field
            label="Pulse"
            value={pulse}
            onChange={(v) => {
              setPulse(v);
              handleInputChange('pulse', v);
            }}
            na
            naActive={pulse === "NA"}
            onToggleNa={() => {
              const newValue = pulse === "NA" ? "" : "NA";
              setPulse(newValue);
              handleInputChange('pulse', newValue);
            }}
          />
        </div>
      </div>

      <div className="hf-form-section">
        <h2>Circumferences</h2>
        <div className="hf-field-row">
          <Field
            label="Hip"
            value={hip}
            onChange={(v) => {
              setHip(v);
              handleInputChange('hip', v);
            }}
            na
            naActive={hip === "NA"}
            onToggleNa={() => {
              const newValue = hip === "NA" ? "" : "NA";
              setHip(newValue);
              handleInputChange('hip', newValue);
            }}
          />
          <Field
            label="Waist"
            value={waist}
            onChange={(v) => {
              setWaist(v);
              handleInputChange('waist', v);
            }}
            na
            naActive={waist === "NA"}
            onToggleNa={() => {
              const newValue = waist === "NA" ? "" : "NA";
              setWaist(newValue);
              handleInputChange('waist', newValue);
            }}
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

export default GeneralDashboard;
