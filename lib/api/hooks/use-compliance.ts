"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import { queryKeys } from "@/lib/api/query-keys";

type ComplianceSummary = {
  ok: true;
  summary: {
    violations: number;
    warnings: number;
    passes: number;
    pending: number;
  };
};

type ComplianceChecksResponse = {
  ok: true;
  checks: Array<{
    id: string;
    regulation: string;
    check_name: string;
    status: string;
    description: string;
    deadline: string | null;
  }>;
};

export function useComplianceSummary(loanId: string) {
  return useQuery({
    queryKey: queryKeys.compliance(loanId),
    queryFn: () => fetcher<ComplianceSummary>(`/api/loans/${loanId}/compliance`),
    enabled: Boolean(loanId),
  });
}

export function useComplianceChecks(loanId: string) {
  return useQuery({
    queryKey: queryKeys.complianceChecks(loanId),
    queryFn: () => fetcher<ComplianceChecksResponse>(`/api/loans/${loanId}/compliance/checks`),
    enabled: Boolean(loanId),
  });
}

export function useResolveComplianceCheck(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ checkId, notes }: { checkId: string; notes?: string }) =>
      fetcher<{ ok: true }>(`/api/loans/${loanId}/compliance/checks/${checkId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "resolve", notes }),
      }),
    onSuccess: () => {
      toast.success("Compliance check resolved.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.compliance(loanId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.complianceChecks(loanId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
