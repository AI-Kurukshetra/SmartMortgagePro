import { Grid, Skeleton, Stack } from "@mui/material";

export default function MyLoansLoading() {
  return (
    <Stack spacing={3} aria-busy="true">
      <Skeleton variant="rounded" height={220} />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Skeleton variant="rounded" height={260} />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Skeleton variant="rounded" height={260} />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Skeleton variant="rounded" height={260} />
        </Grid>
      </Grid>
    </Stack>
  );
}
