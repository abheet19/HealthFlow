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
import io from 'socket.io-client';
import { useToast } from "../context/ToastContext";

interface PatientData {
  patientId?: string;
  it?: {
    name: string;
    div: string;
    rollNo: string;
    adminNo: string;
    fatherName: string;
    motherName: string;
    address: string;
    mobile: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    photo?: string; // Add photo field to IT data
  };
  ent?: Record<string, any>;
  vision?: Record<string, any>;
  general?: Record<string, any>;
  dental?: Record<string, any>;
}

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
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const { patientData, updatePatientId, updateDepartment, resetPatientData } = useContext(PatientContext);
  const { showToast } = useToast(); // use the toast hook

  // Add new state for tracking department completions
  const [completedDepts, setCompletedDepts] = useState<string[]>([]);

  // Load IT form state if stored data exists
  useEffect(() => {
    if (patientData.it) {
      setName(patientData.it.name || "");
      setDiv(patientData.it.div || "");
      setRollNo(patientData.it.rollNo || "");
      setAdminNo(patientData.it.adminNo || "");
      setFatherName(patientData.it.fatherName || "");
      setMotherName(patientData.it.motherName || "");
      setAddress(patientData.it.address || "");
      setMobile(patientData.it.mobile || "");
      setDob(patientData.it.dob || "");
      setGender(patientData.it.gender || "");
      setBloodGroup(patientData.it.bloodGroup || "");
    }
  }, [patientData.it]);

  // Add debounced update
  const debouncedUpdate = React.useCallback(
    debounce((data: Record<string, any>) => {
      updateDepartment("it", data);
    }, 500),
    [updateDepartment]
  );

  const handleInputChange = (field: string, value: string) => {
    // Update local state
    switch(field) {
      case 'name': setName(value); break;
      case 'div': setDiv(value); break;
      case 'rollNo': setRollNo(value); break;
      case 'adminNo': setAdminNo(value); break;
      case 'fatherName': setFatherName(value); break;
      case 'motherName': setMotherName(value); break;
      case 'address': setAddress(value); break;
      case 'mobile': setMobile(value); break;
      case 'dob': setDob(value); break;
      case 'gender': setGender(value); break;
      case 'bloodGroup': setBloodGroup(value); break;
    }

    // Debounced context update
    debouncedUpdate({
      name: field === 'name' ? value : name,
      div: field === 'div' ? value : div,
      rollNo: field === 'rollNo' ? value : rollNo,
      adminNo: field === 'adminNo' ? value : adminNo,
      fatherName: field === 'fatherName' ? value : fatherName,
      motherName: field === 'motherName' ? value : motherName,
      address: field === 'address' ? value : address,
      mobile: field === 'mobile' ? value : mobile,
      dob: field === 'dob' ? value : dob,
      gender: field === 'gender' ? value : gender,
      bloodGroup: field === 'bloodGroup' ? value : bloodGroup,
    });
  };

  // Update completed departments whenever patientData changes
  useEffect(() => {
    const completed = ['ent', 'vision', 'general', 'dental'].filter(
      dept => {
        const deptData = patientData[dept as keyof PatientData];
        return deptData && Object.keys(deptData).length > 0;
      }
    );
    console.log('Departments completed:', completed); // Debug log
    setCompletedDepts(completed);
  }, [patientData]); // This will run whenever any department updates their data

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoBase64(result.split(",")[1]); // strip data URL prefix
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePatientId = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/generate_patient_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dob }) // Send the DOB from the form
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Generate ID response:', data); // Debug log
      
      if (data.success && data.patientId) {
        updatePatientId(data.patientId);
        // Remove resetForm() since we want to keep the entered data
      } else {
        throw new Error('No patient ID in response');
      }
    } catch (error) {
      console.error('Error generating patient ID:', error);
      alert('Failed to generate patient ID. Please try again.');
    }
  };

  const resetForm = () => {
    setName("");
    setDiv("");
    setRollNo("");
    setAdminNo("");
    setFatherName("");
    setMotherName("");
    setAddress("");
    setMobile("");
    setDob("");
    setGender("");
    setBloodGroup("");
    setPhoto(null);
  };

  const validateITData = () => {
    const requiredFields = {
      name,
      div,
      rollNo,
      adminNo,
      fatherName,
      motherName,
      address,
      mobile,
      dob,
      gender,
      bloodGroup
    };

    if (!photo) {
      alert('Please select a patient photo');
      return false;
    }

    const emptyFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      alert(`Please fill in all required IT fields: ${emptyFields.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!patientData.patientId) {
      showToast("Please generate a Patient ID first.", "error");
      return;
    }

    if (!validateITData()) {
      showToast("Please fill all required IT fields.", "error");
      return;
    }

    const required = ["ent", "vision", "general", "dental"];
    for (const dept of required) {
      if (!(patientData as any)[dept]) {
        showToast(`Data for ${dept.toUpperCase()} department is missing.`, "error");
        return;
      }
    }

    const combinedData = {
      patientId: patientData.patientId!,
      it: { 
        name, 
        div, 
        rollNo, 
        adminNo, 
        fatherName, 
        motherName, 
        address, 
        mobile, 
        dob, 
        gender, 
        bloodGroup,
        photo: photoBase64  // include base64 photo string in IT data
      },
      ent: patientData.ent,
      vision: patientData.vision,
      general: patientData.general,
      dental: patientData.dental
    };

    try {
      const res = await fetch("http://localhost:5000/api/submit_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combinedData)
      });
      const result = await res.json();
      if (result.message === "Patient data submitted successfully.") {
        showToast("Patient data submitted successfully.", "success");
        resetForm();
        resetPatientData(); // This will clear everything
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error submitting patient data.", "error");
    }
  };

  const handleClearPatientId = () => {
    resetPatientData();  // This will now clear everything including form data
    resetForm();
  };

  const renderDataSummary = () => {
    const departments = [
      { name: 'Vision', data: patientData.vision },
      { name: 'ENT', data: patientData.ent },
      { name: 'General', data: patientData.general },
      { name: 'Dental', data: patientData.dental }
    ];

    return (
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Department Status & Summary</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {['ENT', 'Vision', 'General', 'Dental'].map(dept => (
            <div 
              key={dept} 
              className={`p-4 rounded-lg border shadow-sm ${
                completedDepts.includes(dept.toLowerCase()) 
                  ? 'bg-green-100 border-green-500' 
                  : 'bg-gray-100 border-gray-300'
              }`}
            >
              <div className="font-medium text-lg">{dept}</div>
              <div className="text-sm text-gray-600">
                {completedDepts.includes(dept.toLowerCase()) 
                  ? 'Completed ✓' 
                  : 'Pending...'}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Name:</span> {name || '-'}</p>
              <p><span className="font-medium">Division:</span> {div || '-'}</p>
              <p><span className="font-medium">Roll No:</span> {rollNo || '-'}</p>
              <p><span className="font-medium">Admin No:</span> {adminNo || '-'}</p>
            </div>
            <div>
              <p><span className="font-medium">Gender:</span> {gender || '-'}</p>
              <p><span className="font-medium">DOB:</span> {dob || '-'}</p>
              <p><span className="font-medium">Blood Group:</span> {bloodGroup || '-'}</p>
              <p><span className="font-medium">Mobile:</span> {mobile || '-'}</p>
            </div>
          </div>
        </div>

        {departments.map(dept => dept.data && (
          <div key={dept.name} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{dept.name} Department Summary</h3>
            <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(dept.data).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                  </span>{' '}
                  {value?.toString() || '-'}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">IT Dashboard</h1>

        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Basic Information
          </h2>
          <div className="flex flex-wrap gap-4">
            <TextField
              label="Name"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            <TextField
              label="DIV"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={div}
              onChange={(e) => handleInputChange('div', e.target.value)}
            />
            <TextField
              label="Roll No"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={rollNo}
              onChange={(e) => handleInputChange('rollNo', e.target.value)}
            />
            <TextField
              label="Admin No"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={adminNo}
              onChange={(e) => handleInputChange('adminNo', e.target.value)}
            />
          </div>
        </div>

        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Family & Contact Details
          </h2>
          <div className="flex flex-wrap gap-4">
            <TextField
              label="Father's Name"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={fatherName}
              onChange={(e) => handleInputChange('fatherName', e.target.value)}
            />
            <TextField
              label="Mother's Name"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={motherName}
              onChange={(e) => handleInputChange('motherName', e.target.value)}
            />
            <TextField
              label="Address"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
            <TextField
              label="Mobile"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
            />
          </div>
        </div>

        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Additional Details
          </h2>
          <div className="flex flex-wrap gap-4">
            <TextField
              label="DOB"
              type="date"
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
            />
            <FormControl
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
            >
              <InputLabel>Gender</InputLabel>
              <Select
                label="Gender"
                value={gender}
                onChange={(e) => handleInputChange('gender', e.target.value as string)}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
            >
              <InputLabel>Blood Group</InputLabel>
              <Select
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => handleInputChange('bloodGroup', e.target.value as string)}
              >
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>  {/* Fixed closing tag */}
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
              required
              capture="environment"
              onChange={handlePhotoChange}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        <div className="mb-6">
          {patientData.patientId ? (
            <div className="flex items-center justify-between gap-4">
              <div className="text-lg">
                Patient Number: <span className="font-bold">{patientData.patientId}</span>
              </div>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearPatientId}
                className="text-sm"
              >
                Reset All Data
              </Button>
            </div>
          ) : (
            <Button variant="outlined" onClick={generatePatientId} className="mb-4">
              Register Patient
            </Button>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinalSubmit}
            className="w-full sm:w-64 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Submit
          </Button>
        </div>
        
        {renderDataSummary()}
      </div>
    </div>
  );
};

// Add at top of file with other imports:
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ITDashboard;
