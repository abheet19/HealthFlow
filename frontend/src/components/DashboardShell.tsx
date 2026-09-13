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
        <div className="text-center p-8 flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" aria-hidden="true" />
          <h2 className="text-xl font-display text-text-dim">Connecting to HealthFlow…</h2>
          <p className="text-sm text-text-faint">Syncing with the realtime server</p>
        </div>
      );
    }

    if (connectionStatus === "error") {
      return (
        <div className="text-center p-8 flex flex-col items-center gap-3" role="alert">
          <div className="h-10 w-10 rounded-full bg-danger/10 border border-danger/50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-display text-danger">Connection lost</h2>
          <p className="text-sm text-text-dim">
            Couldn't reach the HealthFlow server. Check your connection - it will keep retrying automatically.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center p-8 flex flex-col items-center gap-3 border border-dashed border-border-hi rounded-xl">
        <div className="h-10 w-10 rounded-full bg-white/5 border border-glass-border flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h2 className="text-xl font-display text-text-dim">{waitingMessage}</h2>
        <p className="text-sm text-text-faint max-w-xs">Register a patient on the IT dashboard, or press ⌘K to jump to one.</p>
      </div>
    );
  };

  return (
    <div key={title} className="app-screen max-w-[1180px] mx-auto flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-display font-medium text-text">{title}</h1>
        {description && <p className="text-text-faint text-sm mt-1 max-w-[56ch]">{description}</p>}
      </div>

      {requirePatientId && hasPatient && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-glass-border bg-glass backdrop-blur-xl shadow-glass px-5 py-3">
          {patientData.it?.name && <b className="font-display text-lg font-medium text-text">{patientData.it.name}</b>}
          <span className="font-mono text-xs text-text-faint">
            {patientData.patientId}
            {patientData.it?.div ? ` · ${patientData.it.div}` : ""}
            {patientData.it?.rollNo ? ` · Roll ${patientData.it.rollNo}` : ""}
          </span>
        </div>
      )}

      <div className="bg-glass backdrop-blur-xl border border-glass-border shadow-glass rounded-2xl p-6 w-full">
        {requirePatientId && !hasPatient ? renderEmptyState() : children}
      </div>
    </div>
  );
};

export default DashboardShell;
