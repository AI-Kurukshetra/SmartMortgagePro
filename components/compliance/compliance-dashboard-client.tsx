"use client";

import Link from "next/link";
import { Alert, Box, Button, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { AuditLogTable } from "@/components/compliance/audit-log-table";
import { ComplianceCheckRow } from "@/components/compliance/compliance-check-row";
import { ComplianceStatusOverview } from "@/components/compliance/compliance-status-overview";
import { formatDateLabel } from "@/components/compliance/formatters";
import { TridTimeline } from "@/components/compliance/trid-timeline";
import { ViolationAlertBanner } from "@/components/compliance/violation-alert-banner";
import { WaiverForm } from "@/components/compliance/waiver-form";
import type { ComplianceDashboardData } from "@/lib/services/compliance";

type ComplianceTab = "checks" | "timeline" | "audit";

export function ComplianceDashboardClient({ dashboard }: { dashboard: ComplianceDashboardData }) {
  const [tab, setTab] = useState<ComplianceTab>("checks");

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "1px solid",
          borderColor: "divider",
          background:
            "radial-gradient(circle at top left, rgba(14,165,233,0.16), transparent 35%), linear-gradient(135deg, #ffffff 0%, #eff5fb 100%)",
          p: { xs: 2.5, md: 3.5 },
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            alignItems={{ xs: "flex-start", md: "center" }}
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <div>
              <Typography sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.16em" }} variant="overline">
                Compliance Dashboard
              </Typography>
              <Typography sx={{ mt: 0.5 }} variant="h4">
                {dashboard.loan.borrower_name}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body1">
                {dashboard.loan.property_address}
              </Typography>
            </div>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} href="/pipeline" variant="outlined">
                Back to pipeline
              </Button>
              <Button
                component={Link}
                href={`/loans/${dashboard.loan.id}/documents`}
                variant="contained"
              >
                View documents
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`Stage: ${dashboard.loan.stage}`} />
            <Chip label={`Priority: ${dashboard.loan.priority}`} />
            <Chip
              color={dashboard.overview.violation > 0 ? "error" : dashboard.overview.warning > 0 ? "warning" : "success"}
              label={`${dashboard.overview.violation} violation(s)`}
            />
            <Chip label={`Next deadline: ${formatDateLabel(dashboard.overview.nextDeadline)}`} />
          </Stack>
        </Stack>
      </Paper>

      {dashboard.bootstrapWarnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      <ViolationAlertBanner overview={dashboard.overview} />
      <ComplianceStatusOverview overview={dashboard.overview} />

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Tabs
          aria-label="Compliance sections"
          onChange={(_, nextValue: ComplianceTab) => setTab(nextValue)}
          sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1 }}
          value={tab}
        >
          <Tab label="Checks" value="checks" />
          <Tab label="TRID Timeline" value="timeline" />
          <Tab label="Audit Log" value="audit" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === "checks" ? (
            dashboard.checks.length ? (
              <Stack spacing={2}>
                {dashboard.checks.map((check) => (
                  <ComplianceCheckRow check={check} key={check.id} />
                ))}
              </Stack>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: "1px dashed",
                  borderColor: "divider",
                  p: 4,
                  textAlign: "center",
                }}
              >
                <Typography variant="h6">No compliance checks yet</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                  Once this loan starts generating disclosures and events, checks will appear here automatically.
                </Typography>
              </Paper>
            )
          ) : null}

          {tab === "timeline" ? (
            <Stack spacing={2.5}>
              <TridTimeline trid={dashboard.trid} />
              <WaiverForm checks={dashboard.checks} />
            </Stack>
          ) : null}

          {tab === "audit" ? (
            <AuditLogTable
              entries={dashboard.auditLog}
              exportHref={`/api/loans/${dashboard.loan.id}/compliance/audit?format=csv`}
            />
          ) : null}
        </Box>
      </Paper>
    </Stack>
  );
}
