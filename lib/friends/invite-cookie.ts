// A friend link opened before signing up is kept in a short-lived cookie, then consumed as soon as the
// account has a character: when the link is opened, after sign-in, or right after character creation.
export const INVITE_COOKIE = "pico_invite";
export const INVITE_COOKIE_MAX_AGE = 7 * 24 * 3600;

/** Tokens are 36 lowercase hex characters (friend_invites.token default). */
export function isInviteToken(value: string | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{36}$/.test(value);
}
