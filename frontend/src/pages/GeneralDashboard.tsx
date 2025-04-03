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
  // Body Measurements
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  // Appearance
  const [nails, setNails] = useState("");
  const [hair, setHair] = useState("");
  const [skin, setSkin] = useState("");
  // Anemia/Figure & Allergy
  const [anemiaFigure, setAnemiaFigure] = useState("");
  const [allergy, setAllergy] = useState("");
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
      setHair(patientData.general.hair || "");
      setSkin(patientData.general.skin || "");
      setAnemiaFigure(patientData.general.anemia_figure || "");
      setAllergy(patientData.general.allergy || "");
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
        onChange={(e) => setValue(e.target.value as string)}
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
    setHair("");
    setSkin("");
    setAnemiaFigure("");
    setAllergy("");
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
    setPastMedical("");
    setPastSurgical("");
    setBp("");
    setPulse("");
    setHip("");
    setWaist("");
  };

  const handleSubmit = async () => {
    if (
      !height ||
      !weight ||
      !bmi ||
      !nails ||
      !hair ||
      !skin ||
      !anemiaFigure ||
      !allergy ||
      !abdomenSoft ||
      !abdomenHard ||
      !abdomenDistended ||
      !abdomenBowel ||
      !cnsConscious ||
      !cnsOriented ||
      !cnsPlayful ||
      !cnsActive ||
      !cnsAlert ||
      !cnsSpeech ||
      !pastMedical ||
      !pastSurgical ||
      !bp ||
      !pulse ||
      !hip ||
      !waist
    ) {
      // Replace alert with toast notification
      showToast("Please fill all fields.", "error");
      return;
    }
    const data = {
      height,
      weight,
      bmi,
      nails,
      hair,
      skin,
      anemia_figure: anemiaFigure,
      allergy,
      abdomen_soft: abdomenSoft,
      abdomen_hard: abdomenHard,
      abdomen_distended: abdomenDistended,
      abdomen_bowel_sound: abdomenBowel,
      cns_conscious: cnsConscious,
      cns_oriented: cnsOriented,
      cns_playful: cnsPlayful,
      cns_active: cnsActive,
      cns_alert: cnsAlert,
      cns_speech: cnsSpeech,
      past_medical: pastMedical,
      past_surgical: pastSurgical,
      bp,
      pulse,
      hip,
      waist,
    };
    updateDepartment("general", data);
    // Replace alert with toast notification
    showToast("General data saved successfully.", "success");
    resetForm();
    resetPatientData("general"); // Specify department
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
              <p>Patient Number: <span className="font-bold">{patientData.patientId}</span></p>
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
                  label="Height"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setHeight(e.target.value)}
                />
                <TextField
                  label="Weight"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setWeight(e.target.value)}
                />
                <TextField
                  label="BMI"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setBmi(e.target.value)}
                />
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                General Cleanliness
              </h2>
              <div className="flex flex-wrap gap-4">
                {dropdown("Nails", nails, setNails, [
                  "No Abnormality",
                  "Abnormality",
                ])}
                {dropdown("Hair", hair, setHair, ["No Abnormality", "Abnormality"])}
                {dropdown("Skin", skin, setSkin, ["No Abnormality", "Abnormality"])}
              </div>
            </div>

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Figure, Allergy & Abdomen</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Anemia/Figure", anemiaFigure, setAnemiaFigure, [
                  "No Abnormality",
                  "Abnormality",
                ])}
                {dropdown("Allergy", allergy, setAllergy, ["No", "YES"])}
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
                  "Yes",
                  "No",
                ])}
              </div>
            </div>

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Central Nervous System</h2>
              <div className="flex flex-wrap gap-2">
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
                {dropdown("Speech", cnsSpeech, setCnsSpeech, [
                  "Normal",
                  "Abnormal",
                ])}
              </div>
            </div>

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Past History</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Medical", pastMedical, setPastMedical, ["Yes", "No"])}
                {dropdown("Surgical", pastSurgical, setPastSurgical, ["Yes", "No"])}
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4">Vitals Examination Report</h1>

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Vital Signs</h2>
              <div className="flex flex-wrap gap-4">
                <TextField
                  label="BP"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setBp(e.target.value)}
                />
                <TextField
                  label="Pulse"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setPulse(e.target.value)}
                />
              </div>
            </div>

            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Circumferences</h2>
              <div className="flex flex-wrap gap-4">
                <TextField
                  label="Hip"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setHip(e.target.value)}
                />
                <TextField
                  label="Waist"
                  variant="outlined"
                  size="small"
                  className="w-full sm:w-64"
                  onChange={(e) => setWaist(e.target.value)}
                />
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
