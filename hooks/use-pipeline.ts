"use client";

import { useDeferredValue, useState } from "react";
import {
  getCloseTone,
  getDaysUntilClose,
  getOutstandingTaskCount,
  isTeamViewRole,
  pipelineStageLabels,
  pipelineStages,
  type PipelineViewer,
} from "@/lib/pipeline";
import type { LoanRecord, LoanStage } from "@/types/database.types";

export type StageFilter = LoanStage | "all";
export type LoanOfficerFilter = "all" | "me";
export type CloseDateFilter = "all" | "closing-soon" | "overdue" | "no-date";

type UsePipelineOptions = {
  loans: LoanRecord[];
  viewer: PipelineViewer;
};

function matchesCloseDateFilter(loan: LoanRecord, filter: CloseDateFilter) {
  if (filter === "all") return true;
  if (filter === "no-date") return loan.expected_close_date === null;
  if (!loan.expected_close_date) return false;

  const daysUntilClose = getDaysUntilClose(loan.expected_close_date);
  if (filter === "closing-soon") return daysUntilClose >= 0 && daysUntilClose <= 14;
  return daysUntilClose < 0;
}

function sortByUrgency(a: LoanRecord, b: LoanRecord) {
  const priorityWeight = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const stageDateA = new Date(a.updated_at).getTime();
  const stageDateB = new Date(b.updated_at).getTime();
  const priorityOrder = priorityWeight[a.priority] - priorityWeight[b.priority];

  if (priorityOrder !== 0) return priorityOrder;
  return stageDateA - stageDateB;
}

export function usePipeline({ loans, viewer }: UsePipelineOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<LoanOfficerFilter>(
    isTeamViewRole(viewer.role) ? "all" : "me",
  );
  const [closeDateFilter, setCloseDateFilter] = useState<CloseDateFilter>("all");

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const normalizedQuery = deferredSearchTerm.trim().toLowerCase();

  const filteredLoans = loans
    .filter((loan) => {
      if (stageFilter !== "all" && loan.stage !== stageFilter) return false;
      if (!matchesCloseDateFilter(loan, closeDateFilter)) return false;

      if (normalizedQuery.length === 0) return true;

      return (
        loan.borrower_name.toLowerCase().includes(normalizedQuery) ||
        loan.property_address.toLowerCase().includes(normalizedQuery) ||
        pipelineStageLabels[loan.stage].toLowerCase().includes(normalizedQuery) ||
        loan.priority.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort(sortByUrgency);

  const columns = pipelineStages.map((stage) => ({
    stage,
    label: pipelineStageLabels[stage],
    loans: filteredLoans.filter((loan) => loan.stage === stage),
  }));

  const totalPipelineValue = filteredLoans.reduce((total, loan) => total + loan.loan_amount, 0);
  const closingSoonCount = filteredLoans.filter(
    (loan) =>
      loan.expected_close_date !== null &&
      getCloseTone(loan.expected_close_date) === "attention",
  ).length;
  const atRiskCount = filteredLoans.filter(
    (loan) => getOutstandingTaskCount(loan) >= 5 || getCloseTone(loan.expected_close_date) === "critical",
  ).length;

  return {
    canViewTeam: isTeamViewRole(viewer.role),
    closeDateFilter,
    columns,
    filteredLoans,
    loanOfficerFilter,
    searchTerm,
    setCloseDateFilter,
    setLoanOfficerFilter,
    setSearchTerm,
    setStageFilter,
    stageFilter,
    stats: {
      activeLoans: filteredLoans.length,
      atRiskCount,
      closingSoonCount,
      totalPipelineValue,
    },
  };
}
