import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wide text-ink-600 font-medium">{label}</p>
        {Icon && (
          <div className="text-brass-600">
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-3xl text-ink-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
