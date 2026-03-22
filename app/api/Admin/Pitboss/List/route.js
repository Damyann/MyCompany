import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
const ROLE = "PITBOSS";

const SELECT = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  nickname: true,
  email: true,
  gender: true,
  startDate: true,
  promotions: true,
  createdAt: true,
  updatedAt: true,
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
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

export async function GET() {
  try {
    const staff = await prisma.staffMember.findMany({
      where: { role: ROLE },
      orderBy: [{ nickname: "asc" }, { id: "asc" }],
      select: SELECT,
    });

    // UI очаква "pitbosses"
    return NextResponse.json(
      { pitbosses: staff.map(shape) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("Pitboss LIST error:", e);
    return NextResponse.json({ error: "Сървърна грешка." }, { status: 500 });
  }
}
