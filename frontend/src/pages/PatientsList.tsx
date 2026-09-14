import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../config/api"; // Import the API URL helper

const SKELETON_ROWS = 4;

// A rotating set of per-record accent hues (the same family used for
// department color-coding elsewhere) so rows in a long list stay visually
// distinct without any single row carrying meaning by its color alone.
const ROW_HUES = ["--hf-hue-it", "--hf-hue-ent", "--hf-hue-vision", "--hf-hue-general", "--hf-hue-dental"];

const STACK_CHIPS = ["React 18", "TypeScript", "Vite", "MUI", "Socket.IO", "Flask", "Flask-SocketIO", "PostgreSQL 17", "python-docx", "Fly.io"];

interface PatientListItem {
  patientId: string;
  name: string;
  div?: string;
  rollNo?: string;
  mobile?: string;
  photo?: string;
}

const PatientsList: React.FC = () => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(async (opts: { silent?: boolean } = {}) => {
    setLoading(true);
    try {
      // Use the API helper instead of hardcoded URL
      const res = await apiFetch("/api/patients");
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      const data = await res.json();
      setPatients(data.patients || []);
      // Only toast on an explicit user-triggered refresh, not the initial load
      if (!opts.silent) {
        showToast("Patients list refreshed successfully", "success");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      showToast(
        `Error fetching patients: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPatients({ silent: true });
  }, [fetchPatients]);

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase())
  );

  // Simplified download report handler (DOCX only):
  const handleDownloadReport = async (
    patientId: string,
    patientName: string
  ) => {
    try {
      const res = await apiFetch(`/api/generate_report?patientId=${encodeURIComponent(patientId)}`);

      if (!res.ok) throw new Error(`Failed to download DOCX report`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${patientName}'s Report.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Show success toast
      showToast(`DOCX report downloaded successfully`, "success");
    } catch (error) {
      console.error(error);
      showToast(`Failed to download DOCX report`, "error");
    }
  };

  const showSkeleton = loading && patients.length === 0;
  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "PT";

  return (
    <div className="max-w-[1180px] mx-auto flex flex-col gap-6 animate-fade-in-up">
      <div className="hf-screen-head">
        <div>
          <h1>Patients List</h1>
          <p>
            Every synthetic checkup that IT has fully submitted. The list only reflects what's in the
            database as of the last Refresh.
          </p>
        </div>
        <div className="hf-actions">
          <button
            type="button"
            className="hf-btn hf-btn-primary"
            onClick={() => fetchPatients()}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="hf-toolbar">
        <div className="hf-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by Name…"
            aria-label="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="hf-table-scroll">
        <table className="hf-data-table">
          <caption className="sr-only">Synthetic patient records and report downloads</caption>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Division</th>
              <th>Roll No</th>
              <th>Mobile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td><div className="hf-skeleton hf-skel-circle" /></td>
                  <td><div className="hf-skeleton hf-skel-line" /></td>
                  <td><div className="hf-skeleton hf-skel-line" /></td>
                  <td><div className="hf-skeleton hf-skel-line" /></td>
                  <td><div className="hf-skeleton hf-skel-line" /></td>
                  <td><div className="hf-skeleton" style={{ width: 96, height: 30 }} /></td>
                </tr>
              ))}
            {!loading &&
              filteredPatients.map((patient, index) => (
                <tr key={patient.patientId}>
                  <td>
                    {patient.photo ? (
                      <img
                        src={patient.photo}
                        alt={patient.name}
                        style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <span
                        className="hf-avatar"
                        style={{ "--hf-dc": `rgb(var(${ROW_HUES[index % ROW_HUES.length]}))` } as React.CSSProperties}
                      >
                        {initials(patient.name)}
                      </span>
                    )}
                  </td>
                  <td><span className="hf-pt-name">{patient.name}</span></td>
                  <td>{patient.div}</td>
                  <td>{patient.rollNo}</td>
                  <td className="font-mono">{patient.mobile}</td>
                  <td>
                    <button
                      type="button"
                      className="hf-btn hf-btn-ghost hf-btn-sm"
                      onClick={() => handleDownloadReport(patient.patientId, patient.name)}
                      aria-label={`Download Word document for ${patient.name}`}
                      title="Download Word Document"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                      </svg>
                      Word Doc
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && filteredPatients.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "rgb(var(--hf-ink-faint))" }}>
                  {patients.length === 0
                    ? "No patients registered yet — submissions from the IT dashboard will show up here."
                    : `No patients match "${search}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="hf-glass" style={{ padding: "1.2rem 1.3rem", borderRadius: 16, display: "flex", flexDirection: "column", gap: ".9rem" }}>
        <h3 style={{ fontSize: "1rem", fontFamily: "var(--font-display, serif)" }} className="font-display font-medium text-text">About this workspace</h3>
        <div className="hf-stack-chips">
          {STACK_CHIPS.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
        <p className="hf-disclaimer">
          Synthetic demonstration data only — no real patient, school, employee, or health information.
          HealthFlow coordinates one school health-camp checkup per clinic: IT, ENT, Vision, General and
          Dental edit a single shared draft in real time, and only IT's final Submit writes a row to
          PostgreSQL. It is not an EHR, clinical decision system, role-authorized platform, or
          compliance-ready product — no SSO, MFA, consent management, or audit trail.
        </p>
        <div style={{ display: "flex", gap: ".9rem", flexWrap: "wrap", fontSize: ".82rem" }}>
          <a href="https://healthflow-abheet19.fly.dev" target="_blank" rel="noopener noreferrer" style={{ color: "rgb(var(--hf-accent))", textDecoration: "none" }}>
            Live workspace ↗
          </a>
          <a href="https://github.com/abheet19/HealthFlow" target="_blank" rel="noopener noreferrer" style={{ color: "rgb(var(--hf-accent))", textDecoration: "none" }}>
            Source on GitHub ↗
          </a>
          <a href="https://github.com/abheet19" target="_blank" rel="noopener noreferrer" style={{ color: "rgb(var(--hf-accent))", textDecoration: "none" }}>
            More from abheet19 ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default PatientsList;
