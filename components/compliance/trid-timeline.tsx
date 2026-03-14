"use client";

import { Chip, Paper, Stack, Typography } from "@mui/material";
import { formatDateLabel } from "@/components/compliance/formatters";
import type { TridTimelineSummary } from "@/lib/services/compliance-rules";

function TimelineItem({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | null;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: tone === "warning" ? "warning.light" : tone === "primary" ? "primary.light" : "divider",
        bgcolor: "background.paper",
        p: 2,
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5, fontWeight: 600 }} variant="body1">
        {formatDateLabel(value)}
      </Typography>
    </Paper>
  );
}

export function TridTimeline({ trid }: { trid: TridTimelineSummary }) {
  return (
    <Paper
      data-testid="trid-timeline"
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        p: 2.5,
      }}
    >
      <Stack spacing={2}>
        <Stack
          alignItems={{ xs: "flex-start", md: "center" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <div>
            <Typography variant="h6">TRID timeline</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
              Three business days for the Loan Estimate, three before closing for the Closing Disclosure.
            </Typography>
          </div>
          <Chip
            color={trid.isCompliant ? "success" : trid.violations.length ? "error" : "warning"}
            label={trid.isCompliant ? "Compliant" : trid.violations.length ? "Violation risk" : "Needs review"}
            size="small"
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TimelineItem label="Application received" value={trid.applicationDate} tone="primary" />
          <TimelineItem label="Loan Estimate deadline" value={trid.loanEstimateDeadline} tone="warning" />
          <TimelineItem label="Earliest closing date" value={trid.earliestClosingDate} />
          <TimelineItem label="Closing Disclosure deadline" value={trid.closingDisclosureDeadline} tone="warning" />
          <TimelineItem label="Expected closing" value={trid.closingDate} tone="primary" />
        </Stack>

        {trid.warnings.length ? (
          <Stack spacing={0.5}>
            {trid.warnings.map((warning) => (
              <Typography color="warning.main" key={warning} variant="body2">
                {warning}
              </Typography>
            ))}
          </Stack>
        ) : null}

        {trid.violations.length ? (
          <Stack spacing={0.5}>
            {trid.violations.map((violation) => (
              <Typography color="error.main" key={violation} variant="body2">
                {violation}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
