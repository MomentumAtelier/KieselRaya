import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Users, ListChecks, TrendingUp } from "lucide-react";
import { OPPORTUNITY_STAGES } from "@/types/database";

// Explicit, in addition to the same setting already inherited from the
// parent (app) layout — this page reads live per-user data on every visit.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { count: companyCount },
    { count: contactCount },
    { data: openOpportunities },
    { count: openTaskCount },
    { data: upcomingTasks },
    { data: recentActivities },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("opportunities").select("value, stage").not("stage", "in", "(won,lost)"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).neq("status", "completed"),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("activities")
      .select("id, subject, type, activity_date")
      .order("activity_date", { ascending: false })
      .limit(5),
  ]);

  const pipelineValue = (openOpportunities ?? []).reduce((sum, o) => sum + (o.value ?? 0), 0);
  const openOppCount = (openOpportunities ?? []).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Companies" value={String(companyCount ?? 0)} icon={Building2} />
        <StatCard label="Contacts" value={String(contactCount ?? 0)} icon={Users} />
        <StatCard
          label="Open pipeline"
          value={formatCurrency(pipelineValue)}
          icon={TrendingUp}
          hint={`${openOppCount} active opportunit${openOppCount === 1 ? "y" : "ies"}`}
        />
        <StatCard label="Open follow-ups" value={String(openTaskCount ?? 0)} icon={ListChecks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg italic text-ink-950">Upcoming follow-ups</h2>
            <Link href="/tasks" className="text-xs text-brass-600 hover:underline">
              View all
            </Link>
          </div>
          {upcomingTasks && upcomingTasks.length > 0 ? (
            <ul className="space-y-3">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-800">{task.title}</span>
                  <span className="text-xs text-ink-500">{formatDate(task.due_date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No open follow-ups. Nice and clear.</p>
          )}
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg italic text-ink-950">Recent activity</h2>
            <Link href="/activities" className="text-xs text-brass-600 hover:underline">
              View all
            </Link>
          </div>
          {recentActivities && recentActivities.length > 0 ? (
            <ul className="space-y-3">
              {recentActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-800">{a.subject}</span>
                  <span className="text-xs text-ink-500">{formatDate(a.activity_date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No activity logged yet.</p>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg italic text-ink-950">Pipeline snapshot</h2>
          <Link href="/pipeline" className="text-xs text-brass-600 hover:underline">
            Open board
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {OPPORTUNITY_STAGES.map((stage) => {
            const count = (openOpportunities ?? []).filter((o) => o.stage === stage.value).length;
            return (
              <div key={stage.value} className="rounded-sm2 border border-ink-900/10 p-3 text-center">
                <p className="text-2xl font-display text-ink-950">
                  {stage.value === "won" || stage.value === "lost" ? "—" : count}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
