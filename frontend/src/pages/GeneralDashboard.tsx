import * as React from "react";
import { useState, useContext, useEffect } from "react";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { getApiUrl } from "../config/api";  // Import the API URL helper

const GeneralDashboard: React.FC = () => {
  const { showToast } = useToast();
  // Add generalData state variable
  const [generalData, setGeneralData] = useState<Record<string, string>>({});
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

  // Modify the useEffect for BMI calculation to prevent infinite loops
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
            
            // Use a local variable to avoid reading from patientData.general which could cause infinite loops
            const updatedData = {
              height: height,
              weight: weight,
              bmi: calculatedBMI
            };
            
            // Only update in context - don't read back from context in this effect
            updateDepartment('general', { 
              ...patientData.general,
              ...updatedData
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
          ...patientData.general,
          height: height,
          weight: weight,
          bmi: "" 
        });
      }
    }
  }, [height, weight]); // Intentionally not including bmi or patientData.general in dependencies

  // Add reset event listener
  useEffect(() => {
    const handleGlobalReset = () => {
      console.log('General Dashboard received global reset signal');
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
    // Only update if the value has actually changed
    if (patientData.general && patientData.general[field] !== value) {
      // Update only the specific field that changed while preserving all general data
      updateDepartment('general', { 
        ...patientData.general, // Include ALL existing general data
        [field]: value 
      });
    }
  };

  const dropdown = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: string[]
  ) => (
    <FormControl variant="outlined" size="small" className="w-full sm:w-64">
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value as string;
          setValue(newValue);
          
          // Reset description fields when changing from Abnormality to No Abnormality
          if (label === "Nails" && newValue !== "Abnormality") {
            setNailsDesc("");
            handleInputChange('nails_desc', "");
          }
          if (label === "Hair" && newValue !== "Abnormality") {
            setHairDesc("");
            handleInputChange('hair_desc', "");
          }
          if (label === "Skin" && newValue !== "Abnormality") {
            setSkinDesc("");
            handleInputChange('skin_desc', "");
          }
          if (label === "Allergy" && newValue !== "YES") {
            setAllergyDesc("");
            handleInputChange('allergy_desc', "");
          }
          if (label === "Speech" && newValue !== "Abnormal") {
            setCnsSpeechDesc("");
            handleInputChange('cns_speech_desc', "");
          }
          
          // Map field name based on label to match backend field names
          let fieldName = '';
          switch (label) {
            case "Nails": fieldName = 'nails'; break;
            case "Hair": fieldName = 'hair'; break;
            case "Skin": fieldName = 'skin'; break;
            case "Anemia/Figure": fieldName = 'anemia_figure'; break;
            case "Allergy": fieldName = 'allergy'; break;
            case "Abdomen Soft": fieldName = 'abdomen_soft'; break;
            case "Abdomen Hard": fieldName = 'abdomen_hard'; break;
            case "Abdomen Distended": fieldName = 'abdomen_distended'; break;
            case "Bowel Sound": fieldName = 'abdomen_bowel_sound'; break;
            case "Conscious": fieldName = 'cns_conscious'; break;
            case "Oriented": fieldName = 'cns_oriented'; break;
            case "Playful": fieldName = 'cns_playful'; break;
            case "Active": fieldName = 'cns_active'; break;
            case "Alert": fieldName = 'cns_alert'; break;
            case "Speech": fieldName = 'cns_speech'; break;
            case "Medical": fieldName = 'past_medical'; break;
            case "Surgical": fieldName = 'past_surgical'; break;
            default: fieldName = label.toLowerCase();
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
    if (!bmi ||
        !bloodPressure ||
        !anemia ||
        !cyanosis ||
        !jaundice ||
        !clubbing ||
        !lymphNodes ||
        !oedema ||
        !skin ||
        !heartRate ||
        !respRate ||
        !icterus ||
        !pallorMuc) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    
    // Create data object with all field values
    const data = {
      bmi: bmi,
      blood_pressure: bloodPressure,
      anemia: anemia,
      cyanosis: cyanosis,
      jaundice: jaundice,
      clubbing: clubbing,
      lymph_nodes: lymphNodes,
      oedema: oedema,
      skin: skin,
      heart_rate: heartRate,
      respiratory_rate: respRate,
      icterus: icterus,
      pallor_mucous_membrane: pallorMuc,
      general_remarks: generalRemarks,
      isSubmitted: true // Add isSubmitted flag to mark this department as complete
    };
    
    // Update patient data in context
    updateDepartment("general", data);
    showToast("General examination data saved successfully.", "success");
    resetForm();
  };

  const handleFinalSubmit = async () => {
    try {
      const res = await fetch(getApiUrl("/api/submit_general"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ /* General data */ })
      });
      const result = await res.json();
      if (result.message === "General info submitted successfully.") {
        showToast("General data submitted successfully.", "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error submitting General data.", "error");
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
              General Examination Report
            </h1>
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
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

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                General Cleanliness
              </h2>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                {dropdown("Nails", nails, setNails, [
                  "No Abnormality",
                  "Abnormality",
                ])}
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
                {dropdown("Hair", hair, setHair, ["No Abnormality", "Abnormality"])}
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
                {dropdown("Skin", skin, setSkin, ["No Abnormality", "Abnormality"])}
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

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Figure, Allergy & Abdomen</h2>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                {dropdown("Anemia/Figure", anemiaFigure, setAnemiaFigure, [
                  "No",
                  "Yes",
                ])}
                {dropdown("Abdomen Soft", abdomenSoft, setAbdomenSoft, [
                  "Yes",
                  "No",
                ])}
                {dropdown("Abdomen Hard", abdomenHard, setAbdomenHard, [
                  "Yes",
                  "No",
                ])}
                {dropdown(
                  "Abdomen Distended",
                  abdomenDistended,
                  setAbdomenDistended,
                  ["Yes", "No"]
                )}
                {dropdown("Bowel Sound", abdomenBowel, setAbdomenBowel, [
                  "Present",
                  "Absent",
                ])}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {dropdown("Allergy", allergy, setAllergy, ["No", "YES"])}
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

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Central Nervous System</h2>
              <div className="flex flex-wrap items-center gap-4 mb-2">
                {dropdown("Conscious", cnsConscious, setCnsConscious, [
                  "Yes",
                  "No",
                ])}
                {dropdown("Oriented", cnsOriented, setCnsOriented, [
                  "Yes",
                  "No",
                ])}
                {dropdown("Playful", cnsPlayful, setCnsPlayful, ["Yes", "No"])}
                {dropdown("Active", cnsActive, setCnsActive, ["Yes", "No"])}
                {dropdown("Alert", cnsAlert, setCnsAlert, ["Yes", "No"])}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {dropdown("Speech", cnsSpeech, setCnsSpeech, [
                  "Normal",
                  "Abnormal",
                ])}
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

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Past History</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Medical", pastMedical, setPastMedical, ["Yes", "No", "Not Known"])}
                {dropdown("Surgical", pastSurgical, setPastSurgical, ["Yes", "No", "Not Known"])}
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4">Vitals Examination Report</h1>

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Vital Signs</h2>
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
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
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
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
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

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Circumferences</h2>
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
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
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
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
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

export default GeneralDashboard;
