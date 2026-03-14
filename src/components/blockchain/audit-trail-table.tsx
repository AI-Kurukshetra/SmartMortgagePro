"use client";

import { DownloadRounded } from "@mui/icons-material";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { useMemo, useState } from "react";
import type { AuditEntry } from "@/src/types/smart-mortgage";

function exportCsv(entries: AuditEntry[]) {
  const header = ["Timestamp", "Action", "Document", "User", "IP Address", "Blockchain Tx"];
  const rows = entries.map((entry) => [
    entry.timestamp,
    entry.action,
    entry.documentName ?? "",
    entry.user,
    entry.ipAddressMasked,
    entry.txHash ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "smartmortgage-audit-trail.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AuditTrailTable({ entries }: { entries: AuditEntry[] }) {
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (dateFilter && !entry.timestamp.startsWith(dateFilter)) return false;
      return true;
    });
  }, [actionFilter, dateFilter, entries]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Action</InputLabel>
            <Select value={actionFilter} label="Action" onChange={(event) => setActionFilter(event.target.value)}>
              <MenuItem value="all">All actions</MenuItem>
              {["upload", "view", "download", "delete", "replace", "verify_integrity", "anchor_complete"].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </Stack>

        <Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => exportCsv(filtered)}>
          Export CSV
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>User</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Blockchain Tx</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length ? (
              filtered.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                  <TableCell sx={{ textTransform: "uppercase", fontWeight: 700 }}>{entry.action}</TableCell>
                  <TableCell>{entry.documentName ?? "—"}</TableCell>
                  <TableCell>{entry.user}</TableCell>
                  <TableCell>{entry.ipAddressMasked}</TableCell>
                  <TableCell sx={{ fontFamily: '"DM Mono", var(--font-geist-mono), monospace' }}>
                    {entry.txHash ? `${entry.txHash.slice(0, 10)}...` : "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" sx={{ color: "#64748B", textAlign: "center" }}>
                    No audit entries match the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
