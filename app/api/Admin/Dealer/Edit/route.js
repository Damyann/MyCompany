import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { updateTimestamp } from "@/lib/UpdateTimestamp";

const prisma=new PrismaClient();

export async function PUT(request){
  try{
    const body=await request.json();
    const{id,firstName,middleName,lastName,nickname,email,gender,startDate,promotionCount,password}=body;

    if(!id)return NextResponse.json({error:"Няма ID."},{status:400});

    const data={firstName,middleName,lastName,nickname,email,gender};
    if(startDate)data.startDate=new Date(startDate);
    if(typeof promotionCount!=="undefined")data.promotions=Math.min(10,Math.max(0,Number(promotionCount)));
    if(password?.trim())data.passwordHash=await bcrypt.hash(password.trim(),10);

    const croupier=await prisma.croupier.update({where:{id:Number(id)},data});

    await updateTimestamp(); // ★ важното

    return NextResponse.json({croupier});
  }catch(err){
    return NextResponse.json({error:"Грешка при редакция."},{status:500});
  }
}
