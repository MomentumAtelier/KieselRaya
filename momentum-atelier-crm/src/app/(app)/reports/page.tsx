import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils";
import { OPPORTUNITY_STAGES } from "@/types/database";
import { DollarSign, Percent, Trophy, Building2 } from "lucide-react";

const STAGE_BAR_COLOR: Record<string, string> = {
  lead: "bg-ink-500",
  qualified: "bg-brass-400",
  proposal: "bg-brass-500",
  negotiation: "bg-clay-500",
  won: "bg-emerald-600",
  lost: "bg-ink-300",
};

export default async function ReportsPage() {
  const supabase = createClient();

  const [{ data: opportunities }, { data: tasks }, { data: activities }, { data: companies }] =
    await Promise.all([
      supabase.from("opportunities").select("stage, value, company_id, companies(name)"),
      supabase.from("tasks").select("status, priority"),
      supabase.from("activities").select("type"),
      supabase.from("companies").select("id, name"),
    ]);

  const opps = opportunities ?? [];
  const wonOpps = opps.filter((o) => o.stage === "won");
  const lostOpps = opps.filter((o) => o.stage === "lost");
  const openOpps = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");

  const totalPipelineValue = openOpps.reduce((sum, o) => sum + (o.value ?? 0), 0);
  const wonValue = wonOpps.reduce((sum, o) => sum + (o.value ?? 0), 0);
  const closedCount = wonOpps.length + lostOpps.length;
  const winRate = closedCount > 0 ? Math.round((wonOpps.length / closedCount) * 100) : 0;

  const stageTotals = OPPORTUNITY_STAGES.map((stage) => {
    const stageOpps = opps.filter((o) => o.stage === stage.value);
    return {
      value: stage.value,
      label: stage.label,
      count: stageOpps.length,
      total: stageOpps.reduce((sum, o) => sum + (o.value ?? 0), 0),
    };
  });
  const maxStageValue = Math.max(1, ...stageTotals.map((s) => s.total));

  const companyValueMap = new Map<string, { name: string; value: number }>();
  opps.forEach((o) => {
    if (!o.company_id) return;
    const companyName =
      (o as unknown as { companies: { name: string } | null }).companies?.name ?? "Unknown";
    const existing = companyValueMap.get(o.company_id) ?? { name: companyName, value: 0 };
    existing.value += o.value ?? 0;
    companyValueMap.set(o.company_id, existing);
  });
  const topCompanies = Array.from(companyValueMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const maxCompanyValue = Math.max(1, ...topCompanies.map((c) => c.value));

  const taskList = tasks ?? [];
  const taskStatusCounts = {
    pending: taskList.filter((t) => t.status === "pending").length,
    in_progress: taskList.filter((t) => t.status === "in_progress").length,
    completed: taskList.filter((t) => t.status === "completed").length,
  };

  const activityList = activities ?? [];
  const activityTypeCounts = {
    call: activityList.filter((a) => a.type === "call").length,
    email: activityList.filter((a) => a.type === "email").length,
    meeting: activityList.filter((a) => a.type === "meeting").length,
    note: activityList.filter((a) => a.type === "note").length,
  };
  const maxActivityCount = Math.max(1, ...Object.values(activityTypeCounts));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open pipeline value" value={formatCurrency(totalPipelineValue)} icon={DollarSign} />
        <StatCard label="Won value" value={formatCurrency(wonValue)} icon={Trophy} />
        <StatCard
          label="Win rate"
          value={`${winRate}%`}
          icon={Percent}
          hint={`${wonOpps.length} won / ${lostOpps.length} lost`}
        />
        <StatCard label="Client companies" value={String(companies?.length ?? 0)} icon={Building2} />
      </div>

      <div className="panel p-5">
        <h2 className="font-display text-lg italic text-ink-950 mb-4">Pipeline value by stage</h2>
        <div className="space-y-3">
          {stageTotals.map((stage) => (
            <div key={stage.value} className="flex items-center gap-3">
              <span className="w-24 text-xs text-ink-600 shrink-0">{stage.label}</span>
              <div className="flex-1 h-6 rounded-sm2 bg-ink-900/5 overflow-hidden">
                <div
                  className={`h-full ${STAGE_BAR_COLOR[stage.value]} rounded-sm2`}
                  style={{
                    width: `${stage.total > 0 ? Math.max(4, (stage.total / maxStageValue) * 100) : 0}%`,
                  }}
                />
              </div>
              <span className="w-28 text-right font-mono text-xs text-ink-700 shrink-0">
                {formatCurrency(stage.total)}
              </span>
              <span className="w-10 text-right text-xs text-ink-500 shrink-0">{stage.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h2 className="font-display text-lg italic text-ink-950 mb-4">Top companies by pipeline value</h2>
          {topCompanies.length > 0 ? (
            <div className="space-y-3">
              {topCompanies.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-ink-600 truncate shrink-0">{c.name}</span>
                  <div className="flex-1 h-5 rounded-sm2 bg-ink-900/5 overflow-hidden">
                    <div
                      className="h-full bg-brass-500 rounded-sm2"
                      style={{ width: `${Math.max(4, (c.value / maxCompanyValue) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs text-ink-700 shrink-0">
                    {formatCurrency(c.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">No opportunities linked to companies yet.</p>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="font-display text-lg italic text-ink-950 mb-4">Activity mix</h2>
          <div className="space-y-3">
            {Object.entries(activityTypeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-20 text-xs text-ink-600 capitalize shrink-0">{type}</span>
                <div className="flex-1 h-5 rounded-sm2 bg-ink-900/5 overflow-hidden">
                  <div
                    className="h-full bg-ink-700 rounded-sm2"
                    style={{ width: `${Math.max(4, (count / maxActivityCount) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-ink-500 shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="font-display text-lg italic text-ink-950 mb-4">Follow-up tasks by status</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-sm2 border border-ink-900/10 p-4 text-center">
            <p className="text-2xl font-display text-ink-950">{taskStatusCounts.pending}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">Pending</p>
          </div>
          <div className="rounded-sm2 border border-ink-900/10 p-4 text-center">
            <p className="text-2xl font-display text-ink-950">{taskStatusCounts.in_progress}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">In progress</p>
          </div>
          <div className="rounded-sm2 border border-ink-900/10 p-4 text-center">
            <p className="text-2xl font-display text-ink-950">{taskStatusCounts.completed}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
