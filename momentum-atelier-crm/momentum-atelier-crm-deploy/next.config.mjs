// ---------------------------------------------------------------------------
// TEMPORARY BUILD-TIME DIAGNOSTIC
// Prints only whether each Supabase env var is present — never the actual
// value. This runs unconditionally as soon as `next build` (or `next dev`)
// loads this config file, regardless of which routes get prerendered, so
// it gives a ground-truth answer for whether the build process itself can
// see these variables. Safe to delete once the deployment is confirmed
// working.
console.log("[momentum-atelier-crm] Supabase env check (build time):", {
  NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
});
// ---------------------------------------------------------------------------

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
