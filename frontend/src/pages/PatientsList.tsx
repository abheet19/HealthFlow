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
import { useToast } from "../context/ToastContext";  // added import

const placeholderImage = "https://via.placeholder.com/150"; // default placeholder

const PatientsList: React.FC = () => {
  const { showToast } = useToast(); // added toast hook
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if the screen is mobile-sized

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/patients`);
      const data = await res.json();
      setPatients(data.patients || []);
      showToast("Patients list refreshed successfully", "success");  // show toast on refresh success
    } catch (error) {
      console.error("Error fetching patients:", error);
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
  const handleDownloadReport = async (patientId: string, patientName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/generate_report?patientId=${patientId}`);
      if (!res.ok) throw new Error("Failed to download report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${patientName}'s Report.docx`;  // updated filename to use patient name
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Report downloaded successfully", "success");  // show toast on download success
    } catch (error) {
      console.error(error);
      showToast("Failed to download report", "error");
    }
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
          <TableContainer component={Paper} sx={{ borderRadius: 2, minWidth: "600px" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold", minWidth: "80px" }}>
                    {/* Empty header for photo */}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Patient No.
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Name
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Division
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Roll No.
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Admission No.
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Mobile
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    {/* Empty header for actions */}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPatients.map((patient, index) => (
                  <TableRow
                    key={patient.patientId} // changed from patient.patient_id
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
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">{patient.patientId}</TableCell> {/* updated */}
                    <TableCell align="center">{patient.name}</TableCell>
                    <TableCell align="center">{patient.div}</TableCell>
                    <TableCell align="center">{patient.rollNo}</TableCell> {/* updated */}
                    <TableCell align="center">{patient.adminNo}</TableCell> {/* updated */}
                    <TableCell align="center">{patient.mobile}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#1976d2 !important", // force override blue
                          color: "white !important",
                          "&:hover": { backgroundColor: "#1565c0 !important" }
                        }}
                        size="small"
                        onClick={() => handleDownloadReport(patient.patientId, patient.name)}
                      >
                        Download Report
                      </Button>
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
