import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const croupiers = await prisma.croupier.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ croupiers });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Грешка при зареждане." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstName,
      middleName,
      lastName,
      nickname,
      email,
      gender,
      startDate,
      promotionCount,
      password,
    } = body;

    if (!password?.trim()) {
      return NextResponse.json(
        { error: "Паролата е задължителна." },
        { status: 400 }
      );
    }

    const croupier = await prisma.croupier.create({
      data: {
        firstName,
        middleName,
        lastName,
        nickname,
        email,
        gender,
        startDate: startDate ? new Date(startDate) : null,
        promotions: Math.min(10, Math.max(0, Number(promotionCount))),
        passwordHash: await bcrypt.hash(password.trim(), 10),
      },
    });

    return NextResponse.json({ croupier });
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: "Грешка при създаване." },
      { status: 500 }
    );
  }
}
