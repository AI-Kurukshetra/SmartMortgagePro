"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import { queryKeys } from "@/lib/api/query-keys";

type DisclosuresResponse = { ok: true; disclosures: unknown[] };
type GenerateDisclosureResponse = { ok: true; disclosure: unknown };

export function useDisclosures(loanId: string) {
  return useQuery({
    queryKey: queryKeys.disclosures(loanId),
    queryFn: () => fetcher<DisclosuresResponse>(`/api/loans/${loanId}/disclosures`),
    enabled: Boolean(loanId),
    select: (data) => data.disclosures,
  });
}

export function useGenerateDisclosure(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { type: "loan_estimate" | "closing_disclosure"; state: string }) =>
      fetcher<GenerateDisclosureResponse>(`/api/loans/${loanId}/disclosures`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Disclosure generated.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.disclosures(loanId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
