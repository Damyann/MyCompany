import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const games = await prisma.game.findMany();
    return NextResponse.json({ games });
  } catch (err) {
    return NextResponse.json({ error: "Error loading games" }, { status: 500 });
  }
}
