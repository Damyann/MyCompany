import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { updateTimestamp } from "@/lib/UpdateTimestamp";

const prisma=new PrismaClient();

export async function POST(request){
  try{
    const body=await request.json();
    const{firstName,middleName,lastName,nickname,email,gender,startDate,promotionCount,password}=body;

    if(!password?.trim())return NextResponse.json({error:"Паролата е задължителна."},{status:400});

    const croupier=await prisma.croupier.create({
      data:{
        firstName,
        middleName,
        lastName,
        nickname,
        email,
        gender,
        startDate:startDate?new Date(startDate):null,
        promotions:Math.min(10,Math.max(0,Number(promotionCount))),
        passwordHash:await bcrypt.hash(password.trim(),10)
      }
    });

    await updateTimestamp(); // ★ добавено

    return NextResponse.json({croupier});
  }catch(err){
    return NextResponse.json({error:"Грешка при създаване."},{status:500});
  }
}
