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
 */
const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  children,
  requirePatientId = true,
  waitingMessage = "Waiting for patient ID from IT Department...",
}) => {
  const { patientData } = useContext(PatientContext);
  const hasPatient = Boolean(patientData.patientId);

  return (
    <div className="p-4 flex flex-col items-center bg-bg min-h-screen font-body">
      <div className="bg-glass backdrop-blur-xl border border-glass-border shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        {requirePatientId && !hasPatient ? (
          <div className="text-center p-8">
            <h2 className="text-xl text-text-dim">{waitingMessage}</h2>
          </div>
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
