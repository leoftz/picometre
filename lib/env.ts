// Public environment (safe in the browser). NEXT_PUBLIC_* values are inlined at build time,
// so each one must be read with a literal `process.env.NAME` expression.
// The secret key is deliberately NOT here: it is read only in server-only modules (L3).

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name} — see .env.example`);
  return value;
}

export const publicEnv = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};
