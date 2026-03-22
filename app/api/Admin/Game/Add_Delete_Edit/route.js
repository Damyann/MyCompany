// app/api/Admin/Game/Add_Delete_Edit/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const toInt = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
const trim = (x) => String(x ?? "").trim();
const normAbbr = (x) => trim(x).toUpperCase();
const isGameGender = (g) => g === "ALL" || g === "MALE" || g === "FEMALE";

const mapErr = (e) => {
  if (e?.code === "P2002") return { s: 409, m: "Вече има игра с това име." };
  if (e?.code === "P2025") return { s: 404, m: "Няма такава игра." };
  if (e?.code === "P2003") return { s: 409, m: "Не може: има свързани записи." };
  return { s: 500, m: "Сървърна грешка." };
};

const readGender = (rawGender) => {
  const gender = rawGender === undefined || rawGender === null || trim(rawGender) === "" ? "ALL" : String(rawGender).trim().toUpperCase();
  if (!isGameGender(gender)) throw new Error("Полът е невалиден (ALL/MALE/FEMALE).");
  return gender;
};
const readAbbr = (rawAbbr) => {
  const abbr = normAbbr(rawAbbr);
  if (!abbr) throw new Error("Абревиатурата е задължителна.");
  if (abbr.length > 12) throw new Error("Абревиатурата е твърде дълга.");
  return abbr;
};

export async function POST(req) {
  try {
    const b = await req.json();
    const name = trim(b?.name);
    if (!name) return NextResponse.json({ error: "Името е задължително." }, { status: 400 });
    const abbr = readAbbr(b?.abbr);
    const gender = readGender(b?.gender);
    const game = await prisma.game.create({ data: { name, abbr, gender } });
    return NextResponse.json({ game }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Error && (e.message === "Абревиатурата е задължителна." || e.message === "Абревиатурата е твърде дълга." || e.message === "Полът е невалиден (ALL/MALE/FEMALE).")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const r = mapErr(e);
    return NextResponse.json({ error: r.m }, { status: r.s });
  }
}

export async function PUT(req) {
  try {
    const b = await req.json();
    const id = toInt(b?.id);
    if (!id) return NextResponse.json({ error: "Няма ID." }, { status: 400 });
    const data = {};
    if (b?.name !== undefined) {
      const name = trim(b.name);
      if (!name) return NextResponse.json({ error: "Името е задължително." }, { status: 400 });
      data.name = name;
    }
    if (b?.abbr !== undefined) data.abbr = readAbbr(b.abbr);
    if (b?.gender !== undefined) data.gender = readGender(b.gender);
    const game = await prisma.game.update({ where: { id }, data });
    return NextResponse.json({ game }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Error && (e.message === "Абревиатурата е задължителна." || e.message === "Абревиатурата е твърде дълга." || e.message === "Полът е невалиден (ALL/MALE/FEMALE).")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const r = mapErr(e);
    return NextResponse.json({ error: r.m }, { status: r.s });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json().catch(() => null);
    const { searchParams } = new URL(req.url);
    const id = toInt(body?.id ?? searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Няма ID." }, { status: 400 });
    await prisma.game.delete({ where: { id } });
    return NextResponse.json({ ok: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const r = mapErr(e);
    return NextResponse.json({ error: r.m }, { status: r.s });
  }
}