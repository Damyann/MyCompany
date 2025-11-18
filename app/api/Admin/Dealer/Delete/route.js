import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma=new PrismaClient();

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
