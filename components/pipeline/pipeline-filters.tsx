import { Search } from "lucide-react";
import { pipelineStageLabels, pipelineStages } from "@/lib/pipeline";
import { Input } from "@/components/ui/input";
import type {
  CloseDateFilter,
  LoanOfficerFilter,
  StageFilter,
} from "@/hooks/use-pipeline";

type PipelineFiltersProps = {
  canViewTeam: boolean;
  closeDateFilter: CloseDateFilter;
  loanOfficerFilter: LoanOfficerFilter;
  onCloseDateFilterChange: (value: CloseDateFilter) => void;
  onLoanOfficerFilterChange: (value: LoanOfficerFilter) => void;
  onSearchTermChange: (value: string) => void;
  onStageFilterChange: (value: StageFilter) => void;
  searchTerm: string;
  stageFilter: StageFilter;
};

export function PipelineFilters({
  canViewTeam,
  closeDateFilter,
  loanOfficerFilter,
  onCloseDateFilterChange,
  onLoanOfficerFilterChange,
  onSearchTermChange,
  onStageFilterChange,
  searchTerm,
  stageFilter,
}: PipelineFiltersProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="grid gap-4 xl:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            className="pl-10"
            placeholder="Search borrower, address, stage, or priority"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-600">
          <span>Stage</span>
          <select
            value={stageFilter}
            onChange={(event) => onStageFilterChange(event.target.value as StageFilter)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="all">All stages</option>
            {pipelineStages.map((stage) => (
              <option key={stage} value={stage}>
                {pipelineStageLabels[stage]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-600">
          <span>Loan officer</span>
          <select
            data-testid="filter-loan-officer"
            value={loanOfficerFilter}
            onChange={(event) => onLoanOfficerFilterChange(event.target.value as LoanOfficerFilter)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            {canViewTeam ? <option value="all">All team members</option> : null}
            <option value="me">My queue</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-600">
          <span>Close date</span>
          <select
            value={closeDateFilter}
            onChange={(event) => onCloseDateFilterChange(event.target.value as CloseDateFilter)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="all">All close dates</option>
            <option value="closing-soon">Closing in 14 days</option>
            <option value="overdue">Past due close date</option>
            <option value="no-date">Missing close date</option>
          </select>
        </label>
      </div>
    </div>
  );
}
