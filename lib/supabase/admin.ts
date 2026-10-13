import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { supabaseSecretKey } from "@/lib/env.server";
import type { Database } from "./database.types";

/**
 * Admin client (secret key, bypasses RLS). Use only for actions RLS cannot express — today: deleting
 * an auth user. Always check the signed-in user first and act on that user's id only.
 * Returns null where the secret key is deliberately absent (Vercel Preview).
 */
export function createAdminClient() {
  const secret = supabaseSecretKey();
  if (!secret) return null;
  return createClient<Database>(publicEnv.supabaseUrl, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
