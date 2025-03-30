import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { PatientContext } from "../context/PatientContext";

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

  const { updateDepartment, patientData, updatePatientId } = useContext(PatientContext);
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
      setThroat(patientData.ent.throat || "");
      setThroatPain(patientData.ent.throat_pain || "");
      setNeckNodes(patientData.ent.neck_nodes || "");
      setTonsils(patientData.ent.tonsils || "");
    }
  }, [patientData.ent]);

  // Dropdown helper with custom options parameter; default is ["Yes", "No"]
  const dropdown = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: string[] = ["Yes", "No"]
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
      !leftEarDeformity ||
      !leftEarWax ||
      !leftEarTympanic ||
      !leftEarDischarge ||
      !leftEarNormHearing ||
      !rightEarDeformity ||
      !rightEarWax ||
      !rightEarTympanic ||
      !rightEarDischarge ||
      !rightEarNormHearing ||
      !leftNoseObstruction ||
      !leftNoseDischarge ||
      !rightNoseObstruction ||
      !rightNoseDischarge ||
      !throat ||
      !throatPain ||
      !neckNodes ||
      !tonsils
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
    updateDepartment("ent", data);
    alert("ENT data saved successfully.");
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        {patientData.patientId && patientData.it?.name ? (
          <>
            <div className="mb-4 text-gray-600">
              <p>Patient ID: <span className="font-bold">{patientData.patientId}</span></p>
              <p>Patient Name: <span className="font-bold">{patientData.it.name}</span></p>
            </div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
              ENT Examination Report
            </h1>
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Left Ear</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Deformity", leftEarDeformity, setLeftEarDeformity)}
                {dropdown("Wax", leftEarWax, setLeftEarWax)}
                {dropdown(
                  "Tympanic Membrane",
                  leftEarTympanic,
                  setLeftEarTympanic,
                  ["Seen", "Unseen"]
                )}
                {dropdown("Discharge", leftEarDischarge, setLeftEarDischarge)}
                {dropdown(
                  "Normal Hearing",
                  leftEarNormHearing,
                  setLeftEarNormHearing
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Right Ear
              </h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Deformity", rightEarDeformity, setRightEarDeformity)}
                {dropdown("Wax", rightEarWax, setRightEarWax)}
                {dropdown(
                  "Tympanic Membrane",
                  rightEarTympanic,
                  setRightEarTympanic,
                  ["Seen", "Unseen"]
                )}
                {dropdown("Discharge", rightEarDischarge, setRightEarDischarge)}
                {dropdown(
                  "Normal Hearing",
                  rightEarNormHearing,
                  setRightEarNormHearing
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Nose</h2>
              <div className="flex flex-wrap gap-2">
                {dropdown(
                  "Left Obstruction",
                  leftNoseObstruction,
                  setLeftNoseObstruction
                )}
                {dropdown(
                  "Left Discharge",
                  leftNoseDischarge,
                  setLeftNoseDischarge
                )}
                {dropdown(
                  "Right Obstruction",
                  rightNoseObstruction,
                  setRightNoseObstruction
                )}
                {dropdown(
                  "Right Discharge",
                  rightNoseDischarge,
                  setRightNoseDischarge
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Throat & Neck
              </h2>
              <div className="flex flex-wrap gap-2">
                {dropdown("Throat", throat, setThroat)}
                {dropdown("Throat Pain", throatPain, setThroatPain)}
                {dropdown("Neck Nodes", neckNodes, setNeckNodes, [
                  "Present",
                  "Absent",
                ])}
                {dropdown("Tonsils", tonsils, setTonsils, [
                  "Enlarged",
                  "Not Enlarged",
                ])}
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
          </>
        ) : (
          <div className="text-center p-8">
            <h2 className="text-xl text-gray-600">
              {!patientData.patientId 
                ? "Waiting for patient ID from IT Department..." 
                : "Waiting for patient information from IT Department..."}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ENTDashboard;
