import "server-only";

/**
 * Supabase secret key (formerly service_role): bypasses RLS. Server only, never NEXT_PUBLIC_.
 * Only set in Vercel Production and in the local .env.local (local stack key). Absent from Preview on purpose.
 */
export function supabaseSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY || null;
}
