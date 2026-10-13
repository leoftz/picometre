// Content Security Policy (lot 10). Static, because Partial Prerendering is incompatible with nonces
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md): inline scripts stay allowed for
// Next.js' own payload, everything else is limited to this site and the Supabase project.

export function contentSecurityPolicy({ supabaseUrl, dev }: { supabaseUrl: string; dev: boolean }): string {
  const supabase = new URL(supabaseUrl).origin;
  const realtime = supabase.replace(/^http/, "ws");
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' only in development (React's debugging), never in production.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    // next/font serves the fonts from this site.
    "font-src": ["'self'"],
    // Supabase API and Realtime (group view).
    "connect-src": ["'self'", supabase, realtime],
    // The estimate runs in a Web Worker.
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // Signing in with Google posts to a server action that redirects to Supabase, then to Google.
    "form-action": ["'self'", supabase, "https://accounts.google.com"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
