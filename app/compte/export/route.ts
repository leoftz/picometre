import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/dal";
import { buildExport } from "@/lib/account/export";

// GET /compte/export — downloads the signed-in user's data as JSON.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const data = await buildExport(user);
  const date = data.exported_at.slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="picometre-mes-donnees-${date}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
