import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const croupiers = await prisma.croupier.findMany({
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      nickname: true,
      gender: true,
      email: true,
      startDate: true,
      // promotionCount: true, // ❌ махаме го, такова поле няма
      // ако искаме после, можем да ползваме promotions или да добавим поле в schema.prisma
    },
  });

  return NextResponse.json({ croupiers });
}
