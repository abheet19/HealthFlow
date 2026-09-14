import * as React from "react";
import { useContext } from "react";
import { PatientContext } from "../context/PatientContext";

interface DashboardShellProps {
  /** Page heading shown above the glass card, e.g. "ENT Examination Report" */
  title: string;
  /** One-line subtitle shown under the heading, e.g. what this department covers. */
  description?: string;
  children: React.ReactNode;
  /**
   * Departmental dashboards (ENT/Vision/General/Dental) only make sense once
   * the IT desk has generated a patient ID; the IT dashboard itself is where
   * that ID gets created, so it renders unconditionally.
   */
  requirePatientId?: boolean;
  waitingMessage?: string;
}

/**
 * Shared page chrome for the five department dashboards: the heading, the
 * "Patient ID / Patient Name" banner, the glass card, and the consistent
 * empty-state shown while a department is waiting on a patient ID from IT.
 * Extracted because ENT/Vision/General/Dental repeated this markup
 * byte-for-byte. The surrounding app chrome (sidebar, topbar, scroll area)
 * lives in AppShell, so this only renders what sits inside `.hf-screen-area`.
 *
 * Renders three visually distinct empty states so they can't be mistaken
 * for one another: still connecting to the realtime server (spinner,
 * neutral), connected but genuinely waiting on a patient ID (dashed
 * outline, muted), and a connection that's failing to establish (red
 * accent, retry copy).
 */
const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  description,
  children,
  requirePatientId = true,
  waitingMessage = "Waiting for patient ID from IT Department…",
}) => {
  const { patientData, connectionStatus } = useContext(PatientContext);
  const hasPatient = Boolean(patientData.patientId);

  const renderEmptyState = () => {
    if (connectionStatus === "connecting") {
      return (
        <div className="hf-empty-state connecting" role="status" aria-live="polite">
          <div className="hf-estate-spinner" aria-hidden="true" />
          <h3>Connecting to HealthFlow…</h3>
          <p>Syncing with the clinic in real time</p>
        </div>
      );
    }

    if (connectionStatus === "error") {
      return (
        <div className="hf-empty-state conn-error" role="alert">
          <div className="hf-estate-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Connection lost</h3>
          <p>
            Couldn't reach the HealthFlow server. Check your connection — it will keep retrying automatically.
          </p>
        </div>
      );
    }

    return (
      <div className="hf-empty-state">
        <div className="hf-estate-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h3>{waitingMessage}</h3>
        <p>Register a patient on the IT dashboard, or press ⌘K to jump to one.</p>
      </div>
    );
  };

  return (
    <div key={title} className="max-w-[1180px] mx-auto flex flex-col gap-6 animate-fade-in-up">
      <div className="hf-screen-head">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>

      {requirePatientId && hasPatient && (
        <div className="hf-patient-banner hf-glass">
          <div className="who">
            {patientData.it?.name && <b>{patientData.it.name}</b>}
            <span className="pid">
              {patientData.patientId}
              {patientData.it?.div ? ` · ${patientData.it.div}` : ""}
              {patientData.it?.rollNo ? ` · Roll ${patientData.it.rollNo}` : ""}
            </span>
          </div>
        </div>
      )}

      <div className="hf-form-card hf-glass w-full">
        {requirePatientId && !hasPatient ? renderEmptyState() : children}
      </div>
    </div>
  );
};

export default DashboardShell;
