import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert, Box, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { ActionItemsList } from "@/components/status/action-items-list";
import { EstimatedCloseDate } from "@/components/status/estimated-close-date";
import { LoanTimeline } from "@/components/status/loan-timeline";
import { MilestoneTracker } from "@/components/status/milestone-tracker";
import { getBorrowerLoanStatusDetail } from "@/lib/services/borrower-status";
import type { ProfileRole } from "@/types/database.types";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function BorrowerLoanStatusPage({
  params,
}: {
  params: Promise<{ loanId: string }>;
}) {
  const { loanId } = await params;
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    redirect("/login");
  }

  const detailResult = await getBorrowerLoanStatusDetail(loanId, viewer.userId).catch(
    (error: unknown) => {
      return {
        detail: null,
        error:
          error instanceof Error ? error.message : "Unable to load the selected loan status.",
      };
    },
  );

  const detail =
    detailResult && "detail" in detailResult ? detailResult.detail : detailResult;
  const bootstrapError = detailResult && "error" in detailResult ? detailResult.error : undefined;
  const role: ProfileRole | null = viewer.role;

  if (role && role !== "borrower") {
    redirect("/dashboard");
  }

  if (!detail) {
    notFound();
  }

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "1px solid rgba(10, 126, 164, 0.18)",
          p: { xs: 2.5, md: 4 },
          background:
            "radial-gradient(circle at top left, rgba(26,60,94,0.16), transparent 32%), linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "#0A7EA4", letterSpacing: "0.16em" }}>
                APPLICATION STATUS
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, color: "#0F172A" }}>
                {detail.loan.property_address}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, color: "#475569", maxWidth: 760 }}>
                Your loan is currently in <strong>{detail.loan.statusLabel}</strong>. Review the milestone tracker below to see where your file stands and what comes next.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Link href={`/my-loans/${loanId}/documents`} style={{ textDecoration: "none" }}>
                <Button variant="contained">
                  {detail.missingDocumentCount > 0 ? "Upload missing documents" : "Open document portal"}
                </Button>
              </Link>
              <Link href="/my-loans" style={{ textDecoration: "none" }}>
                <Button variant="outlined">Back to all loans</Button>
              </Link>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`Stage: ${detail.loan.statusLabel}`} color="primary" />
            <Chip label={`${detail.loan.uploadedDocumentCount} documents received`} />
            <Chip label={`${detail.loan.openActionCount} action items`} color="warning" />
          </Stack>
        </Stack>
      </Paper>

      {bootstrapError ? <Alert severity="warning">{bootstrapError}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            data-testid="loan-status-card"
            elevation={0}
            sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.08)", p: 3 }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Loan amount
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ mt: 0.75, color: "#0F172A", fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {formatCurrency(detail.loan.loan_amount)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Verified documents
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ mt: 0.75, color: "#0F172A", fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {detail.verifiedDocumentCount}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Missing required docs
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ mt: 0.75, color: "#0F172A", fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {detail.missingDocumentCount}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <EstimatedCloseDate expectedCloseDate={detail.loan.expected_close_date} />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.08)", p: 3 }}>
        <Typography variant="h6" sx={{ color: "#0F172A" }}>
          Milestone tracker
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, mb: 2.5, color: "#64748B" }}>
          Each stage represents a major checkpoint in the loan process.
        </Typography>
        <MilestoneTracker milestones={detail.milestones} />
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.08)", p: 3, minHeight: "100%" }}
          >
            <Typography variant="h6" sx={{ color: "#0F172A" }}>
              Action items
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, mb: 2.5, color: "#64748B" }}>
              Complete these items to keep your file moving.
            </Typography>
            <ActionItemsList items={detail.actionItems} />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.08)", p: 3, minHeight: "100%" }}
          >
            <Typography variant="h6" sx={{ color: "#0F172A" }}>
              Loan timeline
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, mb: 2.5, color: "#64748B" }}>
              Recent activity from your application and document review flow.
            </Typography>
            <LoanTimeline items={detail.timeline} />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
