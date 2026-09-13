import * as React from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";

const NotFoundPage: React.FC = () => (
  <DashboardShell title="Page not found" requirePatientId={false}>
    <div className="max-w-xl text-text-dim">
      <p>
        This HealthFlow address does not match a department or patient workflow.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/it" className="hf-btn hf-btn-primary">
          Return to IT
        </Link>
        <Link to="/patients" className="hf-btn hf-btn-ghost">
          View patients
        </Link>
      </div>
    </div>
  </DashboardShell>
);

export default NotFoundPage;
