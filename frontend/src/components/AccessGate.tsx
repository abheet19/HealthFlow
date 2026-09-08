import { FormEvent, useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { saveAccessCode } from "../config/api";

interface AccessGateProps {
  onUnlock: () => void;
}

const AccessGate = ({ onUnlock }: AccessGateProps) => {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setError("Enter the clinic workspace access code.");
      return;
    }
    saveAccessCode(trimmed);
    onUnlock();
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Paper elevation={0} className="!bg-glass !backdrop-blur-xl !border !border-glass-border" sx={{ p: 4, maxWidth: 440, width: "100%" }}>
        <Typography variant="h4" className="font-display" sx={{ color: "#E6F5EE", mb: 1 }}>HealthFlow</Typography>
        <Typography sx={{ color: "#93AFA3", mb: 3 }}>
          Enter the clinic workspace code to access patient records and real-time dashboards.
        </Typography>
        <Box component="form" onSubmit={unlock}>
          <TextField
            fullWidth
            autoFocus
            type="password"
            label="Workspace access code"
            value={accessCode}
            error={Boolean(error)}
            helperText={error || "The code is kept only for this browser session."}
            onChange={(event) => { setAccessCode(event.target.value); setError(""); }}
          />
          <Button type="submit" fullWidth variant="contained" className="!bg-accent-gradient !text-on-accent !font-semibold" sx={{ mt: 2 }}>
            Open workspace
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AccessGate;
