import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic="force-dynamic";

import {
  roleOf,toInt,normTotalCfg,normDpCfg,
  syncShiftBillCodes,getMonth,getStaff,
  computeStaffStats
} from "../Math/Calculations";

import {
  getTotalCfg,
  getDpCfg,
  getBillTokToKey,
  invalidateDayCard,
  invalidateBills,
  invalidateTotal,
  invalidateDp,
} from "../cache";

const noStore=(p,s=200)=>{const r=NextResponse.json(p,{status:s});r.headers.set("Cache-Control","no-store");return r;};

export async function POST(req){
  try{
    const b=await req.json();
    const role=roleOf(b?.role);
    let action=b?.action;
    if(action==="create") action="createSchedule";
    if(action==="addCroupier") action="addStaff";

    if(action==="totalCfgSet"){
      const cfg=normTotalCfg(b?.totalCfg);
      const s=await prisma.calendarTotal.upsert({where:{role},update:{totalCfg:cfg},create:{role,totalCfg:cfg},select:{totalCfg:1}});
      invalidateTotal(role);
      return noStore({settings:{totalCfg:normTotalCfg(s?.totalCfg)}});
    }

    if(action==="dpCfgSet"){
      const month=toInt(b.month),year=toInt(b.year);
      if(!month||!year) return noStore({error:"Missing month/year"},400);
      const cfg=normDpCfg(b?.dpCfg);
      const s=await prisma.calendarDP.upsert({where:{role_year_month:{role,year,month}},update:{dpCfg:cfg},create:{role,year,month,dpCfg:cfg},select:{dpCfg:1}});
      invalidateDp(role,year,month);
      return noStore({dpCfg:normDpCfg(s?.dpCfg)});
    }

    if(action==="createSchedule"){
      const month=toInt(b.month),year=toInt(b.year);
      if(!month||!year) return noStore({error:"Missing month/year"},400);
      const m=await prisma.scheduleMonth.upsert({
        where:{role_year_month:{role,year,month}},
        update:{},
        create:{role,year,month,isLocked:false},
        select:{id:1,role:1,year:1,month:1,isLocked:1}
      });
      return noStore({month:m},201);
    }

    if(action==="addStaff"){
      const monthId=toInt(b.monthId),staffId=toInt(b.staffId??b.croupierId);
      if(!monthId||!staffId) return noStore({error:"Missing monthId/staffId"},400);

      const m=await getMonth(monthId);
      if(!m) return noStore({error:"Month not found"},404);

      const staff=await getStaff(staffId);
      if(!staff) return noStore({error:"Staff not found"},404);
      if(String(staff.role)!==String(m.role)) return noStore({error:"Staff role mismatch"},400);

      const days=new Date(m.year,m.month,0).getDate();
      const rows=Array.from({length:days},(_,i)=>({
        monthId:m.id,role:m.role,staffId:staff.id,day:i+1,
        shiftCodeId:null,shiftRole:null,billCodeId:null,billRole:null,note:null
      }));
      await prisma.schedule.createMany({data:rows,skipDuplicates:true});
      return noStore({ok:true});
    }

    if(action==="updateCell"){
      const monthId=toInt(b.monthId),staffId=toInt(b.staffId),day=toInt(b.day);
      const shiftCodeId=toInt(b.shiftCodeId),billCodeId=toInt(b.billCodeId);
      const note=(b.note??"").toString().trim()||null;
      if(!monthId||!staffId||!day) return noStore({error:"Missing"},400);

      const m=await getMonth(monthId);
      if(!m) return noStore({error:"Month not found"},404);
      if(m.isLocked) return noStore({error:"Locked"},403);

      const staff=await getStaff(staffId);
      if(!staff) return noStore({error:"Staff not found"},404);
      if(String(staff.role)!==String(m.role)) return noStore({error:"Staff role mismatch"},400);

      const dim=new Date(m.year,m.month,0).getDate();
      if(day<1||day>dim) return noStore({error:"Invalid day"},400);

      await prisma.schedule.upsert({
        where:{monthId_staffId_day:{monthId:m.id,staffId:staff.id,day}},
        update:{shiftCodeId:shiftCodeId||null,shiftRole:shiftCodeId?m.role:null,billCodeId:billCodeId||null,billRole:billCodeId?m.role:null,note},
        create:{monthId:m.id,role:m.role,staffId:staff.id,day,shiftCodeId:shiftCodeId||null,shiftRole:shiftCodeId?m.role:null,billCodeId:billCodeId||null,billRole:billCodeId?m.role:null,note},
      });

      const [entries,totalCfg,dpCfg,billTokToKey]=await Promise.all([
        prisma.schedule.findMany({
          where:{monthId:m.id,staffId:staff.id},
          select:{day:1,staffId:1,shiftCode:{select:{code:1,hours:1}},billCode:{select:{code:1,multiplier:1}}}
        }),
        getTotalCfg(m.role),
        getDpCfg(m.role,m.year,m.month),
        getBillTokToKey(m.role),
      ]);

      const stats=computeStaffStats(staff.id,entries,m.year,m.month,billTokToKey,totalCfg,dpCfg);

      return noStore({ok:true,stats});
    }

    if(action==="dcSectionReorder"){
      const ids=Array.isArray(b.ids)?b.ids.map(toInt).filter(Boolean):[];
      if(ids.length<2) return noStore({ok:true});
      await prisma.$transaction(ids.map((id,i)=>prisma.shiftSection.update({where:{id},data:{sortOrder:i*10}})));
      invalidateDayCard(role);
      return noStore({ok:true});
    }

    if(action==="dcSectionCreate"){
      const name=(b.name??"").toString().trim();
      if(!name) return noStore({error:"Missing name"},400);
      const last=await prisma.shiftSection.findFirst({where:{role},orderBy:{sortOrder:"desc"},select:{sortOrder:1}});
      const sortOrder=(toInt(last?.sortOrder)??0)+10;
      const section=await prisma.shiftSection.create({
        data:{role,name,sortOrder,isActive:true},
        select:{id:1,role:1,name:1,sortOrder:1,isActive:1,codes:{select:{id:1,code:1,hours:1,sortOrder:1,isActive:1}}}
      });
      invalidateDayCard(role);
      return noStore({section},201);
    }

    if(action==="dcSectionUpdate"){
      const sectionId=toInt(b.sectionId),name=(b.name??"").toString().trim();
      if(!sectionId||!name) return noStore({error:"Missing"},400);
      const section=await prisma.shiftSection.update({
        where:{id:sectionId},
        data:{name},
        select:{id:1,role:1,name:1,sortOrder:1,isActive:1,codes:{select:{id:1,code:1,hours:1,sortOrder:1,isActive:1}}}
      });
      invalidateDayCard(role);
      return noStore({section});
    }

    if(action==="dcSectionDelete"){
      const sectionId=toInt(b.sectionId);
      if(!sectionId) return noStore({error:"Missing"},400);
      await prisma.shiftSection.delete({where:{id:sectionId}});
      await syncShiftBillCodes(role);
      invalidateDayCard(role);
      invalidateBills(role);
      return noStore({ok:true});
    }

    if(action==="dcCodeAdd"){
      const sectionId=toInt(b.sectionId),code=(b.code??"").toString().trim();
      const hours=toInt(b.hours)??8;
      if(!sectionId||!code) return noStore({error:"Missing"},400);
      const last=await prisma.shiftCode.findFirst({where:{sectionId},orderBy:{sortOrder:"desc"},select:{sortOrder:1}});
      const sortOrder=(toInt(last?.sortOrder)??0)+10;
      const c=await prisma.shiftCode.create({
        data:{role,sectionId,code,hours,sortOrder,isActive:true},
        select:{id:1,role:1,code:1,hours:1,sortOrder:1,isActive:1}
      });
      await syncShiftBillCodes(role);
      invalidateDayCard(role);
      invalidateBills(role);
      return noStore({code:c},201);
    }

    if(action==="dcCodeUpdate"){
      const codeId=toInt(b.codeId),code=(b.code??"").toString().trim();
      const hours=toInt(b.hours)??8;
      if(!codeId||!code) return noStore({error:"Missing"},400);
      const c=await prisma.shiftCode.update({
        where:{id:codeId},
        data:{code,hours},
        select:{id:1,role:1,code:1,hours:1,sortOrder:1,isActive:1}
      });
      await syncShiftBillCodes(role);
      invalidateDayCard(role);
      invalidateBills(role);
      return noStore({code:c});
    }

    if(action==="dcCodeDelete"){
      const codeId=toInt(b.codeId);
      if(!codeId) return noStore({error:"Missing"},400);
      await prisma.shiftCode.delete({where:{id:codeId}});
      await syncShiftBillCodes(role);
      invalidateDayCard(role);
      invalidateBills(role);
      return noStore({ok:true});
    }

    if(action==="billCodeAdd"){
      const billId=toInt(b.billId),code=(b.code??"").toString().trim();
      if(!billId||!code) return noStore({error:"Missing"},400);
      const bill=await prisma.bill.findFirst({where:{id:billId},select:{id:1,role:1}});
      if(!bill) return noStore({error:"Bill not found"},404);
      if(String(bill.role)!==String(role)) return noStore({error:"Bill role mismatch"},400);
      const last=await prisma.billCode.findFirst({where:{billId},orderBy:{sortOrder:"desc"},select:{sortOrder:1}});
      const sortOrder=(toInt(last?.sortOrder)??0)+10;
      const c=await prisma.billCode.create({
        data:{role,billId,code,multiplier:1,sortOrder,isActive:true},
        select:{id:1,role:1,code:1,multiplier:1,sortOrder:1,isActive:1}
      });
      invalidateBills(role);
      return noStore({code:c},201);
    }

    if(action==="billCodeUpdate"){
      const codeId=toInt(b.codeId),code=(b.code??"").toString().trim();
      const multRaw=Number(b.multiplier),multiplier=multRaw===1.5?1.5:1;
      if(!codeId||!code) return noStore({error:"Missing"},400);

      const cur=await prisma.billCode.findFirst({where:{id:codeId},select:{role:1}});
      if(!cur) return noStore({error:"Code not found"},404);
      if(String(cur.role)!==String(role)) return noStore({error:"Role mismatch"},400);

      try{
        const c=await prisma.billCode.update({
          where:{id:codeId},
          data:{code,multiplier},
          select:{id:1,role:1,code:1,multiplier:1,sortOrder:1,isActive:1}
        });
        invalidateBills(role);
        return noStore({code:c});
      }catch(e){
        if(e?.code==="P2002") return noStore({error:"Code already exists"},400);
        throw e;
      }
    }

    if(action==="billCodeDelete"){
      const codeId=toInt(b.codeId);
      if(!codeId) return noStore({error:"Missing"},400);
      await prisma.billCode.delete({where:{id:codeId}});
      invalidateBills(role);
      return noStore({ok:true});
    }

    return noStore({error:"Unknown action"},400);
  }catch(e){
    console.error("Calendar API error:",e);
    return noStore({error:"Server error"},500);
  }
}
