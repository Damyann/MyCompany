import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json({ lastUpdate: settings?.lastUpdate || null });
  } catch (e) {
    return NextResponse.json({ lastUpdate: null });
  }
}
