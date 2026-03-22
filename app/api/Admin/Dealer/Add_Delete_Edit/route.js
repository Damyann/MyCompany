import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic="force-dynamic";
const ROLE="DEALER";

const STAFF_SELECT={
  id:1,firstName:1,middleName:1,lastName:1,nickname:1,email:1,gender:1,startDate:1,promotions:1,
  games:{select:{game:{select:{id:1,name:1,gender:1}}}},
};

const toInt=x=>{const n=Number(x);return Number.isFinite(n)?Math.trunc(n):null;};
const reqStr=x=>{const s=String(x??"").trim();return s?s:null;};
const optStr=x=>{if(x===undefined)return undefined;const s=x===null?"":String(x).trim();return s?s:null;};
const normIds=a=>Array.isArray(a)?[...new Set(a.map(toInt).filter(n=>n!==null))]:[];
const isGender=g=>g==="MALE"||g==="FEMALE";

const mapErr=e=>{
  if(e?.code==="P2002") return {s:409,m:"Дублирани данни (nickname/email)."};
  if(e?.code==="P2003") return {s:409,m:"Не може: има свързани записи."};
  if(e?.code==="P2025") return {s:404,m:"Няма такова крупие."};
  return {s:500,m:"Сървърна грешка."};
};

const shape=s=>({
  id:s.id,firstName:s.firstName,middleName:s.middleName,lastName:s.lastName,nickname:s.nickname,email:s.email,
  gender:s.gender,startDate:s.startDate,promotionCount:s.promotions,games:(s.games||[]).map(g=>g.game),
});

export async function POST(req){
  try{
    const b=await req.json();

    const password=reqStr(b?.password);
    const nickname=reqStr(b?.nickname);
    const firstName=reqStr(b?.firstName);
    const lastName=reqStr(b?.lastName);
    if(!password) return NextResponse.json({error:"Паролата е задължителна."},{status:400});
    if(!nickname) return NextResponse.json({error:"Nickname е задължителен."},{status:400});
    if(!firstName||!lastName) return NextResponse.json({error:"Име и фамилия са задължителни."},{status:400});
    if(!isGender(b?.gender)) return NextResponse.json({error:"Полът е задължителен."},{status:400});

    const gameIds=normIds(b?.gameIds);
    const startDate=b?.startDate?new Date(b.startDate):new Date();
    const promotions=Number(b?.promotionCount)||0;
    const passwordHash=await bcrypt.hash(password,10);

    const created=await prisma.$transaction(async tx=>{
      const staff=await tx.staffMember.create({
        data:{
          role:ROLE,
          firstName,
          middleName:optStr(b?.middleName)??null,
          lastName,
          gender:b.gender,
          startDate,
          promotions,
          nickname,
          email:optStr(b?.email)??null,
          isActive:true,
        },
        select:{id:1,nickname:1,email:1},
      });

      if(gameIds.length){
        await tx.staffGame.createMany({
          data:gameIds.map(gameId=>({staffId:staff.id,gameId})),
          skipDuplicates:true,
        });
      }

      await tx.userAccount.create({
        data:{
          role:"STAFF",
          staffId:staff.id,
          username:staff.nickname,
          email:staff.email,
          passwordHash,
          isActive:true,
        },
      });

      const full=await tx.staffMember.findUnique({where:{id:staff.id},select:STAFF_SELECT});
      return shape(full);
    });

    return NextResponse.json({croupier:created},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const r=mapErr(e);
    return NextResponse.json({error:r.m},{status:r.s});
  }
}

export async function PUT(req){
  try{
    const b=await req.json();
    const id=toInt(b?.id);
    if(!id) return NextResponse.json({error:"Няма ID."},{status:400});

    const patch={};
    if(b?.firstName!==undefined){const v=reqStr(b.firstName);if(!v)return NextResponse.json({error:"Име е задължително."},{status:400});patch.firstName=v;}
    if(b?.lastName!==undefined){const v=reqStr(b.lastName);if(!v)return NextResponse.json({error:"Фамилия е задължителна."},{status:400});patch.lastName=v;}
    if(b?.middleName!==undefined) patch.middleName=optStr(b.middleName)??null;
    if(b?.email!==undefined) patch.email=optStr(b.email)??null;
    if(b?.nickname!==undefined){const v=reqStr(b.nickname);if(!v)return NextResponse.json({error:"Nickname е задължителен."},{status:400});patch.nickname=v;}
    if(b?.gender!==undefined){if(!isGender(b.gender))return NextResponse.json({error:"Невалиден пол."},{status:400});patch.gender=b.gender;}
    if(b?.startDate!==undefined) patch.startDate=b.startDate?new Date(b.startDate):new Date();
    if(b?.promotionCount!==undefined) patch.promotions=Number(b.promotionCount)||0;

    const gameIds=normIds(b?.gameIds);
    const password=reqStr(b?.password);

    const updated=await prisma.$transaction(async tx=>{
      const exists=await tx.staffMember.findFirst({where:{id,role:ROLE},select:{id:1}});
      if(!exists) throw Object.assign(new Error("NOT_FOUND"),{code:"P2025"});

      const staff=await tx.staffMember.update({where:{id},data:patch,select:{id:1,nickname:1,email:1}});

      if(Array.isArray(b?.gameIds)){
        await tx.staffGame.deleteMany({where:{staffId:id}});
        if(gameIds.length) await tx.staffGame.createMany({data:gameIds.map(gameId=>({staffId:id,gameId})),skipDuplicates:true});
      }

      if(password){
        const passwordHash=await bcrypt.hash(password,10);
        await tx.userAccount.upsert({
          where:{staffId:id},
          update:{role:"STAFF",username:staff.nickname,email:staff.email,passwordHash,isActive:true},
          create:{role:"STAFF",staffId:id,username:staff.nickname,email:staff.email,passwordHash,isActive:true},
        });
      }else{
        await tx.userAccount.updateMany({where:{staffId:id},data:{username:staff.nickname??undefined,email:staff.email??undefined}});
      }

      const full=await tx.staffMember.findUnique({where:{id},select:STAFF_SELECT});
      return shape(full);
    });

    return NextResponse.json({croupier:updated},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const r=mapErr(e);
    return NextResponse.json({error:r.m},{status:r.s});
  }
}

export async function DELETE(req){
  try{
    const body=await req.json().catch(()=>null);
    const {searchParams}=new URL(req.url);
    const id=toInt(body?.id ?? searchParams.get("id"));
    if(!id) return NextResponse.json({error:"Няма ID."},{status:400});

    await prisma.$transaction(async tx=>{
      const exists=await tx.staffMember.findFirst({where:{id,role:ROLE},select:{id:1}});
      if(!exists) throw Object.assign(new Error("NOT_FOUND"),{code:"P2025"});

      await tx.schedule.deleteMany({where:{staffId:id,role:ROLE}});
      await tx.staffGame.deleteMany({where:{staffId:id}});
      await tx.userAccount.deleteMany({where:{staffId:id}});
      await tx.staffMember.delete({where:{id}});
    });

    return NextResponse.json({ok:true,id},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const r=mapErr(e);
    return NextResponse.json({error:r.m},{status:r.s});
  }
}
