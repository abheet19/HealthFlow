import { FormEvent, useState } from "react";
import {
  DEFAULT_CLINIC_ID,
  DEFAULT_USER_ID,
  getApiUrl,
  saveWorkspaceCredentials,
} from "../config/api";

interface AccessGateProps {
  onUnlock: () => void;
}

const AccessGate = ({ onUnlock }: AccessGateProps) => {
  const [accessCode, setAccessCode] = useState("");
  const [clinicId, setClinicId] = useState(DEFAULT_CLINIC_ID);
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = accessCode.trim();
    const trimmedClinicId = clinicId.trim();
    const trimmedUserId = userId.trim();
    if (!trimmed || !trimmedClinicId || !trimmedUserId) {
      setError("Enter the clinic ID, user ID, and workspace access code.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(getApiUrl("/api/session"), {
        headers: {
          "X-HealthFlow-Access-Code": trimmed,
          "X-HealthFlow-Clinic-Id": trimmedClinicId,
          "X-HealthFlow-User-Id": trimmedUserId,
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "That workspace code is not valid."
            : "The workspace is unavailable. Try again shortly.",
        );
        return;
      }
      saveWorkspaceCredentials({
        accessCode: trimmed,
        clinicId: trimmedClinicId,
        userId: trimmedUserId,
      });
      onUnlock();
    } catch {
      setError("The workspace is unavailable. Try again shortly.");
    } finally {
      setPending(false);
    }
  };

  const helperId = "workspace-code-helper";

  return (
    <main className="hf-login">
      <div className="hf-ambient" aria-hidden="true" />
      <section className="hf-access-card bg-glass backdrop-blur-xl border border-glass-border shadow-glass animate-fade-in-up">
        <div className="hf-brand-row">
          <div className="hf-brand-mark" aria-hidden="true" />
          <div>
            <div className="hf-brand-word">HealthFlow</div>
            <div className="hf-brand-tag font-mono">school health-camp workspace</div>
          </div>
        </div>
        <h1>Open a clinic workspace</h1>
        <p className="hf-sub">
          Enter the clinic workspace code to access patient records and real-time dashboards.
        </p>
        <form className="hf-access-fields" onSubmit={unlock}>
          <div className="hf-access-fields-row">
            <div className="hf-field">
              <label htmlFor="workspace-clinic-id">Clinic ID</label>
              <input
                id="workspace-clinic-id"
                autoComplete="organization"
                spellCheck={false}
                value={clinicId}
                disabled={pending}
                onChange={event => {
                  setClinicId(event.target.value);
                  setError("");
                }}
              />
            </div>
            <div className="hf-field">
              <label htmlFor="workspace-user-id">User ID</label>
              <input
                id="workspace-user-id"
                autoComplete="username"
                spellCheck={false}
                value={userId}
                disabled={pending}
                onChange={event => {
                  setUserId(event.target.value);
                  setError("");
                }}
              />
            </div>
          </div>
          <div className="hf-field">
            <label htmlFor="workspace-access-code">Workspace access code</label>
            <input
              id="workspace-access-code"
              autoComplete="current-password"
              type="password"
              spellCheck={false}
              value={accessCode}
              aria-describedby={helperId}
              aria-invalid={Boolean(error)}
              disabled={pending}
              onChange={event => {
                setAccessCode(event.target.value);
                setError("");
              }}
            />
          </div>
          <button
            className="hf-btn hf-btn-primary"
            style={{ width: "100%", marginTop: ".3rem" }}
            disabled={pending}
            type="submit"
          >
            {pending ? "Checking code…" : "Open workspace"}
          </button>
          <p
            id={helperId}
            className={`hf-status-line${error ? " bad" : ""}`}
            role={error ? "alert" : "status"}
          >
            {error || "The code is kept only for this browser session."}
          </p>
        </form>
      </section>
    </main>
  );
};

export default AccessGate;
