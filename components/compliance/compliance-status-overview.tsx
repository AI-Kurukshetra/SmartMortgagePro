"use client";

import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { ComplianceOverview } from "@/lib/services/compliance";
import { formatDateLabel } from "@/components/compliance/formatters";

function OverviewCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: string;
}) {
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
      <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.12em" }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, color: tone, fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export function ComplianceStatusOverview({ overview }: { overview: ComplianceOverview }) {
  const completion = overview.total ? Math.round((overview.pass / overview.total) * 100) : 0;

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        <Box>
          <OverviewCard label="Violations" tone="error.main" value={String(overview.violation)} />
        </Box>
        <Box>
          <OverviewCard label="Warnings" tone="warning.main" value={String(overview.warning)} />
        </Box>
        <Box>
          <OverviewCard label="Pending" tone="text.primary" value={String(overview.pending)} />
        </Box>
        <Box>
          <OverviewCard label="Waived" tone="secondary.main" value={String(overview.waived)} />
        </Box>
        <Box sx={{ gridColumn: { xs: "1 / -1", xl: "auto" } }}>
          <OverviewCard
            label="Next deadline"
            tone="primary.main"
            value={overview.nextDeadline ? formatDateLabel(overview.nextDeadline) : "None"}
          />
        </Box>
      </Box>

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
          <Typography variant="body2" color="text.secondary">
            Completion rate
          </Typography>
          <Typography variant="h6">
            {overview.pass} of {overview.total} checks passed
          </Typography>
          <LinearProgress
            aria-label="Compliance completion"
            color={completion >= 80 ? "success" : completion >= 50 ? "warning" : "error"}
            sx={{ borderRadius: 999, height: 10 }}
            value={completion}
            variant="determinate"
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
