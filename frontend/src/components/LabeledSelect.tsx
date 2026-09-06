import * as React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface LabeledSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

/**
 * The FormControl + InputLabel + Select + MenuItem boilerplate every
 * dashboard's `dropdown()` helper rebuilt from scratch. Field-name mapping
 * and side effects (resetting a description field, etc.) stay in each
 * dashboard's own onChange callback - only the mechanical markup moved here.
 */
const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  value,
  onChange,
  options,
  className = "w-full sm:w-64",
}) => (
  <FormControl variant="outlined" size="small" className={className}>
    <InputLabel>{label}</InputLabel>
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as string)}
    >
      {options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default LabeledSelect;
