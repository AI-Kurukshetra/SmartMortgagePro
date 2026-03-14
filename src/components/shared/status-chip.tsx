"use client";

import { Chip } from "@mui/material";

type StatusChipProps = {
  label: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
};

export function StatusChip({ label, tone = "default" }: StatusChipProps) {
  return <Chip size="small" label={label} color={tone} sx={{ textTransform: "capitalize" }} />;
}
