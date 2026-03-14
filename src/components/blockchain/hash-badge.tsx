"use client";

import { ShieldRounded } from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";
import type { BlockchainAnchor } from "@/src/types/smart-mortgage";

function truncateHash(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function HashBadge({
  anchor,
  status,
}: {
  anchor: BlockchainAnchor | null;
  status: "pending" | "anchored" | "failed";
}) {
  if (status === "pending") {
    return <Chip size="small" icon={<ShieldRounded />} label="Anchoring..." color="warning" />;
  }

  if (status === "failed" || !anchor) {
    return <Chip size="small" icon={<ShieldRounded />} label="Anchor failed" color="error" />;
  }

  return (
    <Tooltip title={`${anchor.txHash} • block ${anchor.blockNumber}`}>
      <Chip
        size="small"
        icon={<ShieldRounded />}
        label={truncateHash(anchor.txHash)}
        color="success"
        sx={{
          boxShadow: "0 0 12px rgba(22,163,74,0.22)",
          fontFamily: '"DM Mono", var(--font-geist-mono), monospace',
        }}
      />
    </Tooltip>
  );
}
