import { Box, Stack, Typography } from "@mui/material";

function getDaysUntilClose(expectedCloseDate: string | null) {
  if (!expectedCloseDate) return null;
  const distance = new Date(expectedCloseDate).getTime() - Date.now();
  return Math.ceil(distance / (1000 * 60 * 60 * 24));
}

function formatCloseDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function EstimatedCloseDate({ expectedCloseDate }: { expectedCloseDate: string | null }) {
  const daysUntilClose = getDaysUntilClose(expectedCloseDate);
  const tone =
    daysUntilClose === null
      ? { accent: "#64748B", surface: "#F8FAFC", border: "rgba(15, 23, 42, 0.08)" }
      : daysUntilClose < 0
        ? { accent: "#D32F2F", surface: "rgba(211, 47, 47, 0.06)", border: "rgba(211, 47, 47, 0.18)" }
        : daysUntilClose <= 7
          ? { accent: "#ED6C02", surface: "rgba(237, 108, 2, 0.08)", border: "rgba(237, 108, 2, 0.18)" }
          : { accent: "#0A7EA4", surface: "rgba(10, 126, 164, 0.08)", border: "rgba(10, 126, 164, 0.18)" };

  return (
    <Box
      sx={{
        borderRadius: 4,
        border: `1px solid ${tone.border}`,
        bgcolor: tone.surface,
        p: 3,
        minHeight: "100%",
      }}
    >
      <Typography variant="caption" sx={{ color: tone.accent, letterSpacing: "0.14em" }}>
        ESTIMATED CLOSE DATE
      </Typography>
      <Typography variant="h5" sx={{ mt: 1, color: "#0F172A" }}>
        {formatCloseDate(expectedCloseDate)}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
        <Typography
          variant="body2"
          sx={{
            color: tone.accent,
            fontWeight: 700,
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {daysUntilClose === null
            ? "Awaiting schedule"
            : daysUntilClose < 0
              ? `${Math.abs(daysUntilClose)} days past target`
              : `${daysUntilClose} days remaining`}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ mt: 1.5, color: "#475569" }}>
        Closing timelines can move as remaining conditions, title work, and final disclosures are completed.
      </Typography>
    </Box>
  );
}
