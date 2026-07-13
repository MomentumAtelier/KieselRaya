import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatDateTime, initials, daysAgoLabel } from "@/lib/utils";
import {
  computeRelationshipScore,
  scoreTier,
  TIER_LABEL,
  TIER_BADGE,
} from "@/lib/relationship";
import { AiSuggestionPanel } from "@/components/contacts/AiSuggestionPanel";
import {
  ArrowLeft,
  Linkedin,
  Mail,
  Phone,
  Cake,
  UserRound,
  Heart,
  MessageCircle,
  Building2,
  Target,
  StickyNote,
  MessageSquare,
  UserPlus,
  Handshake,
} from "lucide-react";
import type { Activity, ActivityType, Task } from "@/types/database";
import { COMMUNICATION_PREFERENCES } from "@/types/database";

export const dynamic = "force-dynamic";

const ACTIVITY_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: UserRound,
  text: MessageSquare,
  linkedin: Linkedin,
  introduction: UserPlus,
  networking: Handshake,
  note: StickyNote,
};

export default async function ContactProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*, companies(id, name)")
    .eq("id", id)
    .single();

  if (error || !contact) {
    notFound();
  }

  const company = (contact as unknown as { companies: { id: string; name: string } | null }).companies;

  const [{ data: contactActivities }, { data: contactOpportunities }, { data: openTasks }] =
    await Promise.all([
      supabase
        .from("activities")
        .select("*")
        .eq("related_to_type", "contact")
        .eq("related_to_id", id)
        .order("activity_date", { ascending: false }),
      supabase
        .from("opportunities")
        .select("id, name, stage, value")
        .eq("contact_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("related_to_type", "contact")
        .eq("related_to_id", id)
        .neq("status", "completed")
        .order("due_date", { ascending: true }),
    ]);

  const activityList = (contactActivities ?? []) as Activity[];
  const opportunityList = contactOpportunities ?? [];
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
  const lastContactDate = activityList[0]?.activity_date ?? null;

  const preferenceLabel = COMMUNICATION_PREFERENCES.find(
    (p) => p.value === contact.communication_preference
  )?.label;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brass-600"
      >
        <ArrowLeft size={14} /> Back to contacts
      </Link>

      <div className="panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            {contact.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.photo_url}
                alt={`${contact.first_name} ${contact.last_name ?? ""}`}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-brass-500 text-parchment-50 flex items-center justify-center font-display text-2xl italic">
                {initials(`${contact.first_name} ${contact.last_name ?? ""}`)}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl italic text-ink-950">
                {contact.first_name} {contact.last_name ?? ""}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
                {contact.title && <span>{contact.title}</span>}
                {company && (
                  <Link
                    href={`/companies/${company.id}`}
                    className="flex items-center gap-1 text-brass-600 hover:underline"
                  >
                    <Building2 size={12} /> {company.name}
                  </Link>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-ink-600 hover:text-brass-600">
                    <Mail size={13} /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <Phone size={13} /> {contact.phone}
                  </span>
                )}
                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brass-600 hover:underline"
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`badge ${TIER_BADGE[tier]} text-sm px-3 py-1`}>
              {TIER_LABEL[tier]} &middot; {score}/100
            </span>
            <span className="text-xs text-ink-500">
              Last contact: {daysAgoLabel(lastContactDate)}
            </span>
          </div>
        </div>
      </div>

      <AiSuggestionPanel contactId={contact.id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-bronze-600" />
            <h2 className="font-display text-lg italic text-ink-950">Personal profile</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-500 flex items-center gap-1.5">
                <Cake size={13} /> Birthday
              </dt>
              <dd className="text-ink-800">{contact.birthday ? formatDate(contact.birthday) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500 flex items-center gap-1.5">
                <UserRound size={13} /> Assistant
              </dt>
              <dd className="text-ink-800">{contact.assistant_name ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500 flex items-center gap-1.5">
                <MessageCircle size={13} /> Prefers
              </dt>
              <dd className="text-ink-800">{preferenceLabel ?? "—"}</dd>
            </div>
            {contact.interests && (
              <div>
                <dt className="text-ink-500 mb-1">Interests</dt>
                <dd className="text-ink-800">{contact.interests}</dd>
              </div>
            )}
            {contact.family_notes && (
              <div>
                <dt className="text-ink-500 mb-1">Family</dt>
                <dd className="text-ink-800 whitespace-pre-wrap">{contact.family_notes}</dd>
              </div>
            )}
            {contact.personal_notes && (
              <div>
                <dt className="text-ink-500 mb-1">Personal notes</dt>
                <dd className="text-ink-800 whitespace-pre-wrap">{contact.personal_notes}</dd>
              </div>
            )}
          </dl>
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
            <p className="text-sm text-ink-500">No opportunities linked yet.</p>
          )}

          {taskList.length > 0 && (
            <>
              <div className="h-px bg-ink-900/10 my-4" />
              <p className="text-xs uppercase tracking-wide text-ink-500 mb-3">Upcoming tasks</p>
              <ul className="space-y-3">
                {taskList.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-800">{t.title}</span>
                    <span className="text-xs text-ink-500">{formatDate(t.due_date)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-lg italic text-ink-950 mb-4">Timeline</h2>
        {activityList.length > 0 ? (
          <ul className="space-y-4">
            {activityList.slice(0, 10).map((a) => {
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
          <p className="text-sm text-ink-500">No activity logged with this contact yet.</p>
        )}
      </div>

      {contact.notes && (
        <div className="panel p-6">
          <h2 className="font-display text-lg italic text-ink-950 mb-3">General notes</h2>
          <p className="text-sm text-ink-700 whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}
