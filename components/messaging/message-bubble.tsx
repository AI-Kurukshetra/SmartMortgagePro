"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { MessageRecord } from "@/lib/messages/types";

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRole(role: MessageRecord["sender_role"]) {
  return role.replace(/_/g, " ");
}

export function MessageBubble({
  isOwnMessage,
  message,
}: {
  isOwnMessage: boolean;
  message: MessageRecord;
}) {
  return (
    <Stack
      alignItems={isOwnMessage ? "flex-end" : "flex-start"}
      spacing={0.75}
      sx={{ width: "100%" }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ px: 0.5, color: "text.secondary" }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {message.sender_name}
        </Typography>
        <Typography variant="caption">{formatRole(message.sender_role)}</Typography>
        <Typography variant="caption">{formatSentAt(message.created_at)}</Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          maxWidth: { xs: "100%", md: "84%" },
          borderRadius: 3,
          border: "1px solid",
          borderColor: isOwnMessage ? "secondary.light" : "divider",
          bgcolor: isOwnMessage ? "rgba(10, 126, 164, 0.08)" : "background.paper",
          px: 2,
          py: 1.5,
        }}
      >
        <Stack spacing={1}>
          {message.is_template ? (
            <Box>
              <Chip
                label={(message.template_type ?? "template").replace(/_/g, " ")}
                size="small"
                color="primary"
                sx={{ textTransform: "capitalize" }}
              />
            </Box>
          ) : null}
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", color: "text.primary", lineHeight: 1.6 }}
          >
            {message.body}
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
