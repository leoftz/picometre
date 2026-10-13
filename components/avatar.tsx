import { AVATAR_STYLES, type AvatarId } from "@/lib/account/avatars";

/** Round character (charte §7: rounded shapes, simple face, palette colours). Decorative: the pseudo carries the meaning. */
export function Avatar({ id, size = 64 }: { id: AvatarId; size?: number }) {
  const { body, accent } = AVATAR_STYLES[id];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="34" r="26" fill={body} />
      <circle cx="24" cy="31" r="3.5" fill={accent} />
      <circle cx="40" cy="31" r="3.5" fill={accent} />
      <path d="M24 41 Q32 47 40 41" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Accessory id={id} color={accent} />
    </svg>
  );
}

function Accessory({ id, color }: { id: AvatarId; color: string }) {
  switch (id) {
    case "bulle":
      return <circle cx="50" cy="12" r="5" fill="none" stroke={color} strokeWidth="2.5" />;
    case "citron":
      return <path d="M30 8 Q38 2 44 8 Q38 12 30 8Z" fill={color} />;
    case "menthe":
      return <path d="M32 4 Q24 10 32 16 Q40 10 32 4Z" fill={color} />;
    case "corail":
      return <path d="M22 10 L32 4 L42 10" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case "nuit":
      return <path d="M18 14 Q32 0 46 14" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />;
    case "etoile":
      return <path d="M32 2 L35 9 L42 9 L36.5 13.5 L38.5 20 L32 16 L25.5 20 L27.5 13.5 L22 9 L29 9Z" fill={color} />;
    case "lune":
      return <path d="M44 4 A9 9 0 1 0 52 16 A7 7 0 1 1 44 4Z" fill={color} />;
    case "eclair":
      return <path d="M34 2 L26 13 L32 13 L28 22 L38 10 L32 10Z" fill={color} />;
  }
}
