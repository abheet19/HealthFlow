import { FormEvent, useState } from "react";
import { getApiUrl, saveAccessCode } from "../config/api";

interface AccessGateProps {
  onUnlock: () => void;
}

const AccessGate = ({ onUnlock }: AccessGateProps) => {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setError("Enter the clinic workspace access code.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(getApiUrl("/api/session"), {
        headers: { "X-HealthFlow-Access-Code": trimmed },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "That workspace code is not valid."
            : "The workspace is unavailable. Try again shortly.",
        );
      }
      saveAccessCode(trimmed);
      onUnlock();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the workspace.");
    } finally {
      setPending(false);
    }
  };

  const helperId = "workspace-code-helper";

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <section className="w-full max-w-[440px] rounded-2xl border border-glass-border bg-glass p-8 shadow-2xl backdrop-blur-xl animate-fade-in-up">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-accent-gradient text-2xl font-bold text-on-accent shadow-lg shadow-accent-2/30" aria-hidden="true">
          +
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-text">HealthFlow</h1>
        <p className="mt-2 mb-7 leading-relaxed text-text-dim">
          Enter the clinic workspace code to access patient records and real-time dashboards.
        </p>
        <form onSubmit={unlock}>
          <label className="mb-2 block text-sm font-medium text-text" htmlFor="workspace-access-code">
            Workspace access code
          </label>
          <input
            id="workspace-access-code"
            className="w-full rounded-xl border border-glass-border bg-bg/70 px-4 py-3 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            autoFocus
            type="password"
            value={accessCode}
            aria-describedby={helperId}
            aria-invalid={Boolean(error)}
            disabled={pending}
            onChange={event => {
              setAccessCode(event.target.value);
              setError("");
            }}
          />
          <p
            id={helperId}
            className={`mt-2 min-h-5 text-sm ${error ? "text-danger" : "text-text-dim"}`}
            role={error ? "alert" : undefined}
          >
            {error || "The code is kept only for this browser session."}
          </p>
          <button
            className="mt-4 w-full rounded-xl bg-accent-gradient px-4 py-3 font-semibold text-on-accent shadow-lg shadow-accent-2/20 transition hover:-translate-y-0.5 hover:shadow-accent-2/30 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            disabled={pending}
            type="submit"
          >
            {pending ? "Checking code…" : "Open workspace"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default AccessGate;
