import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      lastUpdate: settings?.lastUpdate ?? null
    });
  } catch (err) {
    console.error("Error in /api/Admin/Changes:", err);
    return NextResponse.json({ lastUpdate: null }, { status: 500 });
  }
}
