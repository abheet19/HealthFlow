import * as React from "react";
import { useState, useContext, useEffect, useRef } from "react";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { getApiUrl } from "../config/api"; // Import API helper
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
    mobile: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    medicalOfficer: string;
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
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalOfficer, setMedicalOfficer] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const { patientData, updatePatientId, updateDepartment, resetPatientData } = useContext(PatientContext);
  const { showToast } = useToast(); // use the toast hook

  // Add new state for tracking department completions
  const [completedDepts, setCompletedDepts] = useState<string[]>([]);
  const [showPhotoPreview, setShowPhotoPreview] = useState<boolean>(false);
  const photoPreviewRef = useRef<HTMLDivElement>(null);

  // Load IT form state if stored data exists
  useEffect(() => {
    if (patientData.it) {
      setName(patientData.it.name || "");
      setDiv(patientData.it.div || "");
      setRollNo(patientData.it.rollNo || "");
      setAdminNo(patientData.it.adminNo || "");
      setFatherName(patientData.it.fatherName || "");
      setMotherName(patientData.it.motherName || "");
      setMobile(patientData.it.mobile || "");
      setDob(patientData.it.dob || "");
      setGender(patientData.it.gender || "");
      setBloodGroup(patientData.it.bloodGroup || "");
      setMedicalOfficer(patientData.it.medicalOfficer || "");
      
      // Photo state synchronization
      if (patientData.it.photo) {
        setPhotoBase64(patientData.it.photo);
        
        // Create a placeholder File object so the UI shows the photo is selected
        const dummyFile = new File([""], patientData.it.photoFileName || "patient_photo.jpg", { type: "image/jpeg" });
        setPhoto(dummyFile);
      } else {
        // If photo was deleted on another device
        setPhoto(null);
        setPhotoBase64("");
        setShowPhotoPreview(false);
        
        // Reset the file input
        const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  }, [patientData.it]);

  const handleInputChange = (field: string, value: string) => {
    // Create a copy of the current IT data to ensure we don't lose any fields
    const updatedItData = {
      ...(patientData.it || {}), // Use empty object as fallback if it doesn't exist
      [field]: value,
    };
    
    // Make sure photo data is preserved
    if (photoBase64) {
      updatedItData.photo = photoBase64;
    }
    
    // Update context with the complete data
    updateDepartment('it', updatedItData);
    
    // Also update local state
    switch(field) {
      case 'name': setName(value); break;
      case 'div': setDiv(value); break;
      case 'rollNo': setRollNo(value); break;
      case 'adminNo': setAdminNo(value); break;
      case 'fatherName': setFatherName(value); break;
      case 'motherName': setMotherName(value); break;
      case 'mobile': setMobile(value); break;
      case 'dob': setDob(value); break;
      case 'gender': setGender(value); break;
      case 'bloodGroup': setBloodGroup(value); break;
      case 'medicalOfficer': setMedicalOfficer(value); break;
      // Photo is handled separately in handlePhotoChange
    }
  };

  // Update completed departments whenever patientData changes
  useEffect(() => {
    const completed = ['ent', 'vision', 'general', 'dental'].filter(
      dept => {
        const deptData = patientData[dept as keyof PatientData];
        // Check for the isSubmitted flag instead of just checking if data exists
        return deptData && (deptData as any).isSubmitted === true;
      }
    );
    setCompletedDepts(completed);
  }, [patientData]); // This will run whenever any department updates their data

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1]; // strip data URL prefix
        setPhotoBase64(base64Data);
        
        // Preserve ALL existing IT data when saving photo
        const updatedItData = {
          ...(patientData.it || {}), // Use empty object as fallback
          // Make sure we keep all form values when adding a photo
          name: name || patientData.it?.name || '',
          div: div || patientData.it?.div || '',
          rollNo: rollNo || patientData.it?.rollNo || '',
          adminNo: adminNo || patientData.it?.adminNo || '',
          fatherName: fatherName || patientData.it?.fatherName || '',
          motherName: motherName || patientData.it?.motherName || '',
          mobile: mobile || patientData.it?.mobile || '',
          dob: dob || patientData.it?.dob || '',
          gender: gender || patientData.it?.gender || '',
          bloodGroup: bloodGroup || patientData.it?.bloodGroup || '',
          medicalOfficer: medicalOfficer || patientData.it?.medicalOfficer || '',
          // Add the new photo data
          photo: base64Data,
          photoFileName: file.name
        };
        
        // Update context with complete data
        updateDepartment("it", updatedItData);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePatientId = async () => {
    try {
      const response = await fetch(getApiUrl('api/generate_patient_id'), {
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
      
      if (data.success && data.patientId) {
        updatePatientId(data.patientId);
        showToast(`Patient ID generated: ${data.patientId}`, "success");
        // Remove resetForm() since we want to keep the entered data
      } else {
        throw new Error('No patient ID in response');
      }
    } catch (error) {
      showToast('Failed to generate patient ID. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setName("");
    setDiv("");
    setRollNo("");
    setAdminNo("");
    setFatherName("");
    setMotherName("");
    setMobile("");
    setDob("");
    setGender("");
    setBloodGroup("");
    setMedicalOfficer("");
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
      mobile,
      dob,
      gender,
      bloodGroup,
      medicalOfficer
    };

    if (!photo) {
      showToast('Please select a patient photo', 'error');
      return false;
    }

    const emptyFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      showToast(`Please fill in all required IT fields: ${emptyFields.join(', ')}`, 'error');
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
        mobile, 
        dob, 
        gender, 
        bloodGroup,
        medicalOfficer,
        photo: photoBase64  // include base64 photo string in IT data
      },
      ent: patientData.ent,
      vision: patientData.vision,
      general: patientData.general,
      dental: patientData.dental,
      captured_date: new Date().toISOString()  // New field for current date capture
    };

    try {
      const res = await fetch(getApiUrl("api/submit_patient"), {
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
    showToast("Patient data has been reset", "info");
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
        <h2 className="text-xl font-bold mb-4">Status & Summary</h2>
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
              <p><span className="font-medium">Medical Officer:</span> {medicalOfficer || '-'}</p>
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

  // Add event listener for global reset
  useEffect(() => {
    const handleGlobalReset = () => {
      resetForm();
    };
    
    window.addEventListener('patientDataReset', handleGlobalReset);
    
    return () => {
      window.removeEventListener('patientDataReset', handleGlobalReset);
    };
  }, []);
  
  // Original effect to update form when patientData changes
  useEffect(() => {
    if (patientData.it) {
      setName(patientData.it.name || "");
      setDiv(patientData.it.div || "");
      setRollNo(patientData.it.rollNo || "");
      setAdminNo(patientData.it.adminNo || "");
      setFatherName(patientData.it.fatherName || "");
      setMotherName(patientData.it.motherName || "");
      setMobile(patientData.it.mobile || "");
      setDob(patientData.it.dob || "");
      setGender(patientData.it.gender || "");
      setBloodGroup(patientData.it.bloodGroup || "");
      setMedicalOfficer(patientData.it.medicalOfficer || "");
      
      // Photo state synchronization
      if (patientData.it.photo) {
        setPhotoBase64(patientData.it.photo);
        
        // Create a placeholder File object so the UI shows the photo is selected
        const dummyFile = new File([""], patientData.it.photoFileName || "patient_photo.jpg", { type: "image/jpeg" });
        setPhoto(dummyFile);
      } else {
        // If photo was deleted on another device
        setPhoto(null);
        setPhotoBase64("");
        setShowPhotoPreview(false);
        
        // Reset the file input
        const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  }, [patientData.it]);

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
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="NA">NA</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Medical Officer"
              variant="outlined"
              size="small"
              className="w-full sm:w-64"
              value={medicalOfficer}
              onChange={(e) => handleInputChange('medicalOfficer', e.target.value)}
            />
            <div className="w-full sm:w-64 flex flex-col">
              <input
                id="patient-photo-upload"
                type="file"
                accept="image/*"
                required
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden" // Hide the native input
              />
              <div className="flex items-center">
                <label 
                  htmlFor="patient-photo-upload" 
                  className={`flex items-center justify-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                    photo 
                    ? 'bg-green-50 border border-green-500 text-green-700 hover:bg-green-100 flex-grow' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1.5 ${photo ? 'text-green-600' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {photo ? 
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    }
                  </svg>
                  <span className="font-medium whitespace-nowrap">
                    {photo ? 'Photo Uploaded' : 'Upload Photo'}
                  </span>
                </label>
                
                {photo && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setPhoto(null);
                      setPhotoBase64("");
                      setShowPhotoPreview(false);
                      
                      // Update context to remove the photo, which will trigger the broadcast
                      updateDepartment("it", {
                        ...patientData.it,
                        photo: undefined,
                        photoFileName: undefined
                      });
                      
                      // Reset the file input
                      const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="ml-2 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                    title="Delete photo (will be removed from all devices)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              {photo && (
                <div className="mt-1 flex items-center text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-500 truncate max-w-[180px]">
                    {photo.name}
                  </span>
                  <button 
                    onClick={() => setShowPhotoPreview(prev => !prev)} 
                    className="ml-2 text-blue-500 hover:text-blue-600 underline"
                  >
                    {showPhotoPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                </div>
              )}
              
              {/* Photo preview section */}
              {showPhotoPreview && photoBase64 && (
                <div 
                  className="mt-3 border p-1 rounded bg-white shadow-sm relative" 
                  ref={photoPreviewRef}
                >
                  <img 
                    src={`data:image/jpeg;base64,${photoBase64}`}
                    alt="Patient Photo Preview" 
                    className="w-full max-h-[200px] object-contain"
                  />
                  <button
                    onClick={() => setShowPhotoPreview(false)}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="text-xs text-center text-gray-500 py-1">
                    Photo will appear on all connected devices
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          {patientData.patientId ? (
            <div className="border p-3 rounded-lg bg-gray-50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2 whitespace-nowrap">Patient ID:</span>
                  <div className="w-full sm:w-auto mt-1 sm:mt-0">
                    <span className="inline-block text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 select-all overflow-hidden text-ellipsis max-w-full break-all">
                      {patientData.patientId}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleClearPatientId}
                  className="whitespace-nowrap mt-2 sm:mt-0"
                >
                  Reset All Data
                </Button>
              </div>
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
