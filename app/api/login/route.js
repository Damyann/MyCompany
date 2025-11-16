import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signAuthToken } from "../../../lib/auth";

const prisma = new PrismaClient();

export async function POST(request) {
  const { nickname, password } = await request.json();

  if (!nickname || !password) {
    return NextResponse.json(
      { error: "Моля, попълни псевдоним и парола." },
      { status: 400 }
    );
  }

  try {
    // 1) Първо търсим дали е админ (логин с name)
    const admin = await prisma.admin.findFirst({
      where: { name: nickname },
    });

    if (admin) {
      const ok = await bcrypt.compare(password, admin.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Грешна парола за администратор." },
          { status: 401 }
        );
      }

      // Създаваме JWT токен за админ
      const token = await signAuthToken({
        userId: admin.id,
        role: "admin",
        name: admin.name,
      });

      const res = NextResponse.json({
        role: "admin",
        name: admin.name,
      });

      res.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 часа
      });

      return res;
    }

    // 2) Ако не е админ, търсим като крупие (nickname)
    const croupier = await prisma.croupier.findFirst({
      where: { nickname },
    });

    if (croupier) {
      const ok = await bcrypt.compare(password, croupier.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Грешна парола за крупие." },
          { status: 401 }
        );
      }

      // Създаваме JWT токен за крупие
      const token = await signAuthToken({
        userId: croupier.id,
        role: "croupier",
        nickname: croupier.nickname,
      });

      const res = NextResponse.json({
        role: "croupier",
        nickname: croupier.nickname,
      });

      res.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return res;
    }

    // Няма такъв човек
    return NextResponse.json(
      { error: "Няма потребител с такъв псевдоним." },
      { status: 404 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Сървърна грешка при логин." },
      { status: 500 }
    );
  }
}
