import { redirect } from "next/navigation";
import { Box, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { PlatformFeaturesTable } from "@/components/features/platform-features-table";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { listPlatformFeatures, summarizePlatformFeatures } from "@/lib/services/platform-features";

export const dynamic = "force-dynamic";

export default async function FeatureCenterPage() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    redirect("/login");
  }

  const features = await listPlatformFeatures(viewer.role);
  const summary = summarizePlatformFeatures(features);
  const isBorrower = !viewer.role || viewer.role === "borrower";

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "1px solid #dbeafe",
          background:
            "radial-gradient(circle at top left, rgba(2,132,199,0.18), transparent 34%), linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          p: { xs: 2.5, md: 4 },
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0284c7", letterSpacing: "0.16em" }}>
              FEATURE CENTER
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: "#0f172a" }}>
              {isBorrower ? "Borrower Experience Feature Map" : "Platform Capability Matrix"}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, color: "#475569", maxWidth: 820 }}>
              {isBorrower
                ? "This table shows the borrower-facing and shared mortgage capabilities currently seeded in the platform so you can see what the portal supports."
                : "This table renders the full seeded feature inventory across borrower workflows, automation modules, compliance, pricing, and AI-driven operational capabilities."}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Visible features
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.75, color: "#0f172a" }}>
                  {summary.total}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Live
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.75, color: "#0f172a" }}>
                  {summary.byStatus.live}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Automation
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.75, color: "#0f172a" }}>
                  {summary.byCategory.automation}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, p: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  AI modules
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.75, color: "#0f172a" }}>
                  {summary.byCategory.ai}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${summary.byCategory.core} core`} color="primary" />
            <Chip label={`${summary.byCategory.automation} automation`} color="success" />
            <Chip label={`${summary.byCategory.ai} AI`} color="warning" />
            <Chip label={`${summary.byStatus.seeded} seeded`} />
          </Stack>
        </Stack>
      </Paper>

      <PlatformFeaturesTable features={features} viewerRole={viewer.role} />
    </Stack>
  );
}
