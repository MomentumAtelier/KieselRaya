"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/activities", label: "Activities" },
  { href: "/tasks", label: "Follow-ups" },
  { href: "/conferences", label: "Conferences" },
  { href: "/reports", label: "Reports" },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/companies": "Companies",
  "/contacts": "Contacts",
  "/opportunities": "Opportunities",
  "/pipeline": "Sales pipeline",
  "/activities": "Activities",
  "/tasks": "Follow-up tasks",
  "/conferences": "Conferences",
  "/reports": "Reports",
};

export function Header({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const title =
    TITLES[pathname] ??
    Object.entries(TITLES).find(([href]) => pathname.startsWith(href))?.[1] ??
    "Momentum Atelier";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink-900/10 bg-parchment-100/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden btn-ghost !px-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <h1 className="font-display text-xl italic text-ink-950">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {email && <span className="hidden sm:block text-xs text-ink-600">{email}</span>}
          <button onClick={handleSignOut} className="btn-secondary text-xs !py-1.5">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-ink-900/10 bg-parchment-50 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-sm2 px-3 py-2 text-sm ${
                pathname.startsWith(item.href)
                  ? "bg-ink-900 text-parchment-50 font-medium"
                  : "text-ink-700 hover:bg-ink-900/[0.06]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
