import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// This page decides where to redirect based on the caller's session, so it
// can never be meaningfully static. Being explicit here also guarantees
// Next.js never attempts to evaluate it during build-time prerendering.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
