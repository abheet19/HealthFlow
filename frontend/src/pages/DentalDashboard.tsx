import * as React from "react";
import { useState } from "react";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const ToothSelector: React.FC<{
	label: string;
	options: string[];
	selected: string[];
	onChange: (sel: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
	const toggleSelection = (num: string) => {
		if (selected.includes(num)) {
			onChange(selected.filter(n => n !== num));
		} else {
			onChange([...selected, num]);
		}
	};
	return (
		<div className="flex flex-wrap gap-2">
			<span className="font-semibold">{label}:</span>
			{options.map(num => (
				<button
					key={num}
					onClick={() => toggleSelection(num)}
					className={`border rounded px-2 py-1 ${
						selected.includes(num)
							? "bg-blue-500 text-white"
							: "bg-gray-200 text-black"
					}`}
				>
					{num}
				</button>
			))}
		</div>
	);
};

const DentalDashboard: React.FC = () => {
  // Extra Oral Examination
  const [extraOral, setExtraOral] = useState("");

  // Intra Oral Examination
  // For Tooth Cavity fields, we leave them as text inputs for now.
  const [toothCavityPermanent, setToothCavityPermanent] = useState<string[]>([]);
  const [toothCavityPrimary, setToothCavityPrimary] = useState<string[]>([]);
  
  // Dropdown fields for intra-oral exam options
  const [plaque, setPlaque] = useState("");
  const [gumInflammation, setGumInflammation] = useState("");
  const [stains, setStains] = useState("");
  const [toothDiscoloration, setToothDiscoloration] = useState("");
  const [tarter, setTarter] = useState("");
  const [badBreath, setBadBreath] = useState("");
  const [gumBleeding, setGumBleeding] = useState("");
  const [softTissue, setSoftTissue] = useState("");
  const [fluorosis, setFluorosis] = useState("");
  const [malocclusion, setMalocclusion] = useState("");
  const [rootStump, setRootStump] = useState("");
  const [missingTeeth, setMissingTeeth] = useState("");

  const dropdown = (label: string, value: string, setValue: (v: string) => void, options: string[]) => (
    <FormControl variant="outlined" size="small" className="w-64">
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => setValue(e.target.value as string)}>
        {options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
      </Select>
    </FormControl>
  );

  const handleSubmit = async () => {
    if (
      !extraOral ||
      !toothCavityPermanent.length || !toothCavityPrimary.length || !plaque ||
      !gumInflammation || !stains || !toothDiscoloration || !tarter ||
      !badBreath || !gumBleeding || !softTissue || !fluorosis ||
      !malocclusion || !rootStump || !missingTeeth
    ) {
      alert("Please fill all fields.");
      return;
    }
    const data = {
      dental_extra_oral: extraOral,
      tooth_cavity_permanent: toothCavityPermanent.join(","),
      tooth_cavity_primary: toothCavityPrimary.join(","),
      plaque,
      gum_inflammation: gumInflammation,
      stains,
      tooth_discoloration: toothDiscoloration,
      tarter,
      bad_breath: badBreath,
      gum_bleeding: gumBleeding,
      soft_tissue: softTissue, 
      fluorosis,
      malocclusion,
      root_stump: rootStump,
      missing_teeth: missingTeeth
    };
    await fetch("http://localhost:5000/api/dental", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    // ...handle response...
  };

  return (
    <div className="p-4 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold">Dental Examination Report</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Extra Oral Examination</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Extra-Oral", extraOral, setExtraOral, ["No Abnormality", "Abnormality"])}
        </div>
      </div>
      
      {/* Modified Intra Oral Examination section with integrated Tooth Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Intra Oral Examination</h2>
        <div className="flex flex-col gap-4">
          {/* Permanent Teeth: Two groups in one row with gap */}
          <div className="flex flex-wrap gap-4 items-center">
            <ToothSelector
              label="Permanent Group 1"
              options={[
                "18","17","16","14","13","12","11"
              ]}
              selected={toothCavityPermanent.filter(n => ["18","17","16","14","13","12","11"].includes(n))}
              onChange={(sel) => {
                const group2 = toothCavityPermanent.filter(n => !["18","17","16","14","13","12","11"].includes(n));
                setToothCavityPermanent([...sel, ...group2]);
              }}
            />
            <div className="w-8"></div> {/* gap between groups */}
            <ToothSelector
              label="Permanent Group 2"
              options={[
                "21","22","23","24","25","26","27","28"
              ]}
              selected={toothCavityPermanent.filter(n => ["21","22","23","24","25","26","27","28"].includes(n))}
              onChange={(sel) => {
                const group1 = toothCavityPermanent.filter(n => !["21","22","23","24","25","26","27","28"].includes(n));
                setToothCavityPermanent([...group1, ...sel]);
              }}
            />
          </div>
          {/* Primary Teeth: Two groups in one row with gap, on a separate row */}
          <div className="flex flex-wrap gap-4 items-center">
            <ToothSelector
              label="Primary Group 1"
              options={[
                "48","47","46","45","44","43","42","41"
              ]}
              selected={toothCavityPrimary.filter(n => ["48","47","46","45","44","43","42","41"].includes(n))}
              onChange={(sel) => {
                const group2 = toothCavityPrimary.filter(n => !["48","47","46","45","44","43","42","41"].includes(n));
                setToothCavityPrimary([...sel, ...group2]);
              }}
            />
            <div className="w-8"></div> {/* gap between groups */}
            <ToothSelector
              label="Primary Group 2"
              options={[
                "31","32","33","34","35","36","37","38"
              ]}
              selected={toothCavityPrimary.filter(n => ["31","32","33","34","35","36","37","38"].includes(n))}
              onChange={(sel) => {
                const group1 = toothCavityPrimary.filter(n => !["31","32","33","34","35","36","37","38"].includes(n));
                setToothCavityPrimary([...group1, ...sel]);
              }}
            />
          </div>
          {/* Existing dropdown fields remain unchanged */}
          <div className="flex flex-wrap gap-4">
            {dropdown("Plaque", plaque, setPlaque, ["Present", "Absent"])}
            {dropdown("Gum Inflammation", gumInflammation, setGumInflammation, ["Present", "Absent"])}
            {dropdown("Stains", stains, setStains, ["Present", "Absent"])}
            {dropdown("Tooth Discoloration", toothDiscoloration, setToothDiscoloration, ["Present", "Absent"])}
            {dropdown("Tarter", tarter, setTarter, ["Present", "Absent"])}
            {dropdown("Bad Breath", badBreath, setBadBreath, ["Present", "Absent"])}
            {dropdown("Gum Bleeding", gumBleeding, setGumBleeding, ["Present", "Absent"])}
            {dropdown("Soft Tissue", softTissue, setSoftTissue, ["No Abnormality", "Abnormality"])}
            {dropdown("Fluorosis", fluorosis, setFluorosis, ["Present", "Absent"])}
            {dropdown("Malocclusion", malocclusion, setMalocclusion, ["Present", "Absent"])}
            {dropdown("Root Stump", rootStump, setRootStump, ["Present", "Absent"])}
            {dropdown("Missing Teeth", missingTeeth, setMissingTeeth, ["Present", "Absent"])}
          </div>
        </div>
      </div>
      
      {/* ...existing remaining sections unchanged... */}
      <Button variant="contained" color="primary" onClick={handleSubmit} className="w-64">
        Submit
      </Button>
    </div>
  );
};

export default DentalDashboard;