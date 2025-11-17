import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  const { id } = await params;
  const croupierId = Number(id);

  if (!croupierId || Number.isNaN(croupierId)) {
    return NextResponse.json(
      { error: "Невалидно ID." },
      { status: 400 }
    );
  }

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

  const data = {
    firstName,
    middleName,
    lastName,
    nickname,
    email,
    gender,
  };

  if (typeof promotionCount !== "undefined") {
    const n = Number(promotionCount);
    if (!Number.isNaN(n)) {
      data.promotions = Math.min(10, Math.max(0, n));
    }
  }

  if (startDate) {
    data.startDate = new Date(startDate);
  }

  if (password && password.trim()) {
    data.passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  try {
    const croupier = await prisma.croupier.update({
      where: { id: croupierId },
      data,
    });

    return NextResponse.json({ croupier });
  } catch (err) {
    console.error("Update croupier error:", err);
    return NextResponse.json(
      { error: "Грешка при запис." },
      { status: 500 }
    );
  }
}
