import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const prisma=new PrismaClient();

export async function GET(){
  try{
    const croupiers=await prisma.croupier.findMany({orderBy:{id:"asc"}});
    return NextResponse.json({croupiers});
  }catch(err){
    return NextResponse.json({error:"Грешка при зареждане."},{status:500});
  }
}
