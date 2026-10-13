// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({ sendMagicLink: vi.fn(), signInWithGoogle: vi.fn() }));
const { LoginForm } = await import("../login-form");

describe("LoginForm — PLAN Q-9", () => {
  afterEach(cleanup);

  it("offers Google only while the magic link is off (production without SMTP)", () => {
    render(<LoginForm magicLink={false} />);
    expect(screen.getByRole("button", { name: "Continuer avec Google" })).toBeTruthy();
    expect(screen.queryByLabelText("Ton adresse e-mail")).toBeNull();
  });

  it("offers both once the magic link is on", () => {
    render(<LoginForm magicLink />);
    expect(screen.getByLabelText("Ton adresse e-mail")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuer avec Google" })).toBeTruthy();
  });
});
