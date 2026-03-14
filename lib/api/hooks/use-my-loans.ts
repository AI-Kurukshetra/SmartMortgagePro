"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api/fetcher";
import { queryKeys } from "@/lib/api/query-keys";
import type { BorrowerLoanStatusDetail, BorrowerLoanSummary } from "@/lib/services/borrower-status";

type MyLoansResponse = { ok: true; loans: BorrowerLoanSummary[] };
type MyLoanDetailResponse = { ok: true } & BorrowerLoanStatusDetail;

export function useMyLoans() {
  return useQuery({
    queryKey: queryKeys.myLoans,
    queryFn: () => fetcher<MyLoansResponse>("/api/my-loans"),
    select: (data) => data.loans,
  });
}

export function useMyLoan(loanId: string) {
  return useQuery({
    queryKey: queryKeys.myLoan(loanId),
    queryFn: () => fetcher<MyLoanDetailResponse>(`/api/my-loans/${loanId}`),
    enabled: Boolean(loanId),
  });
}
