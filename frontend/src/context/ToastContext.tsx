import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

interface ToastContextProps {
  showToast: (message: string, severity?: "success" | "error" | "info" | "warning", persistent?: boolean) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info" | "warning">("info");
  const [isPersistent, setIsPersistent] = useState(false);

  const showToast = (
    message: string, 
    sev: "success" | "error" | "info" | "warning" = "info",
    persistent: boolean = false
  ) => {
    setToastMessage(message);
    setSeverity(sev);
    setIsPersistent(persistent);
    setOpen(true);
  };

  const hideToast = () => {
    setOpen(false);
  };

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    if (!isPersistent) {
      setOpen(false);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={isPersistent ? null : 3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={handleClose}
      >
        <Alert onClose={isPersistent ? undefined : handleClose} severity={severity} variant="filled" sx={{ width: "100%" }}>
          {toastMessage}
        </Alert>
      </Snackbar>
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
