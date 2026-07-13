"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Activity,
  ActivityType,
  Company,
  Contact,
  Conference,
  Opportunity,
  RelatedEntity,
} from "@/types/database";
import { ACTIVITY_TYPES } from "@/types/database";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import {
  Phone,
  Mail,
  Users,
  StickyNote,
  MessageSquare,
  Linkedin,
  UserPlus,
  Handshake,
  Search,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const TYPE_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  text: MessageSquare,
  linkedin: Linkedin,
  introduction: UserPlus,
  networking: Handshake,
  note: StickyNote,
};

const TYPE_COLOR: Record<ActivityType, string> = {
  call: "bg-brass-500",
  email: "bg-ink-700",
  meeting: "bg-bronze-500",
  text: "bg-ink-500",
  linkedin: "bg-brass-600",
  introduction: "bg-bronze-600",
  networking: "bg-clay-500",
  note: "bg-ink-400",
};

export default function ActivitiesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [relatedLabels, setRelatedLabels] = useState<Record<string, string>>({});
  const [relatedOptions, setRelatedOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadRelated = useCallback(async () => {
    const [{ data: companies }, { data: contacts }, { data: opportunities }, { data: conferences }] =
      await Promise.all([
        supabase.from("companies").select("id,name"),
        supabase.from("contacts").select("id,first_name,last_name"),
        supabase.from("opportunities").select("id,name"),
        supabase.from("conferences").select("id,name"),
      ]);

    const labels: Record<string, string> = {};
    const options: { value: string; label: string }[] = [{ value: "none:none", label: "None" }];

    (companies as Company[] | null)?.forEach((c) => {
      labels[`company:${c.id}`] = c.name;
      options.push({ value: `company:${c.id}`, label: `Company — ${c.name}` });
    });
    (contacts as Contact[] | null)?.forEach((c) => {
      const name = `${c.first_name} ${c.last_name ?? ""}`.trim();
      labels[`contact:${c.id}`] = name;
      options.push({ value: `contact:${c.id}`, label: `Contact — ${name}` });
    });
    (opportunities as Opportunity[] | null)?.forEach((o) => {
      labels[`opportunity:${o.id}`] = o.name;
      options.push({ value: `opportunity:${o.id}`, label: `Opportunity — ${o.name}` });
    });
    (conferences as Conference[] | null)?.forEach((c) => {
      labels[`conference:${c.id}`] = c.name;
      options.push({ value: `conference:${c.id}`, label: `Conference — ${c.name}` });
    });

    setRelatedLabels(labels);
    setRelatedOptions(options);
  }, [supabase]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("activities").select("*").order("activity_date", { ascending: false });
    if (debouncedSearch.trim()) {
      query = query.ilike("subject", `%${debouncedSearch.trim()}%`);
    }
    if (typeFilter) {
      query = query.eq("type", typeFilter);
    }
    const { data, error } = await query;
    if (!error && data) setActivities(data as Activity[]);
    setLoading(false);
  }, [supabase, debouncedSearch, typeFilter]);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  useEffect(() => {
    load();
  }, [load]);

  const fields: FieldConfig[] = [
    { name: "subject", label: "Subject", type: "text", required: true, colSpan: 2 },
    { name: "type", label: "Type", type: "select", required: true, options: ACTIVITY_TYPES },
    { name: "activity_date", label: "Date & time", type: "date", required: true },
    { name: "related_to", label: "Related to", type: "select", options: relatedOptions },
    { name: "description", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  function toPayload(values: Record<string, string | number | null>) {
    const related = String(values.related_to ?? "none:none");
    const [related_to_type, related_to_id] = related.split(":") as [RelatedEntity, string];
    const { related_to, ...rest } = values;
    void related_to;
    return {
      ...rest,
      related_to_type,
      related_to_id: related_to_type === "none" ? null : related_to_id,
    };
  }

  async function handleSubmit(values: Record<string, string | number | null>) {
    const payload = toPayload(values);
    if (editing) {
      const { error } = await supabase.from("activities").update(payload).eq("id", editing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) throw new Error(error.message);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("activities").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      await load();
    }
  }

  // Group activities by calendar day for the timeline.
  const groups: { label: string; items: Activity[] }[] = [];
  for (const activity of activities) {
    const label = formatDate(activity.activity_date);
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(activity);
    else groups.push({ label, items: [activity] });
  }

  return (
    <div>
      <div className="panel p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities…"
              className="field-input pl-8"
            />
          </div>
          <select
            className="field-select max-w-[180px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {ACTIVITY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="sm:ml-auto">
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="btn-accent w-full sm:w-auto"
            >
              <Plus size={15} />
              Log activity
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-ink-500">Loading timeline…</div>
      ) : activities.length === 0 ? (
        <div className="panel p-10 text-center text-ink-500">
          No activities logged yet. Every call, email, and introduction tells the story of a
          relationship — start logging.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="editorial-label mb-3">{group.label}</p>
              <div className="panel divide-y divide-ink-900/[0.06]">
                {group.items.map((activity) => {
                  const Icon = TYPE_ICON[activity.type];
                  const relatedLabel =
                    activity.related_to_type !== "none" && activity.related_to_id
                      ? relatedLabels[`${activity.related_to_type}:${activity.related_to_id}`]
                      : null;
                  return (
                    <div key={activity.id} className="group flex items-start gap-4 p-5">
                      <div
                        className={`h-9 w-9 rounded-full ${TYPE_COLOR[activity.type]} flex items-center justify-center shrink-0 text-parchment-50`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-ink-950">{activity.subject}</p>
                          <span className="text-xs text-ink-500 shrink-0">
                            {new Date(activity.activity_date).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-ink-600 mt-1">{activity.description}</p>
                        )}
                        {relatedLabel && (
                          <p className="text-xs text-brass-600 mt-1.5">{relatedLabel}</p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            setEditing(activity);
                            setModalOpen(true);
                          }}
                          className="btn-ghost !p-1.5"
                          aria-label="Edit"
                          type="button"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleting(activity)}
                          className="btn-ghost !p-1.5 hover:!text-clay-600"
                          aria-label="Delete"
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <RecordModal
          title={editing ? "Edit activity" : "Log activity"}
          fields={fields}
          initialValues={
            editing
              ? {
                  ...editing,
                  activity_date: editing.activity_date?.slice(0, 10),
                  related_to:
                    editing.related_to_type !== "none" && editing.related_to_id
                      ? `${editing.related_to_type}:${editing.related_to_id}`
                      : "none:none",
                }
              : { type: "call", related_to: "none:none" }
          }
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete activity"
          message={`Delete "${deleting.subject}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
