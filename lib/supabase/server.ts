import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting as the
 * signed-in user (publishable key + session cookies, so RLS applies). Create one per request.
 * With Cache Components, call it only inside a <Suspense> boundary: it reads cookies().
 */
export async function createClient() {
  // Session checks compare token expiry with Date.now(): defer to request time, never prerender them.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes
          // the session on every request, so the write can be safely skipped here.
        }
      },
    },
  });
}
