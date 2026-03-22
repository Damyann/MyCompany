import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

const COOKIE = "auth_token";
const MAX_AGE = 60 * 60 * 24 * 7;

const json = (obj, status = 200) =>
  NextResponse.json(obj, { status, headers: { "Cache-Control": "no-store" } });

const clean = (v) => String(v ?? "").trim();
const isEmail = (s) => s.includes("@") && s.includes(".");

async function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));
}

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}));
    const password = clean(b.password);
    const ident = clean(b.username || b.nickname || b.email);

    if (!ident || !password) return json({ error: "Липсват данни за вход." }, 400);

    const whereOr = [
      { username: ident },
      { email: ident },
      { staff: { nickname: ident } },
      { staff: { email: ident } },
    ];
    // ако е email, няма нужда, но не пречи

    const account = await prisma.userAccount.findFirst({
      where: {
        isActive: true,
        OR: whereOr,
      },
      select: {
        id: true,
        role: true,
        username: true,
        email: true,
        passwordHash: true,
        staffId: true,
        staff: {
          select: { id: true, role: true, nickname: true, isActive: true },
        },
      },
    });

    if (!account) return json({ error: "Грешен потребител или парола." }, 401);
    if (account.staff && !account.staff.isActive) return json({ error: "Акаунтът е деактивиран." }, 403);

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) return json({ error: "Грешен потребител или парола." }, 401);

    const token = await signToken({
      sub: String(account.id),
      accountRole: account.role, 
      staffId: account.staffId ?? null,
      staffRole: account.staff?.role ?? null,
    });

    const res = json({
      ok: true,
      accountRole: account.role,
      staffRole: account.staff?.role ?? null,
      username: account.username ?? account.staff?.nickname ?? null,
    });

    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE,
    });

    return res;
  } catch (e) {
    console.error("LOGIN error:", e);
    return json({ error: "Сървърна грешка." }, 500);
  }
}
