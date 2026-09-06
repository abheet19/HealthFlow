import * as React from "react";
import { useContext } from "react";
import { PatientContext } from "../context/PatientContext";

interface DashboardShellProps {
  /** Page heading shown inside the glass card, e.g. "ENT Examination Report" */
  title: string;
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
 * Shared page chrome for the five department dashboards: the dark glass
 * card, the "Patient ID / Patient Name" header, and the consistent
 * empty-state shown while a department is waiting on a patient ID from IT.
 * Extracted because ENT/Vision/General/Dental repeated this markup
 * byte-for-byte.
 *
 * Renders three visually distinct states so they can't be mistaken for one
 * another: still connecting to the realtime server (spinner, neutral),
 * connected but genuinely waiting on a patient ID (dashed outline, muted),
 * and a connection that's failing to establish (red accent, retry copy).
 */
const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  children,
  requirePatientId = true,
  waitingMessage = "Waiting for patient ID from IT Department...",
}) => {
  const { patientData, connectionStatus } = useContext(PatientContext);
  const hasPatient = Boolean(patientData.patientId);

  const renderEmptyState = () => {
    if (connectionStatus === "connecting") {
      return (
        <div className="text-center p-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <h2 className="text-xl text-text-dim">Connecting to HealthFlow...</h2>
          <p className="text-sm text-text-dim/70">Syncing with the realtime server</p>
        </div>
      );
    }

    if (connectionStatus === "error") {
      return (
        <div className="text-center p-8 flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-danger/10 border border-danger/50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl text-danger">Connection lost</h2>
          <p className="text-sm text-text-dim">
            Couldn't reach the HealthFlow server. Check your connection - it will keep retrying automatically.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center p-8 flex flex-col items-center gap-3 border border-dashed border-glass-border rounded-xl">
        <div className="h-10 w-10 rounded-full bg-white/5 border border-glass-border flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h2 className="text-xl text-text-dim">{waitingMessage}</h2>
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col items-center bg-bg min-h-screen font-body">
      <div
        key={title}
        className="bg-glass backdrop-blur-xl border border-glass-border shadow-lg rounded-2xl p-6 w-full max-w-4xl animate-fade-in-up"
      >
        {requirePatientId && !hasPatient ? (
          renderEmptyState()
        ) : (
          <>
            {requirePatientId && (
              <div className="mb-4 text-text-dim">
                <p>Patient ID: {patientData.patientId}</p>
                {patientData.it?.name && (
                  <p>
                    Patient Name:{" "}
                    <span className="font-bold">{patientData.it.name}</span>
                  </p>
                )}
              </div>
            )}
            <h1 className="text-3xl font-display font-bold mb-6 text-text">
              {title}
            </h1>
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardShell;
