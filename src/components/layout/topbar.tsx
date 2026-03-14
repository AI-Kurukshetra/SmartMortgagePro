"use client";

import { Avatar, Box, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useUserStore } from "@/src/store/user-store";

const pageMeta: Record<string, { eyebrow: string; title: string }> = {
  "/apply": { eyebrow: "Loan Application", title: "Digital Loan Application Portal" },
  "/documents": { eyebrow: "Document Vault", title: "Document Collection & Blockchain Audit" },
  "/status": { eyebrow: "Status Dashboard", title: "Loan Status And Outstanding Items" },
};

export function TopBar() {
  const location = useLocation();
  const { user } = useUserStore();
  const meta = pageMeta[location.pathname] ?? {
    eyebrow: "SmartMortgage Pro",
    title: "Borrower Workspace",
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      spacing={2}
      alignItems={{ xs: "flex-start", md: "center" }}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: "#1565C0", letterSpacing: "0.16em" }}>
          {meta.eyebrow}
        </Typography>
        <Typography variant="h4" sx={{ color: "#0A1628", mt: 0.5 }}>
          {meta.title}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" sx={{ color: "#0A1628", fontWeight: 700 }}>
            {user.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B" }}>
            {user.email}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: "#1565C0" }}>{user.fullName.slice(0, 1)}</Avatar>
      </Stack>
    </Stack>
  );
}
