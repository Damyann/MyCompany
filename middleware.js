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

  // Ако няма токен – redirect към логина
  if (!token) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  // Ако токенът е невалиден или изтекъл
  if (!payload || !payload.role) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = payload.role;

  // Ако пътят започва с /admin, и ролята НЕ е admin → redirect към логина
  if (pathname.startsWith("/admin") && role !== "admin") {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Ако пътят започва с /croupier, и ролята НЕ е croupier → redirect към логина
  if (pathname.startsWith("/croupier") && role !== "croupier") {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Всичко е ок – пускаме заявката
  return NextResponse.next();
}

// казваме на Next.js на кои пътища да се прилага middleware
export const config = {
  matcher: ["/admin/:path*", "/croupier/:path*"],
};
