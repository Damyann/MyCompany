import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET");

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload;
  } catch (err) {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value || null;

  if (pathname.startsWith("/api/login") || pathname.startsWith("/api/logout"))
    return NextResponse.next();

  if (!token) return NextResponse.redirect(new URL("/", request.url));

  const payload = await verifyToken(token);
  if (!payload?.role)
    return NextResponse.redirect(new URL("/", request.url));

  const role = payload.role;

  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isCroupierPath =
    pathname.startsWith("/croupier") || pathname.startsWith("/api/croupier");

  if (isAdminPath && role !== "admin")
    return NextResponse.redirect(new URL("/", request.url));

  if (isCroupierPath && role !== "croupier")
    return NextResponse.redirect(new URL("/", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/croupier/:path*", "/api/:path*"],
};
