import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  Users,
  ListChecks,
  TrendingUp,
  ArrowUpRight,
  CalendarClock,
  Flame,
} from "lucide-react";
import { OPPORTUNITY_STAGES } from "@/types/database";
import {
  computeRelationshipScore,
  scoreTier,
  TIER_LABEL,
  TIER_DOT,
} from "@/lib/relationship";

// Explicit, in addition to the same setting already inherited from the
// parent (app) layout — this page reads live per-user data on every visit.
export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: companyCount },
    { data: contacts },
    { data: opportunities },
    { data: tasks },
    { data: contactActivityRows },
    { data: recentActivities },
    { data: upcomingMeetings },
    { data: conferenceFollowUps },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("id, first_name, last_name, company_id"),
    supabase
      .from("opportunities")
      .select("id, name, stage, value, contact_id, company_id, companies(name)"),
    supabase.from("tasks").select("id, title, due_date, priority, status"),
    supabase.from("activities").select("related_to_id, activity_date").eq("related_to_type", "contact"),
    supabase
      .from("activities")
      .select("id, subject, type, activity_date")
      .order("activity_date", { ascending: false })
      .limit(6),
    supabase
      .from("activities")
      .select("id, subject, activity_date")
      .eq("type", "meeting")
      .gte("activity_date", today)
      .order("activity_date", { ascending: true })
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("related_to_type", "conference")
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(5),
  ]);

  const allContacts = contacts ?? [];
  const allOpportunities =
    (opportunities as unknown as Array<{
      id: string;
      name: string;
      stage: string;
      value: number | null;
      contact_id: string | null;
      company_id: string | null;
      companies: { name: string } | null;
    }>) ?? [];
  const allTasks = tasks ?? [];

  const openOpportunities = allOpportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const pipelineValue = openOpportunities.reduce((sum, o) => sum + (o.value ?? 0), 0);
  const openTaskCount = allTasks.filter((t) => t.status !== "completed").length;

  // Build per-contact activity + opportunity-value maps for relationship scoring.
  const activityDatesByContact = new Map<string, string[]>();
  (contactActivityRows ?? []).forEach((row) => {
    if (!row.related_to_id) return;
    const list = activityDatesByContact.get(row.related_to_id) ?? [];
    list.push(row.activity_date);
    activityDatesByContact.set(row.related_to_id, list);
  });

  const valueByContact = new Map<string, { open: number; won: number }>();
  allOpportunities.forEach((o) => {
    if (!o.contact_id) return;
    const entry = valueByContact.get(o.contact_id) ?? { open: 0, won: 0 };
    if (o.stage === "won") entry.won += o.value ?? 0;
    else if (o.stage !== "lost") entry.open += o.value ?? 0;
    valueByContact.set(o.contact_id, entry);
  });

  const scoredContacts = allContacts.map((c) => {
    const score = computeRelationshipScore({
      activityDates: activityDatesByContact.get(c.id) ?? [],
      openOpportunityValue: valueByContact.get(c.id)?.open ?? 0,
      wonOpportunityValue: valueByContact.get(c.id)?.won ?? 0,
    });
    return { ...c, score, tier: scoreTier(score) };
  });

  const needsAttention = scoredContacts
    .filter((c) => c.tier === "cold" || c.tier === "cooling")
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const todaysFocus = allTasks
    .filter((t) => t.status !== "completed" && t.due_date && t.due_date <= today)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 6);

  const highValueOpportunities = [...openOpportunities]
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="editorial-label mb-2">
          Building relationships. Developing revenue. Creating momentum.
        </p>
        <h1 className="font-display text-4xl italic text-ink-950">{greeting()}.</h1>
        <p className="mt-2 text-sm text-ink-600 max-w-xl">
          Here is where every relationship in motion stands today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Companies" value={String(companyCount ?? 0)} icon={Building2} />
        <StatCard label="Contacts" value={String(allContacts.length)} icon={Users} />
        <StatCard
          label="Open pipeline"
          value={formatCurrency(pipelineValue)}
          icon={TrendingUp}
          hint={`${openOpportunities.length} active opportunit${openOpportunities.length === 1 ? "y" : "ies"}`}
        />
        <StatCard label="Open follow-ups" value={String(openTaskCount)} icon={ListChecks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel panel-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg italic text-ink-950">Today's focus</h2>
            <Link href="/tasks" className="text-xs text-brass-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {todaysFocus.length > 0 ? (
            <ul className="space-y-3">
              {todaysFocus.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-800">{task.title}</span>
                  <span
                    className={`text-xs ${
                      task.due_date && task.due_date < today ? "text-clay-600" : "text-ink-500"
                    }`}
                  >
                    {task.due_date === today ? "Today" : formatDate(task.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nothing due today. A clear runway.</p>
          )}
        </div>

        <div className="panel panel-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg italic text-ink-950">Relationships needing attention</h2>
            <Link href="/contacts" className="text-xs text-brass-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {needsAttention.length > 0 ? (
            <ul className="space-y-3">
              {needsAttention.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <Link href={`/contacts/${c.id}`} className="text-ink-800 hover:text-brass-600">
                    {c.first_name} {c.last_name ?? ""}
                  </Link>
                  <span className="flex items-center gap-1.5 text-xs text-ink-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[c.tier]}`} />
                    {TIER_LABEL[c.tier]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Every relationship is warm right now.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel panel-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg italic text-ink-950">High-value opportunities</h2>
            <Link href="/opportunities" className="text-xs text-brass-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {highValueOpportunities.length > 0 ? (
            <ul className="space-y-3">
              {highValueOpportunities.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-ink-800">{o.name}</p>
                    {o.companies?.name && <p className="text-xs text-ink-500">{o.companies.name}</p>}
                  </div>
                  <span className="font-mono text-xs text-brass-600">{formatCurrency(o.value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No open opportunities yet.</p>
          )}
        </div>

        <div className="panel panel-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg italic text-ink-950">Recent activity</h2>
            <Link href="/activities" className="text-xs text-brass-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
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

      {(upcomingMeetings?.length ?? 0) > 0 || (conferenceFollowUps?.length ?? 0) > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="panel panel-hover p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock size={16} className="text-bronze-600" />
              <h2 className="font-display text-lg italic text-ink-950">Upcoming meetings</h2>
            </div>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <ul className="space-y-3">
                {upcomingMeetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-800">{m.subject}</span>
                    <span className="text-xs text-ink-500">{formatDate(m.activity_date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">Nothing scheduled yet.</p>
            )}
          </div>

          <div className="panel panel-hover p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-bronze-600" />
              <h2 className="font-display text-lg italic text-ink-950">Conference follow-ups</h2>
            </div>
            {conferenceFollowUps && conferenceFollowUps.length > 0 ? (
              <ul className="space-y-3">
                {conferenceFollowUps.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-800">{t.title}</span>
                    <span className="text-xs text-ink-500">{formatDate(t.due_date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No open conference follow-ups.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg italic text-ink-950">Pipeline health</h2>
          <Link href="/pipeline" className="text-xs text-brass-600 hover:underline flex items-center gap-1">
            Open board <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {OPPORTUNITY_STAGES.map((stage) => {
            const count = openOpportunities.filter((o) => o.stage === stage.value).length;
            return (
              <div key={stage.value} className="rounded-xl border border-ink-900/10 p-3 text-center">
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
