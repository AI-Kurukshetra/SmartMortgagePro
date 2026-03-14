"use client";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Controller, type FieldPath, useFormContext } from "react-hook-form";
import type { LoanApplication } from "@/src/types/smart-mortgage";

type Option = { label: string; value: string };

export function FormTextField({
  name,
  label,
  type = "text",
  currency = false,
  multiline = false,
  min,
  placeholder,
}: {
  name: FieldPath<LoanApplication>;
  label: string;
  type?: string;
  currency?: boolean;
  multiline?: boolean;
  min?: number | string;
  placeholder?: string;
}) {
  const { control } = useFormContext<LoanApplication>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type={type}
          multiline={multiline}
          minRows={multiline ? 3 : undefined}
          placeholder={placeholder}
          value={field.value ?? ""}
          onChange={(event) => {
            const nextValue =
              type === "number" ? Number(event.target.value || 0) : event.target.value;
            field.onChange(nextValue);
          }}
          error={Boolean(fieldState?.error)}
          helperText={fieldState?.error?.message}
          inputProps={{ min }}
          InputProps={
            currency
              ? {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }
              : undefined
          }
        />
      )}
    />
  );
}

export function FormSelectField({
  name,
  label,
  options,
}: {
  name: FieldPath<LoanApplication>;
  label: string;
  options: Option[];
}) {
  const { control } = useFormContext<LoanApplication>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <InputLabel>{label}</InputLabel>
          <Select {...field} label={label}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}

export function FormCheckboxField({
  name,
  label,
}: {
  name: FieldPath<LoanApplication>;
  label: string;
}) {
  const { control } = useFormContext<LoanApplication>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          }
          label={label}
        />
      )}
    />
  );
}
