"use client";

import { Drawer, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import type { DocumentVersion } from "@/src/types/smart-mortgage";

export function VersionHistoryDrawer({
  open,
  onClose,
  versions,
}: {
  open: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Stack sx={{ width: 360, p: 3 }} spacing={2}>
        <Typography variant="h6">Version History</Typography>
        <List disablePadding>
          {versions.map((version) => (
            <ListItem key={version.id} divider>
              <ListItemText
                primary={`Version ${version.version} • ${version.fileName}`}
                secondary={`${version.uploader} • ${new Date(version.uploadedAt).toLocaleString()} • ${version.fileHash || "Hash pending"}`}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Drawer>
  );
}
