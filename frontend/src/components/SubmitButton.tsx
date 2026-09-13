import * as React from "react";

interface SubmitButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Full-width up to a 320px cap, matching the IT dashboard's Submit. */
  block?: boolean;
}

/**
 * The gradient "Save"/"Submit" button repeated across all five dashboards,
 * rendered as the artifact's `.btn.btn-primary` (cyan→amber gradient, 10px
 * radius, cyan-tinted lift shadow) instead of a MUI <Button>. Keeps the real
 * loading state - a spinner + disabled button so a pending backend call is
 * visible instead of the button just sitting there.
 */
const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  className = "",
  block = true,
}) => (
  <button
    type="button"
    className={`hf-btn hf-btn-primary ${className}`}
    style={block ? { width: "100%", maxWidth: 320 } : undefined}
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading}
  >
    {loading ? (
      <>
        <span className="hf-spinner" aria-hidden="true" />
        <span className="sr-only">Saving</span>
      </>
    ) : (
      children
    )}
  </button>
);

export default SubmitButton;
