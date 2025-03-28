import * as React from "react";
import { useState } from "react";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const GeneralDashboard: React.FC = () => {
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

  const dropdown = (
    label: string, 
    value: string, 
    setValue: (v: string) => void, 
    options: string[]
  ) => (
    <FormControl variant="outlined" size="small" className="w-64">
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => setValue(e.target.value as string)}>
        {options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
      </Select>
    </FormControl>
  );

  const handleSubmit = async () => {
    if (
      !height || !weight || !bmi ||
      !nails || !hair || !skin ||
      !anemiaFigure ||
      !allergy ||
      !abdomenSoft || !abdomenHard || !abdomenDistended || !abdomenBowel ||
      !cnsConscious || !cnsOriented || !cnsPlayful || !cnsActive || !cnsAlert || !cnsSpeech ||
      !pastMedical || !pastSurgical || !bp || !pulse || !hip || !waist
    ) {
      alert("Please fill all fields.");
      return;
    }
    const data = {
      height, weight, bmi,
      nails, hair, skin,
      anemia_figure: anemiaFigure,
      allergy,
      abdomen_soft: abdomenSoft, abdomen_hard: abdomenHard,
      abdomen_distended: abdomenDistended, abdomen_bowel_sound: abdomenBowel,
      cns_conscious: cnsConscious, cns_oriented: cnsOriented,
      cns_playful: cnsPlayful, cns_active: cnsActive,
      cns_alert: cnsAlert, cns_speech: cnsSpeech,
      past_medical: pastMedical, past_surgical: pastSurgical,
      bp, pulse, hip, waist
    };
    await fetch("http://localhost:5000/api/general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  };

  return (
    <div className="p-4 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold">General Examination Report</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Body Measurements</h2>
        <div className="flex flex-wrap gap-4">
          <TextField label="Height" variant="outlined" size="small" className="w-64" onChange={(e)=>setHeight(e.target.value)} />
          <TextField label="Weight" variant="outlined" size="small" className="w-64" onChange={(e)=>setWeight(e.target.value)} />
          <TextField label="BMI" variant="outlined" size="small" className="w-64" onChange={(e)=>setBmi(e.target.value)} />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">General Cleanliness</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Nails", nails, setNails, ["No Abnormality", "Abnormality"])}
          {dropdown("Hair", hair, setHair, ["No Abnormality", "Abnormality"])}
          {dropdown("Skin", skin, setSkin, ["No Abnormality", "Abnormality"])}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">History & Abdomen</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Anemia/Figure", anemiaFigure, setAnemiaFigure, ["No Abnormality", "Abnormality"])}
          {dropdown("Allergy", allergy, setAllergy, ["No", "YES"])}
          {dropdown("Abdomen Soft", abdomenSoft, setAbdomenSoft, ["Yes", "No"])}
          {dropdown("Abdomen Hard", abdomenHard, setAbdomenHard, ["Yes", "No"])}
          {dropdown("Abdomen Distended", abdomenDistended, setAbdomenDistended, ["Yes", "No"])}
          {dropdown("Bowel Sound", abdomenBowel, setAbdomenBowel, ["Yes", "No"])}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">CNS</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("CNS Conscious", cnsConscious, setCnsConscious, ["Yes", "No"])}
          {dropdown("CNS Oriented", cnsOriented, setCnsOriented, ["Yes", "No"])}
          {dropdown("CNS Playful", cnsPlayful, setCnsPlayful, ["Yes", "No"])}
          {dropdown("CNS Active", cnsActive, setCnsActive, ["Yes", "No"])}
          {dropdown("CNS Alert", cnsAlert, setCnsAlert, ["Yes", "No"])}
          {dropdown("CNS Speech", cnsSpeech, setCnsSpeech, ["Normal", "Abnormal"])}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Past History</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Medical", pastMedical, setPastMedical, ["Yes", "No"])}
          {dropdown("Surgical", pastSurgical, setPastSurgical, ["Yes", "No"])}
        </div>
      </div>
      
      {/* New section: Vitals Examination Report */}
      <h1 className="text-2xl font-bold">Vitals Examination Report</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Vital Signs</h2>
        <div className="flex flex-wrap gap-4">
          <TextField label="BP" variant="outlined" size="small" className="w-64" onChange={(e)=>setBp(e.target.value)} />
          <TextField label="Pulse" variant="outlined" size="small" className="w-64" onChange={(e)=>setPulse(e.target.value)} />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Circumferences</h2>
        <div className="flex flex-wrap gap-4">
          <TextField label="Hip" variant="outlined" size="small" className="w-64" onChange={(e)=>setHip(e.target.value)} />
          <TextField label="Waist" variant="outlined" size="small" className="w-64" onChange={(e)=>setWaist(e.target.value)} />
        </div>
      </div>
      
      <Button variant="contained" color="primary" onClick={handleSubmit} className="w-64">
        Submit
      </Button>
    </div>
  );
};

export default GeneralDashboard;