import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const croupiers = await prisma.croupier.findMany({
      orderBy: { id: "asc" }
    });
    return NextResponse.json({ croupiers });
  } catch (err) {
    console.error("Dealer load error:", err);
    return NextResponse.json(
      { error: "Грешка при зареждане." },
      { status: 500 }
    );
  }
}
