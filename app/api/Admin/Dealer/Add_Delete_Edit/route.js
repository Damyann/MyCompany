"use server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma=new PrismaClient();

// ---------------- POST (ADD) ----------------
export async function POST(req){
try{
const b=await req.json();
if(!b.password?.trim())return NextResponse.json({error:"Паролата е задължителна."},{status:400});

const c=await prisma.croupier.create({
  data:{
    firstName:b.firstName,
    middleName:b.middleName,
    lastName:b.lastName,
    nickname:b.nickname,
    email:b.email,
    gender:b.gender,
    startDate:b.startDate?new Date(b.startDate):null,
    promotions:Math.min(10,Math.max(0,Number(b.promotionCount))),
    passwordHash:await bcrypt.hash(b.password.trim(),10),
    games:{
      connect:(b.gameIds||[]).map(id=>({id}))
    }
  },
  include:{games:true}
});

return NextResponse.json({croupier:c});
}catch{
return NextResponse.json({error:"Грешка при създаване."},{status:500});
}}

// ---------------- PUT (EDIT) ----------------
export async function PUT(req){
try{
const b=await req.json();
if(!b.id)return NextResponse.json({error:"Няма ID."},{status:400});

const data={
  firstName:b.firstName,
  middleName:b.middleName,
  lastName:b.lastName,
  nickname:b.nickname,
  email:b.email,
  gender:b.gender,
  promotions:b.promotionCount,
  startDate:b.startDate?new Date(b.startDate):null,
  games:{
    set:(b.gameIds||[]).map(id=>({id}))  // ❗ заменяме всички игри
  }
};

if(b.password?.trim())data.passwordHash=await bcrypt.hash(b.password.trim(),10);

const c=await prisma.croupier.update({
  where:{id:Number(b.id)},
  data,
  include:{games:true}
});

return NextResponse.json({croupier:c});
}catch{
return NextResponse.json({error:"Грешка при редакция."},{status:500});
}}

// ---------------- DELETE ----------------
export async function DELETE(req){
try{
const b=await req.json();
if(!b.id)return NextResponse.json({error:"Няма ID."},{status:400});

await prisma.croupier.delete({where:{id:Number(b.id)}});

return NextResponse.json({success:true});
}catch{
return NextResponse.json({error:"Грешка при изтриване."},{status:500});
}}
