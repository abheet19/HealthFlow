import * as React from "react";

interface FieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  /** Widens the field to ~2 columns inside a .hf-field-row. */
  wide?: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  /** Renders a right-aligned "NA" toggle inside the input (vitals, remarks). */
  na?: boolean;
  naActive?: boolean;
  onToggleNa?: () => void;
  naLabel?: string;
  /** Extra content shown to the right of the input (e.g. the BMI category chip). */
  endAdornment?: React.ReactNode;
  className?: string;
}

/**
 * The artifact's `.field` primitive: an uppercase micro-label above a
 * solid-surface input with a 9px radius and a cyan focus ring - the same
 * look the department subheads, tooth grid and status tiles are built to sit
 * beside. Replaces the raw MUI <TextField> the dashboards used to render, so
 * form surfaces stop looking like default Material. All field-name mapping
 * and side effects stay in each page's own onChange, exactly as before.
 */
const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
  disabled = false,
  hint,
  wide = false,
  autoComplete,
  spellCheck,
  na = false,
  naActive = false,
  onToggleNa,
  naLabel = "NA",
  endAdornment,
  className = "",
}) => {
  const id = React.useId();
  const classes = ["hf-field"];
  if (wide) classes.push("wide");
  if (na) classes.push("with-na");
  if (className) classes.push(className);

  return (
    <div className={classes.join(" ")}>
      <label htmlFor={id}>{label}</label>
      {endAdornment ? (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            id={id}
            type={type}
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={disabled}
            autoComplete={autoComplete}
            spellCheck={spellCheck}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            style={{ paddingRight: "8.5rem" }}
          />
          <span style={{ position: "absolute", right: ".45rem", top: "50%", transform: "translateY(-50%)" }}>
            {endAdornment}
          </span>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
      )}
      {na && (
        <button
          type="button"
          className="hf-na-btn"
          aria-label={`Set ${label} to not applicable`}
          aria-pressed={naActive}
          onClick={onToggleNa}
        >
          {naLabel}
        </button>
      )}
      {hint && <span className="hf-hint">{hint}</span>}
    </div>
  );
};

export default Field;
