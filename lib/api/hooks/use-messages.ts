"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import { queryKeys } from "@/lib/api/query-keys";
import type { MessageThreadSummary } from "@/lib/messages/types";

type MessagesResponse = { ok: true; threads: MessageThreadSummary[]; messages: unknown[] };
type SendMessageResponse = { ok: true };

export function useLoanMessages(loanId: string) {
  return useQuery({
    queryKey: queryKeys.messages(loanId),
    queryFn: () => fetcher<MessagesResponse>(`/api/loans/${loanId}/messages`),
    enabled: Boolean(loanId),
    refetchInterval: 15_000,
    select: (data) => data.threads,
  });
}

export function useCommunications() {
  return useQuery({
    queryKey: queryKeys.communications,
    queryFn: () => fetcher<{ ok: true; threads: MessageThreadSummary[] }>("/api/communications"),
    refetchInterval: 30_000,
    select: (data) => data.threads,
  });
}

export function useSendMessage(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      threadId?: string;
      subject?: string;
      body: string;
      isTemplate?: boolean;
    }) =>
      fetcher<SendMessageResponse>(`/api/loans/${loanId}/messages`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      toast.success("Message sent.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(loanId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.communications });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
