import * as React from "react";
import { useState, useEffect } from "react";
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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useToast } from "../context/ToastContext"; // added import
import { getApiUrl } from "../config/api"; // Import the API URL helper
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // Import download icon
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // Import PDF icon

const placeholderImage = "https://via.placeholder.com/150"; // default placeholder

const PatientsList: React.FC = () => {
  const { showToast, hideToast } = useToast(); // added toast hook
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if the screen is mobile-sized

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Use the API helper instead of hardcoded URL
      const res = await fetch(getApiUrl("/api/patients"));
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      const data = await res.json();
      setPatients(data.patients || []);
      showToast("Patients list refreshed successfully", "success"); // show toast on refresh success
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
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase())
  );

  // Modified download report handler:
  const handleDownloadReport = async (
    patientId: string,
    patientName: string,
    format: 'docx' | 'pdf' = 'docx'
  ) => {
    try {
      // For PDF, show a persistent toast that won't disappear until process completes
      if (format === 'pdf') {
        showToast("PDF generation in progress...", "info", true);
      }
      
      const endpoint = format === 'pdf' 
        ? getApiUrl(`/api/generate_pdf_report?patientId=${patientId}`)
        : getApiUrl(`/api/generate_report?patientId=${patientId}`);
        
      const res = await fetch(endpoint);
      
      if (!res.ok) throw new Error(`Failed to download ${format.toUpperCase()} report`);
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${patientName}'s Report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      // For PDF, hide the persistent toast first
      if (format === 'pdf') {
        hideToast();
      }
      
      // Show success toast
      showToast(`${format.toUpperCase()} report downloaded successfully`, "success");
    } catch (error) {
      console.error(error);
      
      // For PDF, hide the persistent toast first
      if (format === 'pdf') {
        hideToast();
      }
      
      showToast(`Failed to download ${format.toUpperCase()} report`, "error");
    }
  };

  // Updated button styling with increased width
  const downloadButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    transition: 'all 200ms',
    fontSize: '0.875rem',
    fontWeight: 'medium',
    padding: '0.5rem 0.75rem',
    marginRight: '0.5rem',
    marginBottom: isMobile ? '0.5rem' : '0',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
    width: isMobile ? '100%' : '120px', // Increased width
    cursor: 'pointer'
  };

  return (
    <Box sx={{ p: 2, backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          maxWidth: "1200px",
          mx: "auto",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            color: "black",
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
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: isMobile ? "100%" : "250px" }} // Reduced width for non-mobile screens
          />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchPatients}
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
            sx={{ borderRadius: 2, minWidth: "600px" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Photo
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Division</TableCell>
                  {!isMobile && (
                    <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Roll No</TableCell>
                  )}
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Mobile
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPatients.map((patient, index) => (
                  <TableRow
                    key={patient.patientId}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "#f5f5f5" : "white",
                      transition: "background-color 0.3s",
                      "&:hover": { backgroundColor: "#e3f2fd" },
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
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        flexDirection: isMobile ? 'column' : 'row' // Stack buttons vertically on mobile
                      }}>
                        {/* Word Document Button */}
                        <button
                          onClick={() => handleDownloadReport(patient.patientId, patient.name, 'docx')}
                          style={{
                            ...downloadButtonStyle,
                            backgroundColor: '#1976d2',
                            color: 'white',
                          }}
                          title="Download Word Document"
                        >
                          <CloudDownloadIcon style={{ fontSize: '1rem', marginRight: '0.5rem' }} />
                          <span style={{ whiteSpace: 'nowrap' }}>Word Doc</span>
                        </button>
                        
                        {/* PDF Button */}
                        <button
                          onClick={() => handleDownloadReport(patient.patientId, patient.name, 'pdf')}
                          style={{
                            ...downloadButtonStyle,
                            backgroundColor: '#dc3545',
                            color: 'white',
                            marginRight: '0'
                          }}
                          title="Download PDF"
                        >
                          <PictureAsPdfIcon style={{ fontSize: '1rem', marginRight: '0.5rem' }} />
                          <span style={{ whiteSpace: 'nowrap' }}>PDF Doc</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPatients.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No patients found
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
