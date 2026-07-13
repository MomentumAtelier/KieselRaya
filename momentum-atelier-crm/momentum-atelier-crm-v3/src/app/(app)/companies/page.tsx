"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";
import { DataTable } from "@/components/crud/DataTable";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ColumnConfig, FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/lib/utils";

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Company name", type: "text", required: true, colSpan: 2 },
  { name: "industry", label: "Industry", type: "text", placeholder: "e.g. Fashion, Retail" },
  { name: "website", label: "Website", type: "url", placeholder: "https://" },
  { name: "linkedin_url", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/company/…" },
  { name: "revenue", label: "Annual revenue (USD)", type: "number", step: "1000" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "address", label: "Address", type: "text" },
  { name: "city", label: "City", type: "text" },
  { name: "state", label: "State / Region", type: "text" },
  { name: "country", label: "Country", type: "text" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export default function CompaniesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.trim();
      query = query.or(
        `name.ilike.%${term}%,industry.ilike.%${term}%,city.ilike.%${term}%,country.ilike.%${term}%`
      );
    }
    const { data, error } = await query;
    if (!error && data) setCompanies(data as Company[]);
    setLoading(false);
  }, [supabase, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnConfig<Company>[] = [
    {
      key: "name",
      header: "Company",
      render: (row) => (
        <div>
          <Link
            href={`/companies/${row.id}`}
            className="font-medium text-ink-950 hover:text-brass-600 transition-colors"
          >
            {row.name}
          </Link>
          {row.website && (
            <a
              href={row.website.startsWith("http") ? row.website : `https://${row.website}`}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-brass-600 hover:underline"
            >
              {row.website}
            </a>
          )}
        </div>
      ),
    },
    { key: "industry", header: "Industry", render: (row) => row.industry ?? "—" },
    {
      key: "location",
      header: "Location",
      render: (row) => [row.city, row.state, row.country].filter(Boolean).join(", ") || "—",
    },
    {
      key: "revenue",
      header: "Revenue",
      render: (row) => (row.revenue ? formatCurrency(row.revenue) : "—"),
    },
    { key: "phone", header: "Phone", render: (row) => row.phone ?? "—" },
    { key: "created_at", header: "Added", render: (row) => formatDate(row.created_at) },
  ];

  async function handleSubmit(values: Record<string, string | number | null>) {
    if (editing) {
      const { error } = await supabase.from("companies").update(values).eq("id", editing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("companies").insert(values);
      if (error) throw new Error(error.message);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("companies").delete().eq("id", deleting.id);
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
        rows={companies}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search companies, industry, city…"
        addLabel="Add company"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleting(row)}
        emptyMessage="No companies yet. Add your first client company."
      />

      {modalOpen && (
        <RecordModal
          title={editing ? "Edit company" : "Add company"}
          fields={FIELDS}
          initialValues={editing ?? {}}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete company"
          message={`Delete "${deleting.name}"? Related contacts and opportunities will remain but lose this link.`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
