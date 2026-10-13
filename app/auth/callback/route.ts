import { type NextRequest, NextResponse } from "next/server";
import { getOnboardingStep, onboardingPath } from "@/lib/auth/dal";
import { consumeInvite } from "@/lib/friends/consume-invite";
import { INVITE_COOKIE, isInviteToken } from "@/lib/friends/invite-cookie";
import { createClient } from "@/lib/supabase/server";

// Lands here from the magic link e-mail or from Google (PKCE): exchanges the one-time code for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // A friend link opened before signing in: accept it now if the character exists, else after sign-up.
      const invite = request.cookies.get(INVITE_COOKIE)?.value;
      if (isInviteToken(invite)) {
        const step = await getOnboardingStep();
        if (step !== "termine") return NextResponse.redirect(`${origin}${onboardingPath(step)}`);
        const response = NextResponse.redirect(`${origin}${await consumeInvite(invite)}`);
        response.cookies.delete(INVITE_COOKIE);
        return response;
      }
      return NextResponse.redirect(`${origin}/bienvenue`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/erreur`);
}
