import * as React from "react";
import { Button, CircularProgress } from "@mui/material";

interface SubmitButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * The gradient "Save"/"Submit" button repeated identically across all five
 * dashboards. Adds a real loading state (a spinner + disabled button) so a
 * pending backend call is visible instead of the button just sitting there.
 */
const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  className = "",
}) => (
  <Button
    variant="contained"
    color="primary"
    onClick={onClick}
    disabled={disabled || loading}
    className={`w-full sm:w-64 bg-accent-gradient hover:brightness-110 text-on-accent font-semibold shadow-lg shadow-accent-2/30 ${className}`}
  >
    {loading ? (
      <CircularProgress size={20} sx={{ color: "#04140D" }} />
    ) : (
      children
    )}
  </Button>
);

export default SubmitButton;
