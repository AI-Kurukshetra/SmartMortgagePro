"use client";

import {
  Alert,
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { mockLoanService } from "@/src/services/loan-service";
import { SMART_MORTGAGE_STAGE_ORDER } from "@/src/types/smart-mortgage";

function formatStage(stage: string) {
  return stage.replaceAll("_", " ");
}

export default function StatusDashboardPage() {
  const submission = mockLoanService.getSubmissionSync();
  const loanId = submission?.loanId ?? "";
  const statusQuery = useQuery({
    queryKey: ["mvp-status", loanId],
    queryFn: () => mockLoanService.getLoanStatus(loanId),
    enabled: Boolean(loanId),
  });

  if (!loanId) {
    return (
      <Alert severity="info">
        Submit the application first to unlock the read-only loan status dashboard.
      </Alert>
    );
  }

  if (statusQuery.isLoading || !statusQuery.data) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={220} />
        <Skeleton variant="rounded" height={360} />
      </Stack>
    );
  }

  const status = statusQuery.data;

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} justifyContent="space-between">
          <Box>
            <Typography variant="h6">Application #{status.referenceNumber}</Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "#64748B" }}>
              Current stage: <strong>{formatStage(status.currentStage)}</strong>
            </Typography>
          </Box>

          <Box sx={{ width: 240, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%"
                outerRadius="100%"
                data={[{ name: "Completion", value: status.completionPercent, fill: "#1565C0" }]}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <Typography variant="h5" sx={{ textAlign: "center", mt: -9, color: "#0A1628" }}>
              {status.completionPercent}%
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h6">Stage Timeline</Typography>
            <Stack spacing={2} sx={{ mt: 2.5 }}>
              {SMART_MORTGAGE_STAGE_ORDER.map((stage) => {
                const item = status.stageHistory.find((entry) => entry.stage === stage);
                if (!item) return null;

                return (
                  <Box key={stage} sx={{ pl: 2.5, borderLeft: `3px solid ${item.completed ? "#1565C0" : "#E2E8F0"}` }}>
                    <Typography variant="subtitle1" sx={{ textTransform: "capitalize", fontWeight: 700 }}>
                      {formatStage(stage)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                      {item.note}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                      {item.completedAt ? new Date(item.completedAt).toLocaleString() : "Pending"}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h6">Outstanding Items</Typography>
            <Stack spacing={1.5} sx={{ mt: 2.5 }}>
              {status.outstandingItems.map((item) => (
                <Alert key={item} severity="warning">
                  {item}
                </Alert>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
