"use client";

import { CircularProgress, Stack, TextField } from "@mui/material";
import { Button } from "@/components/ui/button";

type MessageInputProps = {
  body: string;
  isNewThread: boolean;
  isSubmitting: boolean;
  onBodyChange: (value: string) => void;
  onCancelNewThread: () => void;
  onSend: () => void;
  onSubjectChange: (value: string) => void;
  subject: string;
};

export function MessageInput({
  body,
  isNewThread,
  isSubmitting,
  onBodyChange,
  onCancelNewThread,
  onSend,
  onSubjectChange,
  subject,
}: MessageInputProps) {
  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      {isNewThread ? (
        <TextField
          label="Thread subject"
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          fullWidth
          required
          inputProps={{ maxLength: 160 }}
        />
      ) : null}

      <TextField
        label="Message"
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        fullWidth
        required
        multiline
        minRows={4}
        inputProps={{ maxLength: 4000 }}
      />

      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Button type="button" variant="ghost" onClick={onCancelNewThread} disabled={isSubmitting}>
          {isNewThread ? "Cancel new thread" : "Clear draft"}
        </Button>

        <Button type="submit" disabled={isSubmitting || !body.trim() || (isNewThread && !subject.trim())}>
          {isSubmitting ? (
            <>
              <CircularProgress size={14} sx={{ color: "inherit", mr: 1 }} />
              Sending...
            </>
          ) : (
            "Send message"
          )}
        </Button>
      </Stack>
    </Stack>
  );
}
