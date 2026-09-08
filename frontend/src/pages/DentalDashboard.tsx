import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TextField } from "@mui/material";
import { PatientContext } from "../context/PatientContext";
import { useToast } from "../context/ToastContext";
import DashboardShell from "../components/DashboardShell";
import LabeledSelect from "../components/LabeledSelect";
import SubmitButton from "../components/SubmitButton";

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
      <span className="font-medium text-sm text-text">{label}:</span>
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
            className={`border rounded px-1 py-1 text-center text-xs transition-colors ${
              selected.includes(num)
                ? "bg-accent-gradient text-on-accent border-transparent"
                : "bg-white/5 border-glass-border text-text-dim hover:bg-white/10"
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
  const { updateDepartment, patientData, updatePatientId } = useContext(PatientContext);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

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
  };

  const FIELD_NAME_MAP: Record<string, string> = {
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
    "Missing Teeth": "missing_teeth",
  };

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
    // Apply a field patch immediately: a pending debounce must not overwrite a save/reset.
    updateDepartment('dental', { [field]: value });
  };

  const handleDropdownChange = (label: string, setValue: (v: string) => void) => (value: string) => {
    setValue(value);
    const fieldName = FIELD_NAME_MAP[label] || label.toLowerCase().replace(/\s+/g, '_');
    handleInputChange(fieldName, value);

    // Reset dental remarks when Extra-Oral changes to No Abnormality
    if (label === "Extra-Oral" && value !== "Abnormality") {
      setDentalRemarks("");
      handleInputChange("dental_remarks", "");
    }
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

    setSaving(true);
    try {
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
      showToast("Dental data saved successfully.", "success");
      resetForm();
    } catch {
      showToast("Error saving Dental data.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="Dental Examination Report">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
          Extra Oral Examination
        </h2>
        <div className="flex flex-wrap gap-4">
          <LabeledSelect
            label="Extra-Oral"
            value={extraOral}
            onChange={handleDropdownChange("Extra-Oral", setExtraOral)}
            options={["No Abnormality", "Abnormality"]}
          />
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
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs border border-glass-border rounded hover:bg-white/10 text-text-dim"
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

      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-text">
          Intra Oral Examination
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2 text-text-dim">
              Tooth Cavity (Permanent Teeth)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToothSelector
                label="Permanent Group 1"
                options={["18", "17", "16", "15", "14", "13", "12", "11"]}
                selected={toothCavityPermanentGroup1}
                onChange={(selected) => {
                  setToothCavityPermanentGroup1(selected);
                  updateTeethData({ permanentGroup1: selected });
                }}
              />
              <ToothSelector
                label="Permanent Group 2"
                options={["21", "22", "23", "24", "25", "26", "27", "28"]}
                selected={toothCavityPermanentGroup2}
                onChange={(selected) => {
                  setToothCavityPermanentGroup2(selected);
                  updateTeethData({ permanentGroup2: selected });
                }}
              />
              <ToothSelector
                label="Permanent Group 3"
                options={["48", "47", "46", "45", "44", "43", "42", "41"]}
                selected={toothCavityPermanentGroup3}
                onChange={(selected) => {
                  setToothCavityPermanentGroup3(selected);
                  updateTeethData({ permanentGroup3: selected });
                }}
              />
              <ToothSelector
                label="Permanent Group 4"
                options={["31", "32", "33", "34", "35", "36", "37", "38"]}
                selected={toothCavityPermanentGroup4}
                onChange={(selected) => {
                  setToothCavityPermanentGroup4(selected);
                  updateTeethData({ permanentGroup4: selected });
                }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-text-dim">
              Tooth Cavity (Primary Teeth)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToothSelector
                label="Primary Group 1"
                options={["55", "54", "53", "52", "51"]}
                selected={toothCavityPrimaryGroup1}
                onChange={(selected) => {
                  setToothCavityPrimaryGroup1(selected);
                  updateTeethData({ primaryGroup1: selected });
                }}
              />
              <ToothSelector
                label="Primary Group 2"
                options={["61", "62", "63", "64", "65"]}
                selected={toothCavityPrimaryGroup2}
                onChange={(selected) => {
                  setToothCavityPrimaryGroup2(selected);
                  updateTeethData({ primaryGroup2: selected });
                }}
              />
              <ToothSelector
                label="Primary Group 3"
                options={["85", "84", "83", "82", "81"]}
                selected={toothCavityPrimaryGroup3}
                onChange={(selected) => {
                  setToothCavityPrimaryGroup3(selected);
                  updateTeethData({ primaryGroup3: selected });
                }}
              />
              <ToothSelector
                label="Primary Group 4"
                options={["71", "72", "73", "74", "75"]}
                selected={toothCavityPrimaryGroup4}
                onChange={(selected) => {
                  setToothCavityPrimaryGroup4(selected);
                  updateTeethData({ primaryGroup4: selected });
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <LabeledSelect label="Plaque" value={plaque} onChange={handleDropdownChange("Plaque", setPlaque)} options={["Present", "Absent"]} />
            <LabeledSelect label="Gum Inflammation" value={gumInflammation} onChange={handleDropdownChange("Gum Inflammation", setGumInflammation)} options={["Present", "Absent"]} />
            <LabeledSelect label="Stains" value={stains} onChange={handleDropdownChange("Stains", setStains)} options={["Present", "Absent"]} />
            <LabeledSelect label="Tooth Discoloration" value={toothDiscoloration} onChange={handleDropdownChange("Tooth Discoloration", setToothDiscoloration)} options={["Present", "Absent"]} />
            <LabeledSelect label="Tarter" value={tarter} onChange={handleDropdownChange("Tarter", setTarter)} options={["Present", "Absent"]} />
            <LabeledSelect label="Bad Breath" value={badBreath} onChange={handleDropdownChange("Bad Breath", setBadBreath)} options={["Present", "Absent"]} />
            <LabeledSelect label="Gum Bleeding" value={gumBleeding} onChange={handleDropdownChange("Gum Bleeding", setGumBleeding)} options={["Present", "Absent"]} />
            <LabeledSelect label="Soft Tissue" value={softTissue} onChange={handleDropdownChange("Soft Tissue", setSoftTissue)} options={["No Abnormality", "Abnormality"]} />
            <LabeledSelect label="Fluorosis" value={fluorosis} onChange={handleDropdownChange("Fluorosis", setFluorosis)} options={["Present", "Absent"]} />
            <LabeledSelect label="Malocclusion" value={malocclusion} onChange={handleDropdownChange("Malocclusion", setMalocclusion)} options={["Present", "Absent"]} />
            <LabeledSelect label="Root Stump" value={rootStump} onChange={handleDropdownChange("Root Stump", setRootStump)} options={["Present", "Absent"]} />
            <LabeledSelect label="Missing Teeth" value={missingTeeth} onChange={handleDropdownChange("Missing Teeth", setMissingTeeth)} options={["Present", "Absent"]} />
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <SubmitButton onClick={handleSubmit} loading={saving}>
          Save
        </SubmitButton>
      </div>
    </DashboardShell>
  );
};

export default DentalDashboard;
