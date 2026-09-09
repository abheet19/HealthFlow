import * as React from "react";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";

const NotFoundPage: React.FC = () => (
  <DashboardShell title="Page not found" requirePatientId={false}>
    <div className="max-w-xl text-text-dim">
      <p>
        This HealthFlow address does not match a department or patient workflow.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          component={Link}
          to="/it"
          variant="contained"
          className="!normal-case !bg-accent-gradient !text-on-accent !font-semibold"
        >
          Return to IT
        </Button>
        <Button
          component={Link}
          to="/patients"
          variant="outlined"
          className="!normal-case"
        >
          View patients
        </Button>
      </div>
    </div>
  </DashboardShell>
);

export default NotFoundPage;
