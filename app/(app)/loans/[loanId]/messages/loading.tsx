import { Grid, Paper, Skeleton, Stack } from "@mui/material";

export default function LoanMessagesLoading() {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ borderRadius: 5, p: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Skeleton variant="text" width={180} height={22} />
          <Skeleton variant="text" width="52%" height={40} />
          <Skeleton variant="text" width="70%" height={22} />
        </Stack>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ borderRadius: 4, p: 2.5, border: "1px solid", borderColor: "divider" }}>
              <Stack spacing={1.5}>
                <Skeleton variant="text" width={140} height={28} />
                <Skeleton variant="rectangular" height={76} sx={{ borderRadius: 3 }} />
                <Skeleton variant="rectangular" height={76} sx={{ borderRadius: 3 }} />
                <Skeleton variant="rectangular" height={76} sx={{ borderRadius: 3 }} />
              </Stack>
            </Paper>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Paper elevation={0} sx={{ borderRadius: 4, p: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width={220} height={28} />
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
