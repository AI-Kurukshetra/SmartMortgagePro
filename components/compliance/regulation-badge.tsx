"use client";

import { Chip } from "@mui/material";
import type { Regulation } from "@/types/database.types";

const regulationColors: Record<
  Regulation,
  "default" | "primary" | "secondary" | "success" | "warning" | "error"
> = {
  trid: "primary",
  respa: "secondary",
  hmda: "success",
  ecoa: "warning",
  fcra: "error",
  glba: "default",
  state: "secondary",
  ada: "success",
};

export function RegulationBadge({
  label,
  regulation,
}: {
  label: string;
  regulation: Regulation;
}) {
  return <Chip color={regulationColors[regulation]} label={label} size="small" variant="outlined" />;
}
