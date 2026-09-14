import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { PatientContext } from "../context/PatientContext";
import { apiFetch } from "../config/api"; // Import API helper
import { useToast } from "../context/ToastContext";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";
import Field from "../components/Field";

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

const formatSummaryLabel = (key: string) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, character => character.toUpperCase());

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
  const [generatingId, setGeneratingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load IT form state if stored data exists, and keep it synced whenever
  // patientData.it changes (e.g. a photo update arriving from another device).
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

        // Reset the file input
        const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  }, [patientData.it]);

  const handleInputChange = (field: string, value: string) => {
    // Update local state immediately for smooth UI feedback
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

    // Send only the changed field; functional context merging preserves rapid edits.
    updateDepartment('it', { [field]: value });
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

      // Create a new FileReader instance
      const reader = new FileReader();

      reader.onload = () => {
        try {
          // Get the result as a string
          const result = reader.result as string;

          // Process the image - resize and compress if needed
          const img = new Image();
          img.onload = () => {
            try {
              // Create a canvas to resize the image if it's too large
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // Limit dimensions to reasonable size for faster transmission
              const MAX_SIZE = 1024;
              if (width > height && width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              } else if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }

              canvas.width = width;
              canvas.height = height;

              // Draw and compress the image
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error('Could not get canvas context');
              }

              ctx.drawImage(img, 0, 0, width, height);

              // Convert to base64 with compression (0.8 quality - good balance)
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

              // Extract just the base64 data (remove data URL prefix)
              const base64Data = compressedBase64.split(',')[1];

              setPhotoBase64(base64Data);

              // Update the IT data with the photo
              const updatedItData = {
                ...(patientData.it || {}),
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
                photo: base64Data,
                photoFileName: file.name || `camera_photo_${new Date().getTime()}.jpg`
              };

              // Update patient context, which should trigger socket update
              updateDepartment('it', updatedItData);
            } catch (error) {
              console.error('Error processing image on canvas:', error);
              showToast('Error processing the photo', 'error');
            }
          };

          // Set the image source to start loading
          img.src = result;
        } catch (error) {
          console.error('Error in FileReader onload handler:', error);
          showToast('Error processing the photo', 'error');
        }
      };

      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        showToast('Error reading the photo file', 'error');

        // Clear photo states to prevent partial/bad data
        setPhoto(null);
        setPhotoBase64("");

        // Reset the file input
        const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      };

      // Start reading the file
      reader.readAsDataURL(file);
    }
  };

  const generatePatientId = async () => {
    setGeneratingId(true);
    try {
      const response = await apiFetch('api/generate_patient_id', {
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
    } catch {
      showToast('Failed to generate patient ID. Please try again.', 'error');
    } finally {
      setGeneratingId(false);
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
    setPhotoBase64(""); // Ensure base64 data is cleared

    // Reset the file input to allow selecting the same file again
    const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
      if (!(patientData as any)[dept]?.isSubmitted) {
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

    setSubmitting(true);
    try {
      const res = await apiFetch("api/submit_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combinedData)
      });
      const result = await res.json();
      if (res.ok && result.message === "Patient data submitted successfully.") {
        showToast("Patient data submitted successfully.", "success");
        resetForm();
        resetPatientData(); // This will clear everything
      } else {
        // Validation/server failures come back as { error: "..." }, not
        // { message: "..." } - showing result.message here rendered the
        // literal text "undefined" in the toast instead of the real reason.
        showToast(result.error || result.message || "Failed to submit patient data.", "error");
      }
    } catch {
      showToast("Error submitting patient data.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearPatientId = () => {
    resetPatientData();  // This will now clear everything including form data
    resetForm(); // This now properly clears photo preview and data
    showToast("Patient data has been reset", "info");
  };

  // Status & Summary lives in a sticky sidebar next to the intake form (see
  // the two-column layout below) so it stays visible while filling in the
  // rest of the form, instead of only appearing once you scroll past Submit.
  const renderStatusSummary = () => (
    <>
      <h4>Status &amp; Summary</h4>
      <div className="hf-status-grid">
        {['ENT', 'Vision', 'General', 'Dental'].map(dept => {
          const done = completedDepts.includes(dept.toLowerCase());
          return (
            <div key={dept} className={`hf-status-tile${done ? ' complete' : ''}`}>
              <b>{dept}</b>
              <span>{done ? 'Completed ✓' : 'Pending…'}</span>
            </div>
          );
        })}
      </div>
      <div>
        <h4 style={{ marginBottom: '.4rem' }}>Patient Information</h4>
        <div style={{ fontSize: '.82rem', color: 'rgb(var(--hf-ink-dim))', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
          <p><b className="text-text font-medium">Name:</b> {name || '-'}</p>
          <p><b className="text-text font-medium">Division:</b> {div || '-'}</p>
          <p><b className="text-text font-medium">Roll No:</b> {rollNo || '-'}</p>
          <p><b className="text-text font-medium">Admin No:</b> {adminNo || '-'}</p>
          <p><b className="text-text font-medium">Gender:</b> {gender || '-'}</p>
          <p><b className="text-text font-medium">DOB:</b> {dob || '-'}</p>
          <p><b className="text-text font-medium">Blood Group:</b> {bloodGroup || '-'}</p>
          <p><b className="text-text font-medium">Mobile:</b> {mobile || '-'}</p>
          <p><b className="text-text font-medium">Medical Officer:</b> {medicalOfficer || '-'}</p>
        </div>
      </div>
    </>
  );

  const renderDeptSummaries = () => {
    const departments = [
      { name: 'ENT', data: patientData.ent },
      { name: 'Vision', data: patientData.vision },
      { name: 'General', data: patientData.general },
      { name: 'Dental', data: patientData.dental }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {departments.map(dept => dept.data && (
          <div key={dept.name} className="hf-dept-summary-card hf-glass">
            <h3>{dept.name} Department Summary</h3>
            <div className="hf-dept-summary-grid">
              {Object.entries(dept.data)
                .filter(([key]) => key !== 'isSubmitted')
                .map(([key, value]) => (
                <div key={key}>
                  <span className="k">
                    {formatSummaryLabel(key)}:
                  </span>
                  <span className="v">{value?.toString() || '-'}</span>
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

  return (
    <div className="max-w-[1180px] mx-auto flex flex-col gap-6 animate-fade-in-up">
      <div className="hf-screen-head">
        <div>
          <h1>IT Dashboard</h1>
          <p>
            Register the patient, capture a photo, then hand off — ENT, Vision, General and Dental
            pick up the moment a patient ID exists. One active draft at a time per clinic.
          </p>
        </div>
      </div>

      <div className="hf-it-layout">
        <div className="hf-form-card hf-glass">
          <div className="hf-form-section">
            <h2>Basic Information</h2>
            <div className="hf-field-row">
              <Field label="Name" value={name} onChange={(v) => handleInputChange('name', v)} placeholder="Full name" />
              <Field label="DIV" value={div} onChange={(v) => handleInputChange('div', v)} placeholder="e.g. 7-B" />
              <Field label="Roll No" value={rollNo} onChange={(v) => handleInputChange('rollNo', v)} />
              <Field label="Admin No" value={adminNo} onChange={(v) => handleInputChange('adminNo', v)} />
            </div>
          </div>

          <div className="hf-form-section">
            <h2>Family &amp; Contact Details</h2>
            <div className="hf-field-row">
              <Field label="Father's Name" value={fatherName} onChange={(v) => handleInputChange('fatherName', v)} />
              <Field label="Mother's Name" value={motherName} onChange={(v) => handleInputChange('motherName', v)} />
              <Field label="Mobile" value={mobile} onChange={(v) => handleInputChange('mobile', v)} />
            </div>
          </div>

          <div className="hf-form-section">
            <h2>Additional Details</h2>
            <div className="hf-field-row">
              <Field label="DOB" type="date" value={dob} onChange={(v) => handleInputChange('dob', v)} />
              <LabeledSelect
                label="Gender"
                value={gender}
                onChange={(v) => handleInputChange('gender', v)}
                options={["Male", "Female", "Other"]}
              />
              <LabeledSelect
                label="Blood Group"
                value={bloodGroup}
                onChange={(v) => handleInputChange('bloodGroup', v)}
                options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "NA"]}
              />
              <Field label="Medical Officer" value={medicalOfficer} onChange={(v) => handleInputChange('medicalOfficer', v)} />
            </div>

            <div className="hf-photo-widget" style={{ marginTop: '1rem' }}>
              <label className="hf-photo-label">Patient Photo</label>
              <input
                id="patient-photo-upload"
                type="file"
                accept="image/*"
                required
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="hf-photo-row">
                <div className="hf-photo-thumb">
                  {photoBase64 ? (
                    <img src={`data:image/jpeg;base64,${photoBase64}`} alt="Patient" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ color: 'rgb(var(--hf-ink-faint))' }}>
                      <circle cx="12" cy="8" r="3.4" />
                      <path d="M4.5 20c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6" />
                    </svg>
                  )}
                </div>
                <div className="hf-photo-actions">
                  <label htmlFor="patient-photo-upload" className="hf-btn hf-btn-ghost hf-btn-sm" style={{ cursor: 'pointer' }}>
                    {photo ? 'Change photo' : 'Upload Photo'}
                  </label>
                  {photo && (
                    <button
                      type="button"
                      className="hf-btn hf-btn-ghost hf-btn-sm danger"
                      aria-label="Delete patient photo"
                      title="Delete photo (will be removed from all devices)"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoBase64("");
                        updateDepartment("it", {
                          ...patientData.it,
                          photo: undefined,
                          photoFileName: undefined,
                        });
                        const fileInput = document.getElementById('patient-photo-upload') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      Delete photo
                    </button>
                  )}
                </div>
              </div>
              <p className="hf-photo-note">
                Resized on your device, then shared live to every connected station — demo photos only,
                never a real patient.
              </p>
            </div>
          </div>

          <div className="hf-form-section">
            {patientData.patientId ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ fontSize: '.73rem', color: 'rgb(var(--hf-ink-dim))', textTransform: 'uppercase', letterSpacing: '.06em' }}>Patient ID</span>
                  <span className="hf-pt-id" style={{ fontSize: '.84rem', color: 'rgb(var(--hf-ink))', background: 'var(--hf-surface-hi)', border: '1px solid var(--hf-border)', borderRadius: 8, padding: '.25rem .5rem', wordBreak: 'break-all' }}>
                    {patientData.patientId}
                  </span>
                </div>
                <button type="button" className="hf-btn hf-btn-ghost hf-btn-sm danger" onClick={handleClearPatientId}>
                  Reset All Data
                </button>
              </div>
            ) : (
              <button type="button" className="hf-btn hf-btn-ghost" onClick={generatePatientId} disabled={generatingId}>
                {generatingId ? "Generating…" : "Register Patient"}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
            <SubmitButton onClick={handleFinalSubmit} loading={submitting} disabled={!patientData.patientId}>
              Submit
            </SubmitButton>
            {!patientData.patientId && (
              <p className="hf-required-note">
                Register the patient above to get a Patient ID before submitting.
              </p>
            )}
          </div>
        </div>

        <aside className="hf-summary-card hf-glass lg:sticky lg:top-0">
          {renderStatusSummary()}
        </aside>
      </div>

      {renderDeptSummaries()}
    </div>
  );
};

export default ITDashboard;
