import { Box, Stack, Typography } from "@mui/material";
import type { LoanTimelineItem } from "@/lib/services/borrower-status";

const toneAccent = {
  default: "#1A3C5E",
  success: "#2E7D32",
  warning: "#ED6C02",
} as const;

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LoanTimeline({ items }: { items: LoanTimelineItem[] }) {
  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <Stack key={item.id} direction="row" spacing={1.5} alignItems="flex-start">
          <Stack alignItems="center" sx={{ pt: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "999px",
                bgcolor: toneAccent[item.tone],
              }}
            />
            <Box
              sx={{
                width: 2,
                flex: 1,
                minHeight: 42,
                bgcolor: "rgba(15, 23, 42, 0.08)",
              }}
            />
          </Stack>

          <Box sx={{ minWidth: 0, pb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
              {item.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "#0A7EA4", letterSpacing: "0.08em" }}>
              {formatTimelineDate(item.occurredAt)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "#475569" }}>
              {item.description}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
