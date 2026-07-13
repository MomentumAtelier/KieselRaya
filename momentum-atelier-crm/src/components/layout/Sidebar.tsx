"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  KanbanSquare,
  ClipboardList,
  ListChecks,
  CalendarDays,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/activities", label: "Activities", icon: ClipboardList },
  { href: "/tasks", label: "Follow-ups", icon: ListChecks },
  { href: "/conferences", label: "Conferences", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-ink-900/10 bg-parchment-50">
      <div className="px-5 py-6 border-b border-ink-900/10">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass-600">
          Momentum
        </p>
        <p className="font-display text-xl italic text-ink-950 -mt-0.5">Atelier</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-sm2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-ink-900 text-parchment-50 font-medium"
                  : "text-ink-700 hover:bg-ink-900/[0.06]"
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-ink-900/10">
        <p className="text-[11px] text-ink-500">Momentum Atelier CRM</p>
      </div>
    </aside>
  );
}
