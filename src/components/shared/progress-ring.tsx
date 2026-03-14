"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

export function ProgressRing({
  value,
  label,
  size = 88,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        sx={{ color: "rgba(21, 101, 192, 0.12)" }}
      />
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        sx={{ color: "#1565C0", position: "absolute", left: 0 }}
      />
      <Box
        sx={{
          inset: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" sx={{ color: "#0A1628" }}>
          {Math.round(value)}%
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748B" }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
