"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma=new PrismaClient();

// ------------------------
//        ADD (POST)
// ------------------------
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

    return NextResponse.json({croupier});
  }catch(err){
    return NextResponse.json({error:"Грешка при създаване."},{status:500});
  }
}

// ------------------------
//        EDIT (PUT)
// ------------------------
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

    return NextResponse.json({croupier});
  }catch(err){
    return NextResponse.json({error:"Грешка при редакция."},{status:500});
  }
}

// ------------------------
//      DELETE (DELETE)
// ------------------------
export async function DELETE(request){
  try{
    const body=await request.json();
    const{id}=body;

    if(!id)return NextResponse.json({error:"Няма ID."},{status:400});

    await prisma.croupier.delete({where:{id:Number(id)}});

    return NextResponse.json({success:true});
  }catch(err){
    return NextResponse.json({error:"Грешка при изтриване."},{status:500});
  }
}
