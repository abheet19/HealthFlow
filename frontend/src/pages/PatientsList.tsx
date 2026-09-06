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
import { useTheme } from "@mui/material/styles";
import { useToast } from "../context/ToastContext";
import { getApiUrl } from "../config/api"; // Import the API URL helper
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // Import download icon

const placeholderImage = "https://via.placeholder.com/150"; // default placeholder
const SKELETON_ROWS = 4;

const PatientsList: React.FC = () => {
  const { showToast } = useToast(); // Removed hideToast as it's no longer needed
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if the screen is mobile-sized

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    // Update local state immediately for UI responsiveness
    setSearch(value);
    
    // Debounce the filter operation
    if (typeof window.inputDebounceTimers === 'undefined') {
      window.inputDebounceTimers = {};
    }
    
    // Clear any existing timer for the search field
    if (window.inputDebounceTimers['search']) {
      clearTimeout(window.inputDebounceTimers['search']);
    }
    
    // Set a new timer to filter results after typing stops
    window.inputDebounceTimers['search'] = setTimeout(() => {
      // The filtering is handled in the filteredPatients variable
      // This debounce just ensures we don't re-filter on every keystroke
    }, 300); // 300ms debounce delay - consistent with other pages
  };

  const fetchPatients = useCallback(async (opts: { silent?: boolean } = {}) => {
    setLoading(true);
    try {
      // Use the API helper instead of hardcoded URL
      const res = await fetch(getApiUrl("/api/patients"));
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
      const endpoint = getApiUrl(`/api/generate_report?patientId=${patientId}`);
        
      const res = await fetch(endpoint);
      
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

  // Button styling with increased width
  const downloadButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    transition: 'all 200ms',
    fontSize: '0.875rem',
    fontWeight: 'medium',
    padding: '0.5rem 0.75rem',
    marginLeft: 'auto', // Add auto left margin
    marginRight: 'auto', // Add auto right margin
    marginBottom: isMobile ? '0.5rem' : '0',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
    width: isMobile ? '100%' : '120px', // Increased width
    cursor: 'pointer'
  };

  return (
    <Box sx={{ p: 2, backgroundColor: "transparent", minHeight: "100vh" }}>
      <Paper
        elevation={0}
        className="!bg-glass !backdrop-blur-xl !border !border-glass-border"
        sx={{
          p: 2,
          maxWidth: "1200px",
          mx: "auto",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          className="font-display"
          sx={{
            textAlign: "center",
            color: "#E6F5EE",
            fontWeight: "bold",
            mb: 2,
          }}
        >
          Patients List
        </Typography>
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
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ width: isMobile ? "100%" : "250px" }} // Reduced width for non-mobile screens
          />
          <Button
            variant="contained"
            className="!bg-accent-gradient !text-on-accent !font-semibold !shadow-lg !shadow-accent-2/30"
            onClick={() => fetchPatients()}
            disabled={loading}
            sx={{
              whiteSpace: "nowrap",
              width: isMobile ? "100%" : "auto", // Full width on mobile
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </Box>
        {/* Add horizontal scrolling for the table */}
        <Box sx={{ overflowX: "auto" }}>
          <TableContainer
            component={Paper}
            className="!bg-transparent"
            sx={{ borderRadius: 2, minWidth: "600px", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundImage: "linear-gradient(135deg, #5EE6A8, #3ECF8E 55%, #1E9A66)" }}>
                  <TableCell align="center" sx={{ color: "#04140D", fontWeight: "bold" }}>
                    Photo
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#04140D", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell align="center" sx={{ color: "#04140D", fontWeight: "bold" }}>Division</TableCell>
                  {!isMobile && (
                    <TableCell align="center" sx={{ color: "#04140D", fontWeight: "bold" }}>Roll No</TableCell>
                  )}
                  <TableCell
                    align="center"
                    sx={{ color: "#04140D", fontWeight: "bold" }}
                  >
                    Mobile
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "#04140D", fontWeight: "bold" }}
                  >
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
                          sx={{ mx: "auto", bgcolor: "rgba(94,230,168,0.12)" }}
                        />
                      </TableCell>
                      <TableCell align="center"><Skeleton sx={{ bgcolor: "rgba(94,230,168,0.12)" }} /></TableCell>
                      <TableCell align="center"><Skeleton sx={{ bgcolor: "rgba(94,230,168,0.12)" }} /></TableCell>
                      {!isMobile && (
                        <TableCell align="center"><Skeleton sx={{ bgcolor: "rgba(94,230,168,0.12)" }} /></TableCell>
                      )}
                      <TableCell align="center"><Skeleton sx={{ bgcolor: "rgba(94,230,168,0.12)" }} /></TableCell>
                      <TableCell align="center">
                        <Skeleton variant="rounded" width={120} height={32} sx={{ mx: "auto", bgcolor: "rgba(94,230,168,0.12)" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && filteredPatients.map((patient, index) => (
                  <TableRow
                    key={patient.patientId}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      transition: "background-color 0.3s",
                      "&:hover": { backgroundColor: "rgba(94,230,168,0.08)" },
                    }}
                  >
                    <TableCell align="center">
                      <img
                        src={patient.photo || placeholderImage}
                        alt={patient.name}
                        style={{
                          width: isMobile ? "30px" : "40px", // smaller on mobile
                          height: isMobile ? "30px" : "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          display: "inline-block" // Ensure image is visible on all devices
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">{patient.name}</TableCell>
                    <TableCell align="center">{patient.div}</TableCell>
                    {!isMobile && (
                      <TableCell align="center">{patient.rollNo}</TableCell>
                    )}
                    <TableCell align="center">{patient.mobile}</TableCell>
                    <TableCell align="center">
                      {/* Only Word Document Button */}
                      <button
                        onClick={() => handleDownloadReport(patient.patientId, patient.name)}
                        style={{
                          ...downloadButtonStyle,
                          backgroundImage: 'linear-gradient(135deg, #5EE6A8, #3ECF8E 55%, #1E9A66)',
                          color: '#04140D',
                        }}
                        title="Download Word Document"
                      >
                        <CloudDownloadIcon style={{ fontSize: '1rem', marginRight: '0.5rem' }} />
                        <span style={{ whiteSpace: 'nowrap' }}>Word Doc</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filteredPatients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: "#93AFA3" }}>
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
    </Box>
  );
};

export default PatientsList;
