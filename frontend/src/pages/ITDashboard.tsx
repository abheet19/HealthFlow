import * as React from "react";
import { useState } from "react";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const ITDashboard: React.FC = () => {
  const [name, setName] = useState("");
  const [div, setDiv] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [adminNo, setAdminNo] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !div ||
      !rollNo ||
      !adminNo ||
      !fatherName ||
      !motherName ||
      !address ||
      !mobile ||
      !dob ||
      !gender ||
      !bloodGroup ||
      !photo
    ) {
      alert("Please fill all fields and attach a photo.");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("div", div);
    formData.append("roll_no", rollNo);
    formData.append("admin_no", adminNo);
    formData.append("father_name", fatherName);
    formData.append("mother_name", motherName);
    formData.append("address", address);
    formData.append("mobile", mobile);
    formData.append("dob", dob);
    formData.append("gender", gender);
    formData.append("blood_group", bloodGroup);
    formData.append("photo", photo);
    await fetch("http://localhost:5000/api/it", {
      method: "POST",
      body: formData,
    });
    // ...handle response...
  };

  return (
    <div className="p-4 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold">IT Dashboard</h1>

      <div>
        <h2 className="text-xl font-semibold mb-2">Basic Information</h2>
        <div className="flex flex-wrap gap-4">
          <TextField
            label="Name"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="DIV"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setDiv(e.target.value)}
          />
          <TextField
            label="Roll No"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setRollNo(e.target.value)}
          />
          <TextField
            label="Admin No"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setAdminNo(e.target.value)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Family & Contact Details</h2>
        <div className="flex flex-wrap gap-4">
          <TextField
            label="Father's Name"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setFatherName(e.target.value)}
          />
          <TextField
            label="Mother's Name"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setMotherName(e.target.value)}
          />
          <TextField
            label="Address"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setAddress(e.target.value)}
          />
          <TextField
            label="Mobile"
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Additional Details</h2>
        <div className="flex flex-wrap gap-4">
          <TextField
            label="DOB"
            type="date"
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
            className="w-64"
            onChange={(e) => setDob(e.target.value)}
          />
          <FormControl variant="outlined" size="small" className="w-64">
            <InputLabel>Gender</InputLabel>
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as string)}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" className="w-64">
            <InputLabel>Blood Group</InputLabel>
            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as string)}
            >
              <MenuItem value="A+">A+</MenuItem>
              <MenuItem value="A-">A-</MenuItem>
              <MenuItem value="B+">B+</MenuItem>
              <MenuItem value="B-">B-</MenuItem>
              <MenuItem value="O+">O+</MenuItem>
              <MenuItem value="O-">O-</MenuItem>
              <MenuItem value="AB+">AB+</MenuItem>
              <MenuItem value="AB-">AB-</MenuItem>
            </Select>
          </FormControl>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="w-64"
          />
        </div>
      </div>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        className="w-64"
      >
        Submit
      </Button>
    </div>
  );
};

export default ITDashboard;
