import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "../csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `))?.split(" ").slice(1) ?? [];

describe("contentSecurityPolicy", () => {
  const prod = contentSecurityPolicy({ supabaseUrl: "https://abc.supabase.co", dev: false });

  it("lets the app reach only its Supabase project (API and Realtime)", () => {
    expect(directive(prod, "connect-src")).toEqual(["'self'", "https://abc.supabase.co", "wss://abc.supabase.co"]);
  });

  it("never allows eval in production, nor being framed, nor plugins", () => {
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
    expect(directive(prod, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(prod, "object-src")).toEqual(["'none'"]);
    expect(prod).toContain("upgrade-insecure-requests");
  });

  it("allows the Google sign-in redirects", () => {
    expect(directive(prod, "form-action")).toEqual(["'self'", "https://abc.supabase.co", "https://accounts.google.com"]);
  });

  it("works with the local stack in development", () => {
    const dev = contentSecurityPolicy({ supabaseUrl: "http://127.0.0.1:54321", dev: true });
    expect(directive(dev, "connect-src")).toContain("ws://127.0.0.1:54321");
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });
});
