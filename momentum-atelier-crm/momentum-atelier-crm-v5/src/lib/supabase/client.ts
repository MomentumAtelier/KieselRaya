import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // These must stay as literal `process.env.NEXT_PUBLIC_...` expressions
  // (not a variable name, not bracket access) so Next.js can statically
  // replace them with real string values in the browser bundle at build
  // time. A helper function that reads `process.env[name]` dynamically
  // would NOT be inlined and would always be `undefined` in the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase browser client is missing configuration. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your deployment " +
        "environment, then trigger a fresh build with the build cache cleared so the values are " +
        "re-inlined into the client bundle."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
