"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Activity, ActivityType, Company, Contact, Conference, Opportunity, RelatedEntity } from "@/types/database";
import { DataTable } from "@/components/crud/DataTable";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ColumnConfig, FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/utils";
import { Phone, Mail, Users, StickyNote } from "lucide-react";

const TYPE_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

const TYPE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
];

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
    { name: "type", label: "Type", type: "select", required: true, options: TYPE_OPTIONS },
    { name: "activity_date", label: "Date & time", type: "date", required: true },
    { name: "related_to", label: "Related to", type: "select", options: relatedOptions },
    { name: "description", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  const columns: ColumnConfig<Activity>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (row) => {
        const Icon = TYPE_ICON[row.type];
        return (
          <div className="flex items-start gap-2">
            <Icon size={15} className="mt-0.5 text-brass-600 shrink-0" />
            <div>
              <p className="font-medium text-ink-950">{row.subject}</p>
              {row.description && (
                <p className="text-xs text-ink-500 line-clamp-1 max-w-md">{row.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "related",
      header: "Related to",
      render: (row) =>
        row.related_to_type !== "none" && row.related_to_id
          ? relatedLabels[`${row.related_to_type}:${row.related_to_id}`] ?? "—"
          : "—",
    },
    { key: "date", header: "Date", render: (row) => formatDateTime(row.activity_date) },
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

  return (
    <div>
      <DataTable
        columns={columns}
        rows={activities}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search activities…"
        addLabel="Log activity"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleting(row)}
        emptyMessage="No activities logged yet."
        filterSlot={
          <select
            className="field-select max-w-[160px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        }
      />

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
