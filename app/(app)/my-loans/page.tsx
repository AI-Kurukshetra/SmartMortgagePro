import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Alert,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { listBorrowerLoans } from "@/lib/services/borrower-status";
import type { ProfileRole } from "@/types/database.types";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCloseDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getNextCloseLabel(dates: Array<string | null>) {
  const futureDates = dates
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (!futureDates.length) {
    return "No target set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(futureDates[0]);
}

export default async function MyLoansPage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    redirect("/login");
  }

  const loansResult = await listBorrowerLoans(viewer.userId).catch((error: unknown) => {
      return {
        loans: [],
        error:
          error instanceof Error ? error.message : "Borrower portal failed to load your loans.",
      };
    });

  const loans = Array.isArray(loansResult) ? loansResult : loansResult.loans;
  const bootstrapError = !Array.isArray(loansResult) ? loansResult.error : undefined;
  const role: ProfileRole | null = viewer.role;
  const fullName = viewer.fullName ?? viewer.email ?? "Borrower";

  if (role && role !== "borrower") {
    redirect("/dashboard");
  }

  const activeCount = loans.length;
  const attentionCount = loans.filter((loan) => loan.openActionCount > 0).length;
  const nextCloseLabel = getNextCloseLabel(loans.map((loan) => loan.expected_close_date));

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          p: { xs: 2.5, md: 4 },
          border: "1px solid rgba(10, 126, 164, 0.18)",
          background:
            "radial-gradient(circle at top left, rgba(10,126,164,0.18), transparent 32%), linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0A7EA4", letterSpacing: "0.16em" }}>
              BORROWER STATUS PORTAL
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: "#0F172A" }}>
              Welcome back, {fullName}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, maxWidth: 780, color: "#475569" }}>
              Track your application progress, review upcoming milestones, and see what your loan team needs next.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ borderRadius: 4, p: 2.5, border: "1px solid rgba(0,0,0,0.08)" }}>
                <Typography variant="caption" color="text.secondary">
                  Active loans
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ mt: 0.75, fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {activeCount}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ borderRadius: 4, p: 2.5, border: "1px solid rgba(0,0,0,0.08)" }}>
                <Typography variant="caption" color="text.secondary">
                  Items needing attention
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ mt: 0.75, fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {attentionCount}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ borderRadius: 4, p: 2.5, border: "1px solid rgba(0,0,0,0.08)" }}>
                <Typography variant="caption" color="text.secondary">
                  Nearest target close
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ mt: 0.75, fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {nextCloseLabel}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {bootstrapError ? <Alert severity="warning">{bootstrapError}</Alert> : null}

      {!loans.length ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px dashed rgba(15, 23, 42, 0.16)",
            p: 5,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ color: "#0F172A" }}>
            No loans are assigned to your account yet.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#64748B", maxWidth: 540, mx: "auto" }}>
            Once your loan team links an application to your profile, status updates and action items will appear here.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {loans.map((loan) => (
            <Grid key={loan.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <Link
                href={`/my-loans/${loan.id}`}
                style={{ display: "block", textDecoration: "none", height: "100%" }}
              >
              <Paper
                data-testid="loan-status-card"
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(0,0,0,0.08)",
                  p: 3,
                  minHeight: "100%",
                  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                    borderColor: "rgba(10, 126, 164, 0.28)",
                  },
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: "#0A7EA4", fontWeight: 700 }}>
                        {loan.statusLabel}
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.75, color: "#0F172A" }}>
                        {loan.property_address}
                      </Typography>
                    </Box>
                    <Chip
                      label={loan.openActionCount ? `${loan.openActionCount} open` : "On track"}
                      color={loan.openActionCount ? "warning" : "success"}
                      variant={loan.openActionCount ? "filled" : "outlined"}
                    />
                  </Stack>

                  <Typography
                    variant="h5"
                    sx={{ color: "#0F172A", fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {formatCurrency(loan.loan_amount)}
                  </Typography>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        Overall progress
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#1A3C5E", fontWeight: 700 }}>
                        {loan.progressPercent}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={loan.progressPercent}
                      sx={{
                        height: 9,
                        borderRadius: 999,
                        bgcolor: "rgba(10, 126, 164, 0.12)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          background: "linear-gradient(90deg, #1A3C5E 0%, #0A7EA4 100%)",
                        },
                      }}
                    />
                  </Box>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={`${loan.uploadedDocumentCount} documents`} size="small" />
                    <Chip label={`Close: ${formatCloseDate(loan.expected_close_date)}`} size="small" />
                  </Stack>

                  <Typography variant="caption" sx={{ color: "#0A7EA4", fontWeight: 700 }}>
                    {loan.openActionCount > 0
                      ? "Open this loan to upload missing documents."
                      : "Open this loan to review or add documents."}
                  </Typography>
                </Stack>
              </Paper>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
