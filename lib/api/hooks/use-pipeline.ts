"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import { queryKeys } from "@/lib/api/query-keys";
import type { LoanRecord, LoanStage } from "@/types/database.types";

type PipelineResponse = { ok: true; loans: LoanRecord[] };
type StageResponse = { ok: true; loan: LoanRecord };

export function usePipelineLoans() {
  return useQuery({
    queryKey: queryKeys.pipeline,
    queryFn: () => fetcher<PipelineResponse>("/api/pipeline"),
    select: (data) => data.loans,
  });
}

export function useUpdateLoanStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ loanId, stage }: { loanId: string; stage: LoanStage }) =>
      fetcher<StageResponse>(`/api/pipeline/${loanId}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      }),
    onSuccess: () => {
      toast.success("Loan stage updated.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
