"use client";

import Link from "next/link";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useDeferredValue, useMemo, useState } from "react";
import type { PlatformFeatureRow, ProfileRole } from "@/types/database.types";

type PlatformFeatureRecord = PlatformFeatureRow;

function formatFeatureTier(value: PlatformFeatureRecord["tier"]) {
  return value.replaceAll("_", " ");
}

function formatFeatureStatus(value: PlatformFeatureRecord["status"]) {
  return value.replaceAll("_", " ");
}

function formatFeatureCategory(value: PlatformFeatureRecord["category"]) {
  switch (value) {
    case "core":
      return "Core";
    case "automation":
      return "Automation";
    case "ai":
      return "AI";
    default:
      return value;
  }
}

function statusChipColor(status: PlatformFeatureRecord["status"]) {
  switch (status) {
    case "live":
      return "success";
    case "in_progress":
      return "warning";
    case "seeded":
      return "primary";
    case "planned":
      return "default";
    default:
      return "default";
  }
}

function categoryChipStyle(category: PlatformFeatureRecord["category"]) {
  switch (category) {
    case "core":
      return { bgcolor: "#dbeafe", color: "#1d4ed8" };
    case "automation":
      return { bgcolor: "#dcfce7", color: "#166534" };
    case "ai":
      return { bgcolor: "#fef3c7", color: "#92400e" };
    default:
      return {};
  }
}

export function PlatformFeaturesTable({
  features,
  viewerRole,
}: {
  features: PlatformFeatureRecord[];
  viewerRole?: ProfileRole | null;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isBorrower = !viewerRole || viewerRole === "borrower";

  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return features;

    return features.filter((feature) =>
      [
        feature.feature_code,
        feature.feature_name,
        feature.summary,
        feature.category,
        feature.tier,
        feature.status,
        feature.owner_team ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [deferredQuery, features]);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: "#0f172a" }}>
            Feature Inventory
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            {isBorrower
              ? "Borrower-facing and shared platform capabilities currently visible to your account."
              : "Operational, compliance, borrower, and AI modules currently tracked for the lending platform."}
          </Typography>
        </Box>

        <TextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search feature, team, tier, or status"
          sx={{ width: { xs: "100%", md: 360 } }}
        />
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #dbeafe", borderRadius: 4 }}>
        <Table aria-label="Platform features">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell>Code</TableCell>
              <TableCell>Feature</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Audience</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Complexity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Route</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filtered.length ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No features match the current search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((feature) => (
                <TableRow key={feature.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                    {feature.feature_code}
                  </TableCell>
                  <TableCell sx={{ minWidth: 320 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {feature.feature_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {feature.summary}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={formatFeatureCategory(feature.category)}
                      sx={categoryChipStyle(feature.category)}
                    />
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {feature.audience}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {formatFeatureTier(feature.tier)}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {feature.complexity}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={formatFeatureStatus(feature.status)}
                      color={statusChipColor(feature.status)}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>{feature.owner_team ?? "Unassigned"}</TableCell>
                  <TableCell>
                    {feature.route_href ? (
                      <Link
                        href={feature.route_href}
                        className="text-sm font-semibold text-sky-700 hover:text-sky-800"
                      >
                        Open
                      </Link>
                    ) : (
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
