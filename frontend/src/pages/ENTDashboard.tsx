import * as React from "react";
import { useState } from "react";
import { Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const ENTDashboard: React.FC = () => {
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
  const [throat, setThroat] = useState("");
  const [throatPain, setThroatPain] = useState("");
  const [neckNodes, setNeckNodes] = useState("");
  const [tonsils, setTonsils] = useState("");

  // Dropdown helper with custom options parameter; default is ["Yes", "No"]
  const dropdown = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: string[] = ["Yes", "No"]
  ) => (
    <FormControl variant="outlined" size="small" className="w-64">
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => setValue(e.target.value as string)}>
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
      !leftEarDeformity || !leftEarWax || !leftEarTympanic || !leftEarDischarge || !leftEarNormHearing ||
      !rightEarDeformity || !rightEarWax || !rightEarTympanic || !rightEarDischarge || !rightEarNormHearing ||
      !leftNoseObstruction || !leftNoseDischarge || !rightNoseObstruction || !rightNoseDischarge ||
      !throat || !throatPain || !neckNodes || !tonsils
    ) {
      alert("Please fill all fields.");
      return;
    }
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
      throat: throat,
      throat_pain: throatPain,
      neck_nodes: neckNodes,
      tonsils: tonsils,
    };
    await fetch("http://localhost:5000/api/ent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <div className="p-4 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold">ENT Examination Report</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Left Ear</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Deformity", leftEarDeformity, setLeftEarDeformity)}
          {dropdown("Wax", leftEarWax, setLeftEarWax)}
          {dropdown("Tympanic Membrane", leftEarTympanic, setLeftEarTympanic, ["Seen", "Unseen"])}
          {dropdown("Discharge", leftEarDischarge, setLeftEarDischarge)}
          {dropdown("Normal Hearing", leftEarNormHearing, setLeftEarNormHearing)}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Right Ear</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Deformity", rightEarDeformity, setRightEarDeformity)}
          {dropdown("Wax", rightEarWax, setRightEarWax)}
          {dropdown("Tympanic Membrane", rightEarTympanic, setRightEarTympanic, ["Seen", "Unseen"])}
          {dropdown("Discharge", rightEarDischarge, setRightEarDischarge)}
          {dropdown("Normal Hearing", rightEarNormHearing, setRightEarNormHearing)}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Nose</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Left Obstruction", leftNoseObstruction, setLeftNoseObstruction)}
          {dropdown("Left Discharge", leftNoseDischarge, setLeftNoseDischarge)}
          {dropdown("Right Obstruction", rightNoseObstruction, setRightNoseObstruction)}
          {dropdown("Right Discharge", rightNoseDischarge, setRightNoseDischarge)}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Throat & Neck</h2>
        <div className="flex flex-wrap gap-4">
          {dropdown("Throat", throat, setThroat)}
          {dropdown("Throat Pain", throatPain, setThroatPain)}
          {dropdown("Neck Nodes", neckNodes, setNeckNodes, ["Present", "Absent"])}
          {dropdown("Tonsils", tonsils, setTonsils, ["Enlarged", "Not Enlarged"])}
        </div>
      </div>
      
      <Button variant="contained" color="primary" onClick={handleSubmit} className="w-64">
        Submit
      </Button>
    </div>
  );
};

export default ENTDashboard;