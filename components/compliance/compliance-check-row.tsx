"use client";

import { Chip, Paper, Stack, Typography } from "@mui/material";
import { RegulationBadge } from "@/components/compliance/regulation-badge";
import { formatDateLabel, formatStatusLabel } from "@/components/compliance/formatters";
import type { ComplianceCheckView } from "@/lib/services/compliance-rules";
import type { ComplianceCheckStatus } from "@/types/database.types";

const statusColorMap: Record<
  ComplianceCheckStatus,
  "default" | "primary" | "secondary" | "success" | "warning" | "error"
> = {
  pass: "success",
  warning: "warning",
  violation: "error",
  pending: "default",
  waived: "secondary",
};

export function ComplianceCheckRow({ check }: { check: ComplianceCheckView }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        p: 2.5,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          alignItems={{ xs: "flex-start", md: "center" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <RegulationBadge label={check.regulationLabel} regulation={check.regulation} />
            <Chip color={statusColorMap[check.status]} label={formatStatusLabel(check.status)} size="small" />
            <Chip label={check.source === "manual" ? "Manual log" : "Rule engine"} size="small" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Due {formatDateLabel(check.deadline)}
          </Typography>
        </Stack>

        <div>
          <Typography variant="h6">{check.checkName}</Typography>
          <Typography sx={{ mt: 0.75 }} variant="body2">
            {check.description}
          </Typography>
        </div>

        <Typography color="text.secondary" variant="body2">
          Remediation: {check.remediation ?? "Document the exception, corrective action, or waiver decision."}
        </Typography>

        {check.waiverReason ? (
          <Typography color="secondary.main" variant="body2">
            Waiver reason: {check.waiverReason}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
