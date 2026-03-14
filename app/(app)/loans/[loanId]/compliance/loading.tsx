import { Paper, Skeleton, Stack } from "@mui/material";

export default function LoanComplianceLoading() {
  return (
    <Stack aria-busy="true" spacing={3}>
      <Paper elevation={0} sx={{ borderRadius: 5, p: 3 }}>
        <Skeleton height={32} sx={{ mb: 1 }} width="32%" />
        <Skeleton height={44} sx={{ mb: 1 }} width="48%" />
        <Skeleton height={24} width="62%" />
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Skeleton height={120} sx={{ borderRadius: 4 }} variant="rounded" width="100%" />
        <Skeleton height={120} sx={{ borderRadius: 4 }} variant="rounded" width="100%" />
        <Skeleton height={120} sx={{ borderRadius: 4 }} variant="rounded" width="100%" />
      </Stack>

      <Skeleton height={420} sx={{ borderRadius: 4 }} variant="rounded" />
    </Stack>
  );
}
