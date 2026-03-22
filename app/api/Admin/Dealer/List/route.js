import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
const ROLE = "DEALER";

const STAFF_SELECT = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  nickname: true,
  email: true,
  gender: true,
  startDate: true,
  promotions: true,
  games: { select: { game: { select: { id: true, name: true, gender: true } } } },
};

const shape = (s) => ({
  id: s.id,
  firstName: s.firstName,
  middleName: s.middleName,
  lastName: s.lastName,
  nickname: s.nickname,
  email: s.email,
  gender: s.gender,
  startDate: s.startDate,
  promotionCount: s.promotions,
  games: (s.games || []).map((g) => g.game),
});

export async function GET() {
  try {
    const staff = await prisma.staffMember.findMany({
      where: { role: ROLE },
      orderBy: [{ nickname: "asc" }, { id: "asc" }],
      select: STAFF_SELECT,
    });

    // UI очаква "croupiers"
    return NextResponse.json(
      { croupiers: staff.map(shape) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("Dealer LIST error:", e);
    return NextResponse.json({ error: "Сървърна грешка." }, { status: 500 });
  }
}
