import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Missing JWT_SECRET");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload; // { userId, role, ... }
  } catch (err) {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value || null;

  // 1) Оставяме login/logout API-тата отворени
  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout")
  ) {
    return NextResponse.next();
  }

  // 2) За всички други защитени пътища ИЗИСКВАМЕ токен
  if (!token) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  if (!payload || !payload.role) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = payload.role;

  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isCroupierPath =
    pathname.startsWith("/croupier") || pathname.startsWith("/api/croupier");

  // 3) Admin страници + admin API-та -> само с role = admin
  if (isAdminPath && role !== "admin") {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4) Croupier страници + croupier API-та -> само с role = croupier
  if (isCroupierPath && role !== "croupier") {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5) Всичко е ок – пускаме заявката
  return NextResponse.next();
}

// Казваме на Next.js кои пътища са защитени от middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/croupier/:path*",
    "/api/:path*", // всички API-та минават оттук
  ],
};
