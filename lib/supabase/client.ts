import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Supabase client for Client Components. Uses the publishable key: data access is governed by RLS. */
export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
}
