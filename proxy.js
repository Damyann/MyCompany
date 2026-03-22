import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyToken(token){
  try{
    const secret=process.env.JWT_SECRET;
    if(!secret) throw new Error("Missing JWT_SECRET");
    const {payload}=await jwtVerify(token,new TextEncoder().encode(secret));
    return payload;
  }catch{return null;}
}

const unauthorized=(req,msg="Unauthorized")=>{
  const p=req.nextUrl.pathname.toLowerCase();
  if(p.startsWith("/api/")) return NextResponse.json({error:msg},{status:401});
  return NextResponse.redirect(new URL("/",req.url));
};
const forbidden=(req,msg="Forbidden")=>{
  const p=req.nextUrl.pathname.toLowerCase();
  if(p.startsWith("/api/")) return NextResponse.json({error:msg},{status:403});
  return NextResponse.redirect(new URL("/",req.url));
};

export async function proxy(request){
  const p=request.nextUrl.pathname.toLowerCase();

  if(p.startsWith("/api/login")||p.startsWith("/api/logout")) return NextResponse.next();

  const token=request.cookies.get("auth_token")?.value||null;
  if(!token) return unauthorized(request);

  const payload=await verifyToken(token);
  const rawRole=String(payload?.accountRole ?? payload?.role ?? "");
  if(!rawRole) return unauthorized(request);

  const AR=rawRole.toUpperCase();
  const isAdminAcc = AR==="ADMIN" || AR==="MAIN_PITBOSS" || rawRole==="admin";
  const isStaffAcc = AR==="STAFF" || rawRole==="croupier";

  const isAdminPath = p.startsWith("/admin") || p.startsWith("/api/admin");
  const isCroupierPath = p.startsWith("/croupier") || p.startsWith("/api/croupier");

  if(isAdminPath && !isAdminAcc) return forbidden(request);
  if(isCroupierPath && !(isStaffAcc || isAdminAcc)) return forbidden(request);

  return NextResponse.next();
}

export const config={ matcher:["/admin/:path*","/croupier/:path*","/api/:path*"] };
