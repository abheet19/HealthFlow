import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Box,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../config/api"; // Import the API URL helper
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // Import download icon

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
  const { showToast } = useToast(); // Removed hideToast as it's no longer needed
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if the screen is mobile-sized

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

  return (
    <Box component="section" sx={{ maxWidth: "1180px", mx: "auto" }}>
      <Paper
        elevation={0}
        className="!bg-glass !backdrop-blur-xl !border !border-glass-border !shadow-glass"
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", mb: 3 }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end", justifyContent: "space-between", mb: 2.5 }}>
          <Box>
            <Typography variant="h4" component="h1" className="font-display" sx={{ fontWeight: 500, color: "text.primary" }}>
              Patients List
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: ".86rem", mt: .5, maxWidth: "56ch" }}>
              Every checkup that IT has fully submitted. The list only reflects what's in the database as of the last Refresh.
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row", // Stack vertically on mobile
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            label="Search by Name"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: isMobile ? "100%" : "260px" }}
          />
          <Button
            variant="contained"
            className="!bg-accent-gradient !text-on-accent !font-semibold !shadow-lg !shadow-accent-2/30"
            onClick={() => fetchPatients()}
            disabled={loading}
            sx={{ whiteSpace: "nowrap", width: isMobile ? "100%" : "auto", marginLeft: isMobile ? 0 : "auto" }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </Box>
        {/* Add horizontal scrolling for the table */}
        <Box sx={{ overflowX: "auto" }}>
          <TableContainer
            component={Paper}
            className="!bg-transparent"
            sx={{ borderRadius: 2, minWidth: "600px", border: `1px solid ${theme.palette.divider}` }}
          >
            <Table size="small" aria-label="Synthetic patient records">
              <caption className="sr-only">Synthetic patient records and report downloads</caption>
              <TableHead>
                <TableRow sx={{ backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}>
                  <TableCell align="center" sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>
                    Photo
                  </TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>Name</TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>Division</TableCell>
                  {!isMobile && (
                    <TableCell align="center" sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>Roll No</TableCell>
                  )}
                  <TableCell align="center" sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>
                    Mobile
                  </TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && patients.length === 0 &&
                  Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell align="center">
                        <Skeleton
                          variant="circular"
                          width={isMobile ? 30 : 40}
                          height={isMobile ? 30 : 40}
                          sx={{ mx: "auto", bgcolor: alpha(theme.palette.primary.main, 0.12) }}
                        />
                      </TableCell>
                      <TableCell align="center"><Skeleton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12) }} /></TableCell>
                      <TableCell align="center"><Skeleton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12) }} /></TableCell>
                      {!isMobile && (
                        <TableCell align="center"><Skeleton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12) }} /></TableCell>
                      )}
                      <TableCell align="center"><Skeleton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12) }} /></TableCell>
                      <TableCell align="center">
                        <Skeleton variant="rounded" width={120} height={32} sx={{ mx: "auto", bgcolor: alpha(theme.palette.primary.main, 0.12) }} />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && filteredPatients.map((patient, index) => (
                  <TableRow
                    key={patient.patientId}
                    sx={{
                      backgroundColor: index % 2 === 0 ? alpha(theme.palette.text.primary, 0.03) : "transparent",
                      transition: "background-color 0.3s",
                      "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <TableCell align="center">
                      {patient.photo ? (
                        <img
                          src={patient.photo}
                          alt={patient.name}
                          style={{
                            width: isMobile ? 30 : 40,
                            height: isMobile ? 30 : 40,
                            borderRadius: "50%",
                            objectFit: "cover",
                            display: "inline-block",
                          }}
                        />
                      ) : (
                        <Box
                          component="span"
                          sx={{
                            width: isMobile ? 30 : 40,
                            height: isMobile ? 30 : 40,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontWeight: 700,
                            fontSize: isMobile ? 11 : 13,
                            color: theme.palette.primary.contrastText,
                            backgroundColor: `rgb(var(${ROW_HUES[index % ROW_HUES.length]}))`,
                          }}
                        >
                          {patient.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "PT"}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{patient.name}</TableCell>
                    <TableCell align="center">{patient.div}</TableCell>
                    {!isMobile && (
                      <TableCell align="center">{patient.rollNo}</TableCell>
                    )}
                    <TableCell align="center" className="font-mono">{patient.mobile}</TableCell>
                    <TableCell align="center">
                      <Button
                        onClick={() => handleDownloadReport(patient.patientId, patient.name)}
                        aria-label={`Download Word document for ${patient.name}`}
                        title="Download Word Document"
                        size="small"
                        variant="contained"
                        className="!bg-accent-gradient !normal-case"
                        sx={{ color: theme.palette.primary.contrastText, whiteSpace: "nowrap" }}
                        startIcon={<CloudDownloadIcon style={{ fontSize: "1rem" }} />}
                      >
                        Word Doc
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filteredPatients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      {patients.length === 0
                        ? "No patients registered yet - submissions from the IT dashboard will show up here."
                        : `No patients match "${search}".`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        className="!bg-glass !backdrop-blur-xl !border !border-glass-border !shadow-glass"
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px" }}
      >
        <Typography variant="h6" className="font-display" sx={{ fontWeight: 700, mb: 1.5 }}>About this workspace</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {STACK_CHIPS.map(chip => (
            <Box
              key={chip}
              component="span"
              className="font-mono"
              sx={{
                fontSize: ".72rem",
                color: "text.secondary",
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                px: 1, py: .4, borderRadius: "7px",
              }}
            >
              {chip}
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: ".8rem", color: "text.secondary", lineHeight: 1.7 }}>
          Synthetic demonstration data only - no real patient, school, employee, or health information.
          HealthFlow coordinates one school health-camp checkup per clinic: IT, ENT, Vision, General and
          Dental edit a single shared draft in real time, and only IT's final Submit writes a row to
          PostgreSQL. It is not an EHR, clinical decision system, role-authorized platform, or
          compliance-ready product - no SSO, MFA, consent management, or audit trail.
        </Typography>
        <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", fontSize: ".82rem", mt: 2 }}>
          <a href="https://healthflow-abheet19.fly.dev" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: "none" }}>
            Live workspace ↗
          </a>
          <a href="https://github.com/abheet19/HealthFlow" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: "none" }}>
            Source on GitHub ↗
          </a>
          <a href="https://github.com/abheet19" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: "none" }}>
            More from abheet19 ↗
          </a>
        </Box>
      </Paper>
    </Box>
  );
};

export default PatientsList;
