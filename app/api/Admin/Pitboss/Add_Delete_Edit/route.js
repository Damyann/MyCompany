import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic="force-dynamic";
const ROLE="PITBOSS";

const PITBOSS_SELECT={id:1,firstName:1,middleName:1,lastName:1,nickname:1,email:1,gender:1,startDate:1,promotions:1,createdAt:1,updatedAt:1};

const toInt=x=>{const n=Number(x);return Number.isFinite(n)?Math.trunc(n):null};
const trim=x=>String(x??"").trim();
const opt=x=>{const s=trim(x);return s?s:null};
const isGender=g=>g==="MALE"||g==="FEMALE";

const mapErr=e=>{
  if(e?.code==="P2002"){
    const t=e?.meta?.target;
    if(Array.isArray(t)&&t.includes("email"))return{status:409,msg:"Вече има pitboss с този имейл."};
    if(Array.isArray(t)&&t.includes("nickname"))return{status:409,msg:"Вече има pitboss с този псевдоним."};
    if(Array.isArray(t)&&t.includes("username"))return{status:409,msg:"Вече има акаунт с това потребителско име."};
    return{status:409,msg:"Дублирани данни."};
  }
  if(e?.code==="P2003")return{status:409,msg:"Не може: има свързани записи."};
  if(e?.code==="P2025")return{status:404,msg:"Няма такъв pitboss."};
  return{status:500,msg:"Сървърна грешка."};
};

const assertPitboss=async(tx,id)=>{
  const ex=await tx.staffMember.findFirst({where:{id,role:ROLE},select:{id:1}});
  if(!ex) throw Object.assign(new Error("NOT_FOUND"),{code:"P2025"});
};

export async function POST(req){
  try{
    const b=await req.json();

    const password=trim(b?.password);
    const email=trim(b?.email);
    const firstName=trim(b?.firstName);
    const lastName=trim(b?.lastName);
    const nickname=opt(b?.nickname);
    const middleName=opt(b?.middleName);
    const gender=b?.gender;

    if(!password)return NextResponse.json({error:"Паролата е задължителна."},{status:400});
    if(!email)return NextResponse.json({error:"Имейлът е задължителен."},{status:400});
    if(!firstName||!lastName)return NextResponse.json({error:"Име и фамилия са задължителни."},{status:400});
    if(!isGender(gender))return NextResponse.json({error:"Полът е задължителен."},{status:400});

    const startDate=b?.startDate?new Date(b.startDate):new Date();
    const promotions=Number(b?.promotionCount)||0;
    const passwordHash=await bcrypt.hash(password,10);
    const username=nickname||email;

    const created=await prisma.$transaction(async tx=>{
      const staff=await tx.staffMember.create({
        data:{role:ROLE,firstName,middleName,lastName,gender,startDate,promotions,nickname,email,isActive:true},
        select:{id:1,nickname:1,email:1},
      });

      await tx.userAccount.create({
        data:{role:"STAFF",staffId:staff.id,username,email:staff.email,passwordHash,isActive:true},
      });

      return tx.staffMember.findUnique({where:{id:staff.id},select:PITBOSS_SELECT});
    });

    return NextResponse.json({pitboss:created},{headers:{"Cache-Control":"no-store"}});
  }catch(err){
    console.error("Pitboss ADD error:",err);
    const e=mapErr(err);return NextResponse.json({error:e.msg},{status:e.status});
  }
}

export async function PUT(req){
  try{
    const b=await req.json(),id=toInt(b?.id);
    if(!id)return NextResponse.json({error:"Няма ID."},{status:400});

    const email=trim(b?.email);
    const firstName=trim(b?.firstName);
    const lastName=trim(b?.lastName);
    const nickname=opt(b?.nickname);
    const middleName=opt(b?.middleName);
    const gender=b?.gender;

    if(!email)return NextResponse.json({error:"Имейлът е задължителен."},{status:400});
    if(!firstName||!lastName)return NextResponse.json({error:"Име и фамилия са задължителни."},{status:400});
    if(!isGender(gender))return NextResponse.json({error:"Полът е задължителен."},{status:400});

    const data={
      role:ROLE,firstName,middleName,lastName,nickname,email,gender,
      promotions:Number(b?.promotionCount)||0,
      startDate:b?.startDate?new Date(b.startDate):new Date(),
    };

    const password=trim(b?.password);
    const username=nickname||email;

    const updated=await prisma.$transaction(async tx=>{
      await assertPitboss(tx,id);

      const staff=await tx.staffMember.update({
        where:{id},
        data,
        select:{id:1,nickname:1,email:1},
      });

      const acctData={role:"STAFF",username,email:staff.email,isActive:true};
      if(password) acctData.passwordHash=await bcrypt.hash(password,10);

      await tx.userAccount.upsert({
        where:{staffId:id},
        update:acctData,
        create:{...acctData,staffId:id,passwordHash:acctData.passwordHash ?? await bcrypt.hash("123",10)},
      });

      return tx.staffMember.findUnique({where:{id},select:PITBOSS_SELECT});
    });

    return NextResponse.json({pitboss:updated},{headers:{"Cache-Control":"no-store"}});
  }catch(err){
    console.error("Pitboss EDIT error:",err);
    const e=mapErr(err);return NextResponse.json({error:e.msg},{status:e.status});
  }
}

export async function DELETE(req){
  try{
    const body=await req.json().catch(()=>null);
    const {searchParams}=new URL(req.url);
    const id=toInt(body?.id ?? searchParams.get("id"));
    if(!id)return NextResponse.json({error:"Няма ID."},{status:400});

    await prisma.$transaction(async tx=>{
      await assertPitboss(tx,id);
      await tx.schedule.deleteMany({where:{staffId:id,role:ROLE}});
      await tx.staffGame.deleteMany({where:{staffId:id}});
      await tx.userAccount.deleteMany({where:{staffId:id}});
      await tx.staffMember.delete({where:{id}});
    });

    return NextResponse.json({ok:true,id},{headers:{"Cache-Control":"no-store"}});
  }catch(err){
    console.error("Pitboss DELETE error:",err);
    const e=mapErr(err);return NextResponse.json({error:e.msg},{status:e.status});
  }
}
