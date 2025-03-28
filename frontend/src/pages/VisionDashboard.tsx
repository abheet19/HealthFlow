import * as React from "react";
import { useState } from "react";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const VisionDashboard: React.FC = () => {
  const [reVision, setReVision] = useState("6/6");
  const [leVision, setLeVision] = useState("6/6");
  const [reColor, setReColor] = useState("");
  const [leColor, setLeColor] = useState("");
  const [reSquint, setReSquint] = useState("");
  const [leSquint, setLeSquint] = useState("");

  const handleSubmit = async () => {
    if (!reVision || !reColor || !reSquint || !leVision || !leColor || !leSquint) {
      alert("Please fill all fields.");
      return;
    }
    const data = {
      re_vision: reVision,
      re_color_blindness: reColor,
      re_squint: reSquint,
      le_vision: leVision,
      le_color_blindness: leColor,
      le_squint: leSquint
    };
    await fetch("http://localhost:5000/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  };

  const dropdown = (label: string, value: string, setValue: (v: string) => void) => (
    <FormControl variant="outlined" size="small" className="w-64">
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e)=>setValue(e.target.value as string)}>
        <MenuItem value="No">No</MenuItem>
        <MenuItem value="YES">YES</MenuItem>
      </Select>
    </FormControl>
  );

  return (
    <div className="p-4 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold">Vision Examination Report</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Right Eye</h2>
        <div className="flex flex-wrap gap-4">
          <TextField label="Vision" variant="outlined" size="small" className="w-64" value={reVision} onChange={(e)=>setReVision(e.target.value)} />
          {dropdown("Color Blindness", reColor, setReColor)}
          {dropdown("Squint", reSquint, setReSquint)}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Left Eye</h2>
        <div className="flex flex-wrap gap-4">
          <TextField label="Vision" variant="outlined" size="small" className="w-64" value={leVision} onChange={(e)=>setLeVision(e.target.value)} />
          {dropdown("Color Blindness", leColor, setLeColor)}
          {dropdown("Squint", leSquint, setLeSquint)}
        </div>
      </div>
      
      <Button variant="contained" color="primary" onClick={handleSubmit} className="w-64">
        Submit
      </Button>
    </div>
  );
};

export default VisionDashboard;