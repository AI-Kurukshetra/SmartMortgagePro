"use client";

import { DescriptionRounded, InsertDriveFileRounded, TimelineRounded } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/apply", label: "Apply", icon: DescriptionRounded },
  { to: "/documents", label: "Documents", icon: InsertDriveFileRounded },
  { to: "/status", label: "Status", icon: TimelineRounded },
];

export function Sidebar() {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 288 },
        bgcolor: "#0A1628",
        color: "white",
        p: 3,
        borderRight: { md: "1px solid rgba(255,255,255,0.08)" },
      }}
    >
      <Typography variant="overline" sx={{ color: "#7DD3FC", letterSpacing: "0.16em" }}>
        SMARTMORTGAGE PRO
      </Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
        MVP Workspace
      </Typography>
      <Typography variant="body2" sx={{ mt: 1.5, color: "rgba(255,255,255,0.72)" }}>
        Institutional trust, borrower clarity, and blockchain-backed document integrity.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 5 }}>
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 14,
                textDecoration: "none",
                color: "white",
                background: isActive ? "rgba(21, 101, 192, 0.26)" : "transparent",
                border: isActive ? "1px solid rgba(125, 211, 252, 0.3)" : "1px solid transparent",
              })}
            >
              <Icon fontSize="small" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </Stack>
    </Box>
  );
}
