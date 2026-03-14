import { Activity, BriefcaseBusiness, CircleDollarSign, Siren } from "lucide-react";
import { formatCurrency } from "@/lib/pipeline";

type PipelineStatsProps = {
  activeLoans: number;
  atRiskCount: number;
  closingSoonCount: number;
  totalPipelineValue: number;
};

const cards = [
  {
    key: "activeLoans",
    label: "Active loans",
    icon: BriefcaseBusiness,
    accent: "from-sky-500 to-sky-700",
  },
  {
    key: "totalPipelineValue",
    label: "Pipeline value",
    icon: CircleDollarSign,
    accent: "from-emerald-500 to-emerald-700",
  },
  {
    key: "closingSoonCount",
    label: "Closing soon",
    icon: Activity,
    accent: "from-amber-400 to-orange-500",
  },
  {
    key: "atRiskCount",
    label: "At risk",
    icon: Siren,
    accent: "from-rose-400 to-rose-600",
  },
] as const;

export function PipelineStats({
  activeLoans,
  atRiskCount,
  closingSoonCount,
  totalPipelineValue,
}: PipelineStatsProps) {
  const values = {
    activeLoans: String(activeLoans),
    totalPipelineValue: formatCurrency(totalPipelineValue),
    closingSoonCount: String(closingSoonCount),
    atRiskCount: String(atRiskCount),
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
          >
            <div className={`h-1.5 bg-gradient-to-r ${card.accent}`} />
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{values[card.key]}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
