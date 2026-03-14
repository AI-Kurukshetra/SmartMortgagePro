import { Box, Stack, Typography } from "@mui/material";
import type { StatusMilestone } from "@/lib/services/borrower-status";

const toneByState = {
  complete: {
    border: "rgba(46, 125, 50, 0.18)",
    background: "rgba(46, 125, 50, 0.08)",
    dot: "#2E7D32",
    text: "#16331a",
  },
  current: {
    border: "rgba(10, 126, 164, 0.32)",
    background: "linear-gradient(135deg, rgba(10,126,164,0.16) 0%, rgba(248,250,252,0.96) 100%)",
    dot: "#0A7EA4",
    text: "#0F2237",
  },
  upcoming: {
    border: "rgba(15, 23, 42, 0.08)",
    background: "#FFFFFF",
    dot: "#CBD5E1",
    text: "#475569",
  },
} as const;

export function MilestoneTracker({ milestones }: { milestones: StatusMilestone[] }) {
  return (
    <Stack
      data-testid="milestone-tracker"
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      useFlexGap
      flexWrap="wrap"
    >
      {milestones.map((milestone, index) => {
        const tone = toneByState[milestone.state];

        return (
          <Box
            key={milestone.key}
            data-testid={milestone.state === "current" ? "current-milestone" : undefined}
            className={milestone.state === "current" ? "active" : undefined}
            sx={{
              flex: "1 1 180px",
              minWidth: 0,
              borderRadius: 3,
              border: `1px solid ${tone.border}`,
              bgcolor: tone.background,
              p: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  bgcolor: tone.dot,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: tone.text, fontWeight: 700 }}>
                  {milestone.label}
                </Typography>
                <Typography variant="caption" sx={{ color: tone.text, opacity: 0.82 }}>
                  {milestone.description}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
