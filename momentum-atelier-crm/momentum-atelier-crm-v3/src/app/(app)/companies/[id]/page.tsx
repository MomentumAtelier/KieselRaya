import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";
import {
  computeRelationshipScore,
  scoreTier,
  TIER_LABEL,
  TIER_BADGE,
} from "@/lib/relationship";
import {
  ArrowLeft,
  Globe,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Users,
  Target,
  StickyNote,
} from "lucide-react";
import type { Activity, ActivityType, Task } from "@/types/database";

export const dynamic = "force-dynamic";

const ACTIVITY_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

export default async function CompanyProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !company) {
    notFound();
  }

  const [{ data: contacts }, { data: companyOpportunities }, { data: companyActivities }, { data: openTasks }] =
    await Promise.all([
      supabase.from("contacts").select("*").eq("company_id", id).order("first_name"),
      supabase
        .from("opportunities")
        .select("id, name, stage, value, expected_close_date")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activities")
        .select("*")
        .eq("related_to_type", "company")
        .eq("related_to_id", id)
        .order("activity_date", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("related_to_type", "company")
        .eq("related_to_id", id)
        .neq("status", "completed")
        .order("due_date", { ascending: true }),
    ]);

  const contactList = contacts ?? [];
  const opportunityList = companyOpportunities ?? [];
  const activityList = (companyActivities ?? []) as Activity[];
  const taskList = (openTasks ?? []) as Task[];

  const openValue = opportunityList
    .filter((o) => o.stage !== "won" && o.stage !== "lost")
    .reduce((sum, o) => sum + (o.value ?? 0), 0);
  const wonValue = opportunityList
    .filter((o) => o.stage === "won")
    .reduce((sum, o) => sum + (o.value ?? 0), 0);

  const score = computeRelationshipScore({
    activityDates: activityList.map((a) => a.activity_date),
    openOpportunityValue: openValue,
    wonOpportunityValue: wonValue,
  });
  const tier = scoreTier(score);

  const recentTouches = activityList.slice(0, 6);

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brass-600"
      >
        <ArrowLeft size={14} /> Back to companies
      </Link>

      <div className="panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-ink-900 text-parchment-50 flex items-center justify-center font-display text-2xl italic">
              {initials(company.name)}
            </div>
            <div>
              <h1 className="font-display text-3xl italic text-ink-950">{company.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
                {company.industry && <span>{company.industry}</span>}
                {[company.city, company.state, company.country].filter(Boolean).length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {[company.city, company.state, company.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {company.website && (
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brass-600 hover:underline"
                  >
                    <Globe size={13} /> Website
                  </a>
                )}
                {company.linkedin_url && (
                  <a
                    href={company.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brass-600 hover:underline"
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {company.email && (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 text-ink-600 hover:text-brass-600">
                    <Mail size={13} /> {company.email}
                  </a>
                )}
                {company.phone && (
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <Phone size={13} /> {company.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className={`badge ${TIER_BADGE[tier]} text-sm px-3 py-1`}>
            {TIER_LABEL[tier]} relationship &middot; {score}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="panel p-4 text-center">
          <p className="font-display text-2xl text-ink-950">{contactList.length}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">Decision makers</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="font-display text-2xl text-ink-950">{formatCurrency(openValue)}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">Open pipeline</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="font-display text-2xl text-ink-950">{formatCurrency(wonValue)}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">Won revenue</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="font-display text-2xl text-ink-950">
            {company.revenue ? formatCurrency(company.revenue) : "—"}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">Annual revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-bronze-600" />
            <h2 className="font-display text-lg italic text-ink-950">Decision makers</h2>
          </div>
          {contactList.length > 0 ? (
            <ul className="space-y-3">
              {contactList.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="flex items-center justify-between text-sm hover:text-brass-600 transition-colors"
                  >
                    <span className="text-ink-800">
                      {c.first_name} {c.last_name ?? ""}
                    </span>
                    <span className="text-xs text-ink-500">{c.title ?? ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No contacts linked to this company yet.</p>
          )}
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-bronze-600" />
            <h2 className="font-display text-lg italic text-ink-950">Opportunities</h2>
          </div>
          {opportunityList.length > 0 ? (
            <ul className="space-y-3">
              {opportunityList.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-800">{o.name}</span>
                  <span className="font-mono text-xs text-brass-600">{formatCurrency(o.value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No opportunities yet.</p>
          )}
        </div>
      </div>

      {taskList.length > 0 && (
        <div className="panel p-6">
          <h2 className="font-display text-lg italic text-ink-950 mb-4">Upcoming tasks</h2>
          <ul className="space-y-3">
            {taskList.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-800">{t.title}</span>
                <span className="text-xs text-ink-500">{formatDate(t.due_date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel p-6">
        <h2 className="font-display text-lg italic text-ink-950 mb-4">Timeline</h2>
        {recentTouches.length > 0 ? (
          <ul className="space-y-4">
            {recentTouches.map((a) => {
              const Icon = ACTIVITY_ICON[a.type];
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-ink-900/[0.06] flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-brass-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ink-800">{a.subject}</p>
                    {a.description && <p className="text-xs text-ink-500 mt-0.5">{a.description}</p>}
                  </div>
                  <span className="text-xs text-ink-500 shrink-0">{formatDateTime(a.activity_date)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">No activity logged with this company yet.</p>
        )}
      </div>

      {company.notes && (
        <div className="panel p-6">
          <h2 className="font-display text-lg italic text-ink-950 mb-3">Notes</h2>
          <p className="text-sm text-ink-700 whitespace-pre-wrap">{company.notes}</p>
        </div>
      )}
    </div>
  );
}
