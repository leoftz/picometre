import { type NextRequest, NextResponse } from "next/server";
import { getOnboardingStep, getSessionUser, onboardingPath } from "@/lib/auth/dal";
import { consumeInvite } from "@/lib/friends/consume-invite";
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE, isInviteToken } from "@/lib/friends/invite-cookie";

// A friend link. With a complete account it is accepted at once; otherwise it is remembered while the
// visitor signs in or signs up (the age gate comes first).
export async function GET(request: NextRequest, { params }: RouteContext<"/amis/lien/[token]">) {
  const { token } = await params;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  if (!isInviteToken(token)) return to("/amis?lien=invalide");

  const user = await getSessionUser();
  const step = user ? await getOnboardingStep() : null;
  if (step === "termine") return to(await consumeInvite(token));

  const response = to(step ? onboardingPath(step) : "/");
  response.cookies.set(INVITE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: INVITE_COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
