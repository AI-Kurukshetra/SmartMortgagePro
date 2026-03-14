import { Grid, Paper, Skeleton, Stack } from "@mui/material";

export default function BorrowerLoanStatusLoading() {
  return (
    <Stack spacing={3} aria-busy="true">
      <Paper elevation={0} sx={{ borderRadius: 5, p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="text" width="58%" height={54} />
          <Skeleton variant="text" width="76%" height={28} />
        </Stack>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Skeleton variant="rounded" height={180} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Skeleton variant="rounded" height={180} />
        </Grid>
      </Grid>

      <Skeleton variant="rounded" height={180} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Skeleton variant="rounded" height={280} />
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Skeleton variant="rounded" height={280} />
        </Grid>
      </Grid>
    </Stack>
  );
}
