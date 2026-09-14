import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Severity = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  severity: Severity;
  persistent: boolean;
  leaving: boolean;
}

interface ToastContextProps {
  showToast: (message: string, severity?: Severity, persistent?: boolean) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

const VISIBLE_MS = 3400;
const LEAVE_MS = 260;

// Maps MUI-era severities onto the design artifact's glass toast tones:
// success -> `.ok` (good), error -> `.err` (critical), info/warning -> the
// neutral frosted glass pill (ink text) so nothing renders as default Material.
const toneClass = (severity: Severity): string =>
  severity === "success" ? "ok" : severity === "error" ? "err" : "";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      // Play the leave transition, then unmount.
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => remove(id), LEAVE_MS);
    },
    [remove],
  );

  const showToast = useCallback(
    (message: string, severity: Severity = "info", persistent = false) => {
      const id = nextId.current++;
      setToasts(prev => [...prev, { id, message, severity, persistent, leaving: false }]);
      if (!persistent) {
        window.setTimeout(() => dismiss(id), VISIBLE_MS);
      }
    },
    [dismiss],
  );

  const hideToast = useCallback(() => {
    setToasts(prev => prev.map(t => ({ ...t, leaving: true })));
    window.setTimeout(() => setToasts([]), LEAVE_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {createPortal(
        <div className="hf-toast-stack" aria-live="polite">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`hf-glass hf-toast ${toneClass(t.severity)}${t.leaving ? " leaving" : ""}`.trim()}
              role={t.severity === "error" ? "alert" : "status"}
              onClick={() => dismiss(t.id)}
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
