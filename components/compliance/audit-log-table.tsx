"use client";

import { Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Download } from "lucide-react";
import { formatDateLabel } from "@/components/compliance/formatters";
import type { ComplianceAuditEntry } from "@/lib/services/compliance";

export function AuditLogTable({
  entries,
  exportHref,
}: {
  entries: ComplianceAuditEntry[];
  exportHref: string;
}) {
  return (
    <Paper
      data-testid="audit-log-table"
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Stack
        alignItems={{ xs: "flex-start", md: "center" }}
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2.5 }}
      >
        <div>
          <Typography variant="h6">Immutable audit log</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            Read-only event history for compliance-relevant actions.
          </Typography>
        </div>
        <Button component="a" href={exportHref} startIcon={<Download size={16} />} variant="outlined">
          Export CSV
        </Button>
      </Stack>

      {entries.length ? (
        <Table aria-label="Compliance audit log">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDateLabel(entry.createdAt)}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell>{entry.actor}</TableCell>
                <TableCell>{entry.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography sx={{ p: 2.5 }} variant="body2">
          No audit entries recorded yet.
        </Typography>
      )}
    </Paper>
  );
}
