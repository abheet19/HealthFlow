import * as React from "react";
import { useState } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const ToothSelector: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (sel: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  const toggleSelection = (num: string) => {
    if (selected.includes(num)) {
      onChange(selected.filter((n) => n !== num));
    } else {
      onChange([...selected, num]);
    }
  };
  return (
    <div className="flex flex-col space-y-1">
      <span className="font-medium text-sm">{label}:</span>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-8 md:grid-cols-8">
        {options.map((num) => (
          <button
            key={num}
            onClick={() => toggleSelection(num)}
            className={`border rounded px-1 py-1 text-center text-xs ${selected.includes(num)
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
              }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

const DentalDashboard: React.FC = () => {
  // Extra Oral Examination
  const [extraOral, setExtraOral] = useState("");

  // Intra Oral Examination
  // Remove old state:
  // const [toothCavityPermanent, setToothCavityPermanent] = useState<string[]>([]);
  // const [toothCavityPrimary, setToothCavityPrimary] = useState<string[]>([]);

  // Add new state variables:
  const [toothCavityPermanentGroup1, setToothCavityPermanentGroup1] = useState<
    string[]
  >([]);
  const [toothCavityPermanentGroup2, setToothCavityPermanentGroup2] = useState<
    string[]
  >([]);
  const [toothCavityPermanentGroup3, setToothCavityPermanentGroup3] = useState<
    string[]
  >([]);
  const [toothCavityPermanentGroup4, setToothCavityPermanentGroup4] = useState<
    string[]
  >([]);
  const [toothCavityPrimaryGroup1, setToothCavityPrimaryGroup1] = useState<
    string[]
  >([]);
  const [toothCavityPrimaryGroup2, setToothCavityPrimaryGroup2] = useState<
    string[]
  >([]);
  const [toothCavityPrimaryGroup3, setToothCavityPrimaryGroup3] = useState<
    string[]
  >([]);
  const [toothCavityPrimaryGroup4, setToothCavityPrimaryGroup4] = useState<
    string[]
  >([]);

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

  const handleSubmit = async () => {
    if (
      !extraOral ||
      // Validate that each group has at least one selection:
      !toothCavityPermanentGroup1.length ||
      !toothCavityPermanentGroup2.length ||
      !toothCavityPermanentGroup3.length ||
      !toothCavityPermanentGroup4.length ||
      !toothCavityPrimaryGroup1.length ||
      !toothCavityPrimaryGroup2.length ||
      !toothCavityPrimaryGroup3.length ||
      !toothCavityPrimaryGroup4.length ||
      !plaque ||
      !gumInflammation ||
      !stains ||
      !toothDiscoloration ||
      !tarter ||
      !badBreath ||
      !gumBleeding ||
      !softTissue ||
      !fluorosis ||
      !malocclusion ||
      !rootStump ||
      !missingTeeth
    ) {
      alert("Please fill all fields.");
      return;
    }
    const data = {
      dental_extra_oral: extraOral,
      // Combine all permanent groups:
      tooth_cavity_permanent: [
        ...toothCavityPermanentGroup1,
        ...toothCavityPermanentGroup2,
        ...toothCavityPermanentGroup3,
        ...toothCavityPermanentGroup4,
      ].join(","),
      // Combine all primary groups:
      tooth_cavity_primary: [
        ...toothCavityPrimaryGroup1,
        ...toothCavityPrimaryGroup2,
        ...toothCavityPrimaryGroup3,
        ...toothCavityPrimaryGroup4,
      ].join(","),
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
      missing_teeth: missingTeeth,
    };
    await fetch("http://localhost:5000/api/dental", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // ...handle response...
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Dental Examination Report
        </h1>

        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Extra Oral Examination
          </h2>
          <div className="flex flex-wrap gap-2">
            {dropdown("Extra-Oral", extraOral, setExtraOral, [
              "No Abnormality",
              "Abnormality",
            ])}
          </div>
        </div>

        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Intra Oral Examination
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-600">
                Tooth Cavity (Permanent Teeth)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToothSelector
                  label="Permanent Group 1"
                  options={["18", "17", "16", "15", "14", "13", "12", "11"]}
                  selected={toothCavityPermanentGroup1}
                  onChange={setToothCavityPermanentGroup1}
                />
                <ToothSelector
                  label="Permanent Group 2"
                  options={["21", "22", "23", "24", "25", "26", "27", "28"]}
                  selected={toothCavityPermanentGroup2}
                  onChange={setToothCavityPermanentGroup2}
                />
                <ToothSelector
                  label="Permanent Group 3"
                  options={["48", "47", "46", "45", "44", "43", "42", "41"]}
                  selected={toothCavityPermanentGroup3}
                  onChange={setToothCavityPermanentGroup3}
                />
                <ToothSelector
                  label="Permanent Group 4"
                  options={["31", "32", "33", "34", "35", "36", "37", "38"]}
                  selected={toothCavityPermanentGroup4}
                  onChange={setToothCavityPermanentGroup4}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-600">
                Tooth Cavity (Primary Teeth)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToothSelector
                  label="Primary Group 1"
                  options={["55", "54", "53", "52", "51"]}
                  selected={toothCavityPrimaryGroup1}
                  onChange={setToothCavityPrimaryGroup1}
                />
                <ToothSelector
                  label="Primary Group 2"
                  options={["61", "62", "63", "64", "65"]}
                  selected={toothCavityPrimaryGroup2}
                  onChange={setToothCavityPrimaryGroup2}
                />
                <ToothSelector
                  label="Primary Group 3"
                  options={["85", "84", "83", "82", "81"]}
                  selected={toothCavityPrimaryGroup3}
                  onChange={setToothCavityPrimaryGroup3}
                />
                <ToothSelector
                  label="Primary Group 4"
                  options={["71", "72", "73", "74", "75"]}
                  selected={toothCavityPrimaryGroup4}
                  onChange={setToothCavityPrimaryGroup4}
                />
              </div>
            </div>

            {/* Restored Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {dropdown("Plaque", plaque, setPlaque, ["Present", "Absent"])}
              {dropdown(
                "Gum Inflammation",
                gumInflammation,
                setGumInflammation,
                ["Present", "Absent"]
              )}
              {dropdown("Stains", stains, setStains, ["Present", "Absent"])}
              {dropdown(
                "Tooth Discoloration",
                toothDiscoloration,
                setToothDiscoloration,
                ["Present", "Absent"]
              )}
              {dropdown("Tarter", tarter, setTarter, ["Present", "Absent"])}
              {dropdown("Bad Breath", badBreath, setBadBreath, [
                "Present",
                "Absent",
              ])}
              {dropdown("Gum Bleeding", gumBleeding, setGumBleeding, [
                "Present",
                "Absent",
              ])}
              {dropdown("Soft Tissue", softTissue, setSoftTissue, [
                "No Abnormality",
                "Abnormality",
              ])}
              {dropdown("Fluorosis", fluorosis, setFluorosis, [
                "Present",
                "Absent",
              ])}
              {dropdown("Malocclusion", malocclusion, setMalocclusion, [
                "Present",
                "Absent",
              ])}
              {dropdown("Root Stump", rootStump, setRootStump, [
                "Present",
                "Absent",
              ])}
              {dropdown("Missing Teeth", missingTeeth, setMissingTeeth, [
                "Present",
                "Absent",
              ])}
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
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DentalDashboard;
