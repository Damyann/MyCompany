import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const b = await req.json();
    const game = await prisma.game.create({
      data: { name: b.name, gender: b.gender === "" ? null : b.gender },
    });
    return NextResponse.json({ game });
  } catch (err) {
    return NextResponse.json({ error: "Error creating game" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const b = await req.json();
    const game = await prisma.game.update({
      where: { id: b.id },
      data: { name: b.name, gender: b.gender === "" ? null : b.gender },
    });
    return NextResponse.json({ game });
  } catch (err) {
    return NextResponse.json({ error: "Error updating game" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const b = await req.json();
    await prisma.game.delete({ where: { id: b.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error deleting game" }, { status: 500 });
  }
}
