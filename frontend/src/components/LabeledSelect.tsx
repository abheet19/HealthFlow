import * as React from "react";

interface LabeledSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  /** Placeholder shown while nothing is chosen (matches the artifact's "Select…"). */
  placeholder?: string;
  className?: string;
}

/**
 * The `.field` select primitive from the artifact: the same uppercase
 * micro-label + 9px solid-surface control as <Field>, with a custom chevron
 * so it reads as one system instead of a default Material <Select>. Field-name
 * mapping and side effects (resetting a description field, etc.) stay in each
 * dashboard's own onChange callback - only the markup moved here.
 */
const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
}) => {
  const id = React.useId();
  return (
    <div className={`hf-field${className ? " " + className : ""}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LabeledSelect;
