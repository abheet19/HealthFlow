import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { TextField } from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import DashboardShell from "../components/DashboardShell";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";

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

  // Function to get the color scheme for BMI category badge
  const getBMICategoryStyle = (bmiValue: string): { bg: string, text: string } => {
    if (!bmiValue) return { bg: "bg-gray-100", text: "text-gray-800" };

    const bmiNum = parseFloat(bmiValue);

    if (bmiNum < 18.5) return { bg: "bg-blue-100", text: "text-blue-800" }; // Underweight - blue
    if (bmiNum < 25) return { bg: "bg-green-100", text: "text-green-800" }; // Normal weight - green
    if (bmiNum < 30) return { bg: "bg-yellow-100", text: "text-yellow-800" }; // Overweight - yellow
    if (bmiNum < 35) return { bg: "bg-orange-100", text: "text-orange-800" }; // Obesity Class I - orange
    if (bmiNum < 40) return { bg: "bg-red-100", text: "text-red-800" }; // Obesity Class II - light red
    return { bg: "bg-red-200", text: "text-red-900" }; // Obesity Class III - darker red
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
    <DashboardShell title="General Examination Report">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
          Body Measurements
        </h2>
        <div className="flex flex-wrap gap-4">
          <TextField
            label="Height (cm)"
            variant="outlined"
            size="small"
            className="w-full sm:w-64"
            value={height}
            onChange={(e) => {
              setHeight(e.target.value);
              handleInputChange('height', e.target.value);
            }}
            placeholder="Enter height in cm"
          />
          <TextField
            label="Weight (kg)"
            variant="outlined"
            size="small"
            className="w-full sm:w-64"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              handleInputChange('weight', e.target.value);
            }}
            placeholder="Enter weight in kg"
          />
          <div className="w-full sm:w-64 relative">
            <TextField
              label="BMI"
              variant="outlined"
              size="small"
              fullWidth
              value={bmi}
              InputProps={{
                readOnly: true,
                endAdornment: bmi ? (
                  <span className={`px-3 py-0.5 rounded ml-1 min-w-[120px] text-center font-medium text-xs ${getBMICategoryStyle(bmi).bg} ${getBMICategoryStyle(bmi).text}`}>
                    {getBMICategory(bmi)}
                  </span>
                ) : null,
              }}
              helperText="Automatically calculated"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
          General Cleanliness
        </h2>
        <div className="flex flex-wrap items-center gap-4 mb-2">
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
            <TextField
              label="Nails Abnormality Description"
              variant="outlined"
              size="small"
              className="flex-1 min-w-[300px]"
              value={nailsDesc}
              onChange={(e) => {
                setNailsDesc(e.target.value);
                handleInputChange('nails_desc', e.target.value);
              }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-2">
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
            <TextField
              label="Hair Abnormality Description"
              variant="outlined"
              size="small"
              className="flex-1 min-w-[300px]"
              value={hairDesc}
              onChange={(e) => {
                setHairDesc(e.target.value);
                handleInputChange('hair_desc', e.target.value);
              }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
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
            <TextField
              label="Skin Abnormality Description"
              variant="outlined"
              size="small"
              className="flex-1 min-w-[300px]"
              value={skinDesc}
              onChange={(e) => {
                setSkinDesc(e.target.value);
                handleInputChange('skin_desc', e.target.value);
              }}
            />
          )}
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-4">
        <h2 className="text-xl font-semibold mb-2 text-text">Figure, Allergy & Abdomen</h2>
        <div className="flex flex-wrap items-center gap-4 mb-2">
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
        <div className="flex flex-wrap items-center gap-4">
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
            <TextField
              label="Allergy Description"
              variant="outlined"
              size="small"
              className="flex-1 min-w-[300px]"
              value={allergyDesc}
              onChange={(e) => {
                setAllergyDesc(e.target.value);
                handleInputChange('allergy_desc', e.target.value);
              }}
            />
          )}
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-4">
        <h2 className="text-xl font-semibold mb-2 text-text">Central Nervous System</h2>
        <div className="flex flex-wrap items-center gap-4 mb-2">
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
        <div className="flex flex-wrap items-center gap-4">
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
            <TextField
              label="Speech Abnormality Description"
              variant="outlined"
              size="small"
              className="flex-1 min-w-[300px]"
              value={cnsSpeechDesc}
              onChange={(e) => {
                setCnsSpeechDesc(e.target.value);
                handleInputChange('cns_speech_desc', e.target.value);
              }}
            />
          )}
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-4">
        <h2 className="text-xl font-semibold mb-2 text-text">Past History</h2>
        <div className="flex flex-wrap gap-2">
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

      <h2 className="text-2xl font-bold mb-4 text-text">Vitals Examination Report</h2>

      <div className="border-b border-glass-border pb-4 mb-4">
        <h2 className="text-xl font-semibold mb-2 text-text">Vital Signs</h2>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-64 relative">
            <TextField
              label="BP"
              variant="outlined"
              size="small"
              fullWidth
              value={bp}
              onChange={(e) => {
                setBp(e.target.value);
                handleInputChange('bp', e.target.value);
              }}
            />
            <button
              type="button"
              aria-label="Set BP to not applicable"
              aria-pressed={bp === "NA"}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-glass-border rounded hover:bg-white/10 text-text-dim"
              onClick={() => {
                const newValue = bp === "NA" ? "" : "NA";
                setBp(newValue);
                handleInputChange('bp', newValue);
              }}
            >
              NA
            </button>
          </div>
          <div className="w-full sm:w-64 relative">
            <TextField
              label="Pulse"
              variant="outlined"
              size="small"
              fullWidth
              value={pulse}
              onChange={(e) => {
                setPulse(e.target.value);
                handleInputChange('pulse', e.target.value);
              }}
            />
            <button
              type="button"
              aria-label="Set pulse to not applicable"
              aria-pressed={pulse === "NA"}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-glass-border rounded hover:bg-white/10 text-text-dim"
              onClick={() => {
                const newValue = pulse === "NA" ? "" : "NA";
                setPulse(newValue);
                handleInputChange('pulse', newValue);
              }}
            >
              NA
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-glass-border pb-4 mb-4">
        <h2 className="text-xl font-semibold mb-2 text-text">Circumferences</h2>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-64 relative">
            <TextField
              label="Hip"
              variant="outlined"
              size="small"
              fullWidth
              value={hip}
              onChange={(e) => {
                setHip(e.target.value);
                handleInputChange('hip', e.target.value);
              }}
            />
            <button
              type="button"
              aria-label="Set hip circumference to not applicable"
              aria-pressed={hip === "NA"}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-glass-border rounded hover:bg-white/10 text-text-dim"
              onClick={() => {
                const newValue = hip === "NA" ? "" : "NA";
                setHip(newValue);
                handleInputChange('hip', newValue);
              }}
            >
              NA
            </button>
          </div>
          <div className="w-full sm:w-64 relative">
            <TextField
              label="Waist"
              variant="outlined"
              size="small"
              fullWidth
              value={waist}
              onChange={(e) => {
                setWaist(e.target.value);
                handleInputChange('waist', e.target.value);
              }}
            />
            <button
              type="button"
              aria-label="Set waist circumference to not applicable"
              aria-pressed={waist === "NA"}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-glass-border rounded hover:bg-white/10 text-text-dim"
              onClick={() => {
                const newValue = waist === "NA" ? "" : "NA";
                setWaist(newValue);
                handleInputChange('waist', newValue);
              }}
            >
              NA
            </button>
          </div>
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
