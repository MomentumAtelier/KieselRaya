"use client";

import { Pencil, Trash2, Search, Plus } from "lucide-react";
import type { ColumnConfig } from "./types";

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  onAdd,
  addLabel = "Add",
  onEdit,
  onDelete,
  emptyMessage = "No records yet.",
  filterSlot,
}: {
  columns: ColumnConfig<T>[];
  rows: T[];
  loading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  emptyMessage?: string;
  filterSlot?: React.ReactNode;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-ink-900/10">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="field-input pl-8"
          />
        </div>
        {filterSlot}
        <div className="sm:ml-auto">
          {onAdd && (
            <button onClick={onAdd} className="btn-accent w-full sm:w-auto">
              <Plus size={15} />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 bg-ink-900/[0.02]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left font-medium text-ink-600 text-xs uppercase tracking-wide px-4 py-3 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-ink-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-ink-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-ink-900/[0.06] last:border-0 hover:bg-ink-900/[0.02] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 align-top ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(row)}
                      className="btn-ghost !p-1.5"
                      aria-label="Edit"
                      type="button"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      className="btn-ghost !p-1.5 hover:!text-clay-600"
                      aria-label="Delete"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
