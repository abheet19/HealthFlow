import * as React from "react";
import { useState, useContext, useEffect, useRef } from "react";
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
import { useToast } from "../context/ToastContext";
import { getApiUrl } from "../config/api";  // Import the API URL helper

// Define Timer type to fix NodeJS.Timeout error
type TimerType = ReturnType<typeof setTimeout>;

// Improved tooth selector component with better click handling
const ToothSelector: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (sel: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  // Improved toggleSelection function with explicit handling of selection state
  const toggleSelection = (num: string) => {
    // Create a proper copy of the selected array to avoid reference issues
    let newSelected;
    if (selected.includes(num)) {
      // Remove if present 
      newSelected = selected.filter((item) => item !== num);
    } else {
      // Add if not present
      newSelected = [...selected, num];
    }
    
    // Call onChange with the new array
    onChange(newSelected);
  };
  
  return (
    <div className="flex flex-col space-y-1">
      <span className="font-medium text-sm">{label}:</span>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-8 md:grid-cols-8">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={(e) => {
              e.preventDefault(); // Prevent any default behavior
              e.stopPropagation(); // Stop event propagation
              toggleSelection(num);
            }}
            className={`border rounded px-1 py-1 text-center text-xs ${
              selected.includes(num)
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
  const { updateDepartment, patientData, updatePatientId, resetPatientData } = useContext(PatientContext);
  const { showToast } = useToast();
  const [manualPatientId, setManualPatientId] = useState("");
  const [dentalData, setDentalData] = useState<Record<string, string>>({});
  const [caries, setCaries] = useState("");
  // Add polling interval for data synchronization
  const pollingIntervalRef = useRef<TimerType | null>(null);
  const lastSyncTimestamp = useRef<number>(Date.now());

  const location = useLocation();

  // Read patientId from URL and update context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pid = params.get("patientId");
    if (pid && !patientData.patientId) {
      updatePatientId(pid);
    }
  }, [location, patientData.patientId, updatePatientId]);

  // Extra Oral Examination
  const [extraOral, setExtraOral] = useState("");
  const [dentalRemarks, setDentalRemarks] = useState("");

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

  // Add effect for real-time data sync for cross-device synchronization
  useEffect(() => {
    // Setup polling for data synchronization if we have a patient ID
    if (patientData.patientId) {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Function to fetch latest patient data
      const fetchLatestData = async () => {
        try {
          const res = await fetch(getApiUrl(`/api/get_patient_data?patient_id=${patientData.patientId}&timestamp=${lastSyncTimestamp.current}`));
          const data = await res.json();
          
          // If the data has been updated since our last sync
          if (data.updated) {
            // Update the lastSyncTimestamp
            lastSyncTimestamp.current = Date.now();
            
            // Update the local state with the latest data from the backend
            if (data.dental) {
              // Only update if there's actual data to prevent unnecessary state changes
              loadPatientData(data.dental);
            }
          }
        } catch (error) {
          console.error("Error syncing patient data:", error);
        }
      };
      
      // Start polling for updates every 5 seconds
      pollingIntervalRef.current = setInterval(fetchLatestData, 5000);
    }
    
    // Clean up the interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [patientData.patientId]);

  // Helper function to load patient data into state
  const loadPatientData = (dentalData: any) => {
    if (dentalData) {
      setExtraOral(dentalData.dental_extra_oral || "");
      setDentalRemarks(dentalData.dental_remarks || "");
      
      // Process permanent teeth
      const permanent = dentalData.tooth_cavity_permanent || "";
      const permanentTeeth = permanent.split(",").filter((s: string): boolean => s !== "");
      
      // Separate permanent teeth into their respective groups
      setToothCavityPermanentGroup1(
        permanentTeeth.filter((tooth: string) => ["18", "17", "16", "15", "14", "13", "12", "11"].includes(tooth))
      );
      setToothCavityPermanentGroup2(
        permanentTeeth.filter((tooth: string) => ["21", "22", "23", "24", "25", "26", "27", "28"].includes(tooth))
      );
      setToothCavityPermanentGroup3(
        permanentTeeth.filter((tooth: string) => ["48", "47", "46", "45", "44", "43", "42", "41"].includes(tooth))
      );
      setToothCavityPermanentGroup4(
        permanentTeeth.filter((tooth: string) => ["31", "32", "33", "34", "35", "36", "37", "38"].includes(tooth))
      );
      
      // Process primary teeth
      const primary = dentalData.tooth_cavity_primary || "";
      const primaryTeeth = primary.split(",").filter((s: string): boolean => s !== "");
      
      // Separate primary teeth into their respective groups
      setToothCavityPrimaryGroup1(
        primaryTeeth.filter((tooth: string) => ["55", "54", "53", "52", "51"].includes(tooth))
      );
      setToothCavityPrimaryGroup2(
        primaryTeeth.filter((tooth: string) => ["61", "62", "63", "64", "65"].includes(tooth))
      );
      setToothCavityPrimaryGroup3(
        primaryTeeth.filter((tooth: string) => ["85", "84", "83", "82", "81"].includes(tooth))
      );
      setToothCavityPrimaryGroup4(
        primaryTeeth.filter((tooth: string) => ["71", "72", "73", "74", "75"].includes(tooth))
      );
      
      // Set dropdown values
      setPlaque(dentalData.plaque || "");
      setGumInflammation(dentalData.gum_inflammation || "");
      setStains(dentalData.stains || "");
      setToothDiscoloration(dentalData.tooth_discoloration || "");
      setTarter(dentalData.tarter || "");
      setBadBreath(dentalData.bad_breath || "");
      setGumBleeding(dentalData.gum_bleeding || "");
      setSoftTissue(dentalData.soft_tissue || "");
      setFluorosis(dentalData.fluorosis || "");
      setMalocclusion(dentalData.malocclusion || "");
      setRootStump(dentalData.root_stump || "");
      setMissingTeeth(dentalData.missing_teeth || "");
    }
  };

  // Persist Dental form data across tab switches
  useEffect(() => {
    if (patientData.dental) {
      loadPatientData(patientData.dental);
    }
  }, [patientData.dental]);

  // Add reset effect when patientId is cleared
  useEffect(() => {
    if (!patientData.patientId) {
      resetForm();
    }
  }, [patientData.patientId]);

  // Add event listener for global reset
  useEffect(() => {
    const handleGlobalReset = () => {
      resetForm(); // Reset all form fields
    };
    
    window.addEventListener('patientDataReset', handleGlobalReset);
    
    return () => {
      window.removeEventListener('patientDataReset', handleGlobalReset);
    };
  }, []);

  // Improved function to handle teeth updates for all groups
  const updateTeethData = (updatedData?: {
    permanentGroup1?: string[],
    permanentGroup2?: string[],
    permanentGroup3?: string[],
    permanentGroup4?: string[],
    primaryGroup1?: string[],
    primaryGroup2?: string[],
    primaryGroup3?: string[],
    primaryGroup4?: string[],
  }) => {
    // Use the provided updated data or current state
    const pg1 = updatedData?.permanentGroup1 || toothCavityPermanentGroup1;
    const pg2 = updatedData?.permanentGroup2 || toothCavityPermanentGroup2;
    const pg3 = updatedData?.permanentGroup3 || toothCavityPermanentGroup3;
    const pg4 = updatedData?.permanentGroup4 || toothCavityPermanentGroup4;
    const prg1 = updatedData?.primaryGroup1 || toothCavityPrimaryGroup1;
    const prg2 = updatedData?.primaryGroup2 || toothCavityPrimaryGroup2;
    const prg3 = updatedData?.primaryGroup3 || toothCavityPrimaryGroup3;
    const prg4 = updatedData?.primaryGroup4 || toothCavityPrimaryGroup4;
    
    // Combine all permanent teeth groups
    const allPermanentTeeth = [
      ...pg1,
      ...pg2,
      ...pg3,
      ...pg4,
    ].join(",");
    
    // Combine all primary teeth groups
    const allPrimaryTeeth = [
      ...prg1,
      ...prg2,
      ...prg3,
      ...prg4,
    ].join(",");
    
    // Update both teeth types in the context at once to ensure consistency
    updateDepartment("dental", {
      tooth_cavity_permanent: allPermanentTeeth,
      tooth_cavity_primary: allPrimaryTeeth
    });
    
    // Update the timestamp of the last sync to prevent immediate overwriting
    lastSyncTimestamp.current = Date.now();
  };

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
        onChange={(e) => {
          const newValue = e.target.value as string;
          setValue(newValue);
          
          // Update the field in the context
          const fieldNameMap: Record<string, string> = {
            "Extra-Oral": "dental_extra_oral",
            "Plaque": "plaque",
            "Gum Inflammation": "gum_inflammation",
            "Stains": "stains",
            "Tooth Discoloration": "tooth_discoloration",
            "Tarter": "tarter",
            "Bad Breath": "bad_breath",
            "Gum Bleeding": "gum_bleeding",
            "Soft Tissue": "soft_tissue",
            "Fluorosis": "fluorosis",
            "Malocclusion": "malocclusion",
            "Root Stump": "root_stump",
            "Missing Teeth": "missing_teeth"
          };
          
          // Find the field name to use in the database
          const fieldName = fieldNameMap[label] || label.toLowerCase().replace(/\s+/g, '_');
          handleInputChange(fieldName, newValue);
          
          // Reset dental remarks when Extra-Oral changes to No Abnormality
          if (label === "Extra-Oral" && newValue !== "Abnormality") {
            setDentalRemarks("");
            handleInputChange("dental_remarks", "");
          }
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const resetForm = () => {
    setExtraOral("");
    setDentalRemarks("");
    setToothCavityPermanentGroup1([]);
    setToothCavityPermanentGroup2([]);
    setToothCavityPermanentGroup3([]);
    setToothCavityPermanentGroup4([]);
    setToothCavityPrimaryGroup1([]);
    setToothCavityPrimaryGroup2([]);
    setToothCavityPrimaryGroup3([]);
    setToothCavityPrimaryGroup4([]);
    setPlaque("");
    setGumInflammation("");
    setStains("");
    setToothDiscoloration("");
    setTarter("");
    setBadBreath("");
    setGumBleeding("");
    setSoftTissue("");
    setFluorosis("");
    setMalocclusion("");
    setRootStump("");
    setMissingTeeth("");
  };

  const handleInputChange = (field: string, value: string) => {
    // Debounce the context updates to prevent flickering
    if (typeof window.inputDebounceTimers === 'undefined') {
      window.inputDebounceTimers = {};
    }
    
    // Clear any existing timer for this field
    if (window.inputDebounceTimers[field]) {
      clearTimeout(window.inputDebounceTimers[field]);
    }
    
    // Set a new timer to update context after typing stops
    window.inputDebounceTimers[field] = setTimeout(() => {
      // Update only the specific field that changed
      updateDepartment('dental', { [field]: value });
      
      // Update the timestamp of the last sync to prevent immediate overwriting
      lastSyncTimestamp.current = Date.now();
    }, 300); // 300ms debounce delay - adjust if needed
  };

  const handleSubmit = async () => {
    if (
      !extraOral ||
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
      // Replace alert with toast notification
      showToast("Please fill all required fields.", "error");
      return;
    }
    
    // Validate that dental remarks are provided when Extra-Oral has abnormality
    if (extraOral === "Abnormality" && !dentalRemarks) {
      showToast("Please provide Dental Remarks for the Extra-Oral Abnormality.", "error");
      return;
    }
    
    // Validate Soft Tissue abnormality (no description field available, but we still check for consistency)
    if (softTissue === "Abnormality" && !dentalRemarks) {
      showToast("Please provide Dental Remarks for the Soft Tissue Abnormality.", "error");
      return;
    }

    const data = {
      dental_extra_oral: extraOral,
      dental_remarks: dentalRemarks,
      tooth_cavity_permanent: [
        ...toothCavityPermanentGroup1,
        ...toothCavityPermanentGroup2,
        ...toothCavityPermanentGroup3,
        ...toothCavityPermanentGroup4,
      ].join(","),
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
      isSubmitted: true // Set the submitted flag to true
    };

    updateDepartment("dental", data);
    // Replace alert with toast notification
    showToast("Dental data saved successfully.", "success");
    resetForm();
    resetPatientData("dental");
  };

  const handleFinalSubmit = async () => {
    if (
      !extraOral ||
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
      showToast("Please fill all required fields.", "error");
      return;
    }
    try {
      const res = await fetch(getApiUrl("/api/submit_dental"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dental_extra_oral: extraOral,
          dental_remarks: dentalRemarks,
          tooth_cavity_permanent: [
            ...toothCavityPermanentGroup1,
            ...toothCavityPermanentGroup2,
            ...toothCavityPermanentGroup3,
            ...toothCavityPermanentGroup4,
          ].join(","),
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
        }),
      });
      const result = await res.json();
      if (result.message === "Dental info submitted successfully.") {
        showToast("Dental data submitted successfully.", "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error submitting Dental data.", "error");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        {patientData.patientId ? (
          <>
            <div className="mb-4 text-gray-600">
              <p>Patient ID: {patientData.patientId}</p>
              {patientData.it?.name && (
                <p>Patient Name: <span className="font-bold">{patientData.it.name}</span></p>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
              Dental Examination Report
            </h1>
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Extra Oral Examination
              </h2>
              <div className="flex flex-wrap gap-4">
                {dropdown("Extra-Oral", extraOral, setExtraOral, [
                  "No Abnormality",
                  "Abnormality",
                ])}
                <div className="w-full sm:w-64 relative">
                  <TextField
                    label="Dental Remarks"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={dentalRemarks}
                    onChange={(e) => {
                      setDentalRemarks(e.target.value);
                      handleInputChange("dental_remarks", e.target.value);
                    }}
                  />
                  <button 
                    type="button" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                    onClick={() => {
                      const newValue = dentalRemarks === "NA" ? "" : "NA";
                      setDentalRemarks(newValue);
                      handleInputChange("dental_remarks", newValue);
                    }}
                  >
                    NA
                  </button>
                </div>
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
                      onChange={(selected) => {
                        setToothCavityPermanentGroup1(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ permanentGroup1: selected });
                      }}
                    />
                    <ToothSelector
                      label="Permanent Group 2"
                      options={["21", "22", "23", "24", "25", "26", "27", "28"]}
                      selected={toothCavityPermanentGroup2}
                      onChange={(selected) => {
                        setToothCavityPermanentGroup2(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ permanentGroup2: selected });
                      }}
                    />
                    <ToothSelector
                      label="Permanent Group 3"
                      options={["48", "47", "46", "45", "44", "43", "42", "41"]}
                      selected={toothCavityPermanentGroup3}
                      onChange={(selected) => {
                        setToothCavityPermanentGroup3(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ permanentGroup3: selected });
                      }}
                    />
                    <ToothSelector
                      label="Permanent Group 4"
                      options={["31", "32", "33", "34", "35", "36", "37", "38"]}
                      selected={toothCavityPermanentGroup4}
                      onChange={(selected) => {
                        setToothCavityPermanentGroup4(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ permanentGroup4: selected });
                      }}
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
                      onChange={(selected) => {
                        setToothCavityPrimaryGroup1(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ primaryGroup1: selected });
                      }}
                    />
                    <ToothSelector
                      label="Primary Group 2"
                      options={["61", "62", "63", "64", "65"]}
                      selected={toothCavityPrimaryGroup2}
                      onChange={(selected) => {
                        setToothCavityPrimaryGroup2(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ primaryGroup2: selected });
                      }}
                    />
                    <ToothSelector
                      label="Primary Group 3"
                      options={["85", "84", "83", "82", "81"]}
                      selected={toothCavityPrimaryGroup3}
                      onChange={(selected) => {
                        setToothCavityPrimaryGroup3(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ primaryGroup3: selected });
                      }}
                    />
                    <ToothSelector
                      label="Primary Group 4"
                      options={["71", "72", "73", "74", "75"]}
                      selected={toothCavityPrimaryGroup4}
                      onChange={(selected) => {
                        setToothCavityPrimaryGroup4(selected);
                        // Update teeth data immediately with the new selection
                        updateTeethData({ primaryGroup4: selected });
                      }}
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
                Save
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <h2 className="text-xl text-gray-600">
              Waiting for patient ID from IT Department...
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default DentalDashboard;
