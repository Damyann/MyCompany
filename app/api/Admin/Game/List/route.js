// app/api/Admin/Game/List/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await prisma.game.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, abbr: true, gender: true },
    });
    const games = raw.map((g) => ({ ...g, abbr: String(g.abbr || "").trim(), gender: g.gender ?? "ALL" }));
    return NextResponse.json({ games }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Game LIST error:", e);
    return NextResponse.json({ error: "Сървърна грешка." }, { status: 500 });
  }
}