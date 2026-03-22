import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic="force-dynamic";

import {
  roleOf,toInt,MONTH_SELECT,ENTRY_SELECT,listSchedules,
  computeMonthStats
} from "../Math/Calculations";

import {
  getDayCard,
  getTotalCfg,
  getDpCfg,
  getBills,
  getBillTokToKey,
} from "../cache";

const noStore=(p,s=200)=>{const r=NextResponse.json(p,{status:s});r.headers.set("Cache-Control","no-store");return r;};

export async function GET(req){
  const sp=new URL(req.url).searchParams;
  const role=roleOf(sp.get("role"));
  const month=toInt(sp.get("month")),year=toInt(sp.get("year"));

  if(sp.get("dayCard")){
    const sections=await getDayCard(role);
    return noStore({sections});
  }

  if(sp.get("settings")){
    const totalCfg=await getTotalCfg(role);
    return noStore({settings:{totalCfg:totalCfg}});
  }

  if(sp.get("dpCfg")){
    if(!month||!year) return noStore({error:"Missing month/year"},400);
    const dpCfg=await getDpCfg(role,year,month);
    return noStore({dpCfg});
  }

  if(sp.get("bills")){
    const bills=await getBills(role);
    return noStore({bills});
  }

  if(sp.get("list")) return noStore({schedules:await listSchedules(role)});

  if(month&&year){
    const m=await prisma.scheduleMonth.findUnique({
      where:{role_year_month:{role,year,month}},
      select:{...MONTH_SELECT,entries:{orderBy:[{staffId:"asc"},{day:"asc"}],select:ENTRY_SELECT}}
    });
    if(!m) return noStore(null);

    const [totalCfg,dpCfg,billTokToKey]=await Promise.all([
      getTotalCfg(role),
      getDpCfg(role,year,month),
      getBillTokToKey(role),
    ]);

    const statsByStaffId=computeMonthStats(
      m.entries,m.year,m.month,
      billTokToKey,
      totalCfg,
      dpCfg
    );

    return noStore({month:{id:m.id,role:m.role,year:m.year,month:m.month,isLocked:m.isLocked},entries:m.entries,statsByStaffId});
  }

  return noStore({schedules:await listSchedules(role)});
}
