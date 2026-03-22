// app/api/Admin/Performance/Add_Delete_Edit/route.js
import{NextResponse}from"next/server";import prisma from"@/lib/prisma";import{GET as CalendarGET}from"../../Calendar/List/route";import{GET as DealerGET}from"../../Dealer/List/route";
export const dynamic="force-dynamic";
const ns=(p,s=200)=>{const r=NextResponse.json(p,{status:s});r.headers.set("Cache-Control","no-store");return r;};
const toInt=v=>{const n=Number(v);return Number.isFinite(n)?Math.trunc(n):null;};
const toNum=v=>{const n=Number(String(v??"").replace(",", "."));return Number.isFinite(n)?n:null;};
const abbrOf=v=>String(v??"").trim().toUpperCase();
const maxChecksOf=v=>{const n=toInt(v);return Number.isFinite(n)?Math.max(1,Math.min(12,n)):6;};
const roleOf=v=>{const s=String(v||"DEALER").trim().toUpperCase();return s||"DEALER";};
const kindOf=v=>String(v||"TECHNICAL").trim().toUpperCase()==="PERFORMANCE"?"PERFORMANCE":"TECHNICAL";
const signOf=v=>{const raw=v&&typeof v==="object"?(v.scoreSign??v.sign??(v.isPositive===true||v.positive===true?"POSITIVE":v.isNegative===true||v.negative===true?"NEGATIVE":null)):v;if(raw===true||raw===1)return"POSITIVE";if(raw===false||raw===0)return"NEGATIVE";const s=String(raw??"").trim().toUpperCase();return["POSITIVE","POS","PLUS","+","TRUE","1"].includes(s)?"POSITIVE":"NEGATIVE";};
const idOf=x=>String(x?.id??x?._id??x?.dealerId??x?.croupierId??x?.userId??"");
const callGET=async(getFn,req,url)=>{const r=await getFn(new Request(url,{headers:req.headers}));const j=await r.json().catch(()=>null);return{ok:r.ok,status:r.status,json:j};};
const isWork=v=>{if(v==null)return false;if(typeof v==="boolean")return v;if(typeof v==="number")return v!==0;if(typeof v==="string"){const s=v.trim().toLowerCase();if(!s||s==="-"||s==="x"||s==="0"||s==="off"||s==="rest"||s==="почивка")return false;return true;}if(typeof v==="object")return isWork(v.shift??v.value??v.code??v.type);return!!v;};
const isShiftEntry=e=>{const sc=e?.shiftCode??e?.shift;if(sc&&typeof sc==="object"){const h=Number(sc.hours??sc.h);if(Number.isFinite(h))return h>0;return isWork(sc.code??sc.value??sc.shift??sc.type);}if(e?.shiftCodeId!=null)return true;return isWork(sc);};
const shiftIds=(sched,day)=>{const ids=new Set(),d=Number(day);if(!d)return ids;const entries=sched?.entries??sched?.data?.entries??sched?.schedule?.entries??sched?.month?.entries;if(Array.isArray(entries)){for(const e of entries){if(Number(e?.day??e?.date??e?.d)!==d)continue;if(isShiftEntry(e))ids.add(String(e?.staffId??e?.dealerId??e?.userId??""));}ids.delete("");return ids;}const s=sched?.shifts??sched?.schedule?.shifts??sched?.data?.shifts;if(Array.isArray(s)){for(const e of s)if(Number(e?.day??e?.date??e?.d)===d&&isWork(e?.shift??e?.value??e?.code??e))ids.add(String(e?.staffId??e?.dealerId??e?.userId??e?.id??""));}else if(s&&typeof s==="object"){for(const k of Object.keys(s)){const v=s[k],cell=Array.isArray(v)?v[d-1]:(v?.[d]??v?.[String(d)]??v?.days?.[d-1]);if(isWork(cell))ids.add(String(k));}}const days=sched?.days??sched?.schedule?.days;if(!ids.size&&Array.isArray(days)){const one=days.find(x=>Number(x?.day??x?.date??x?.d)===d),arr=one?.staffIds??one?.dealerIds??one?.ids??one?.onShift??one?.staff??[];for(const z of arr)ids.add(String(z));}ids.delete("");return ids;};
const ensureScheduleMonth=async(role,year,month)=>prisma.scheduleMonth.upsert({where:{role_year_month:{role,year,month}},update:{},create:{role,year,month}});
const ensureMonitoringMonth=async(role,year,month)=>{await ensureScheduleMonth(role,year,month);return prisma.monitoringMonth.upsert({where:{role_year_month:{role,year,month}},update:{calendarMonth:{connect:{role_year_month:{role,year,month}}}},create:{calendarMonth:{connect:{role_year_month:{role,year,month}}}}});};
const ensureScoreboardGames=async(role,year,month)=>{const games=await prisma.game.findMany({orderBy:{name:"asc"},select:{id:true}});if(games.length)await prisma.monitoringScoreboardGame.createMany({data:games.map(g=>({role,year,month,gameId:g.id,active:true,weight:1})),skipDuplicates:true});return games.length;};
const syncMonthErrorsFromGlobal=async(role,year,month,kind,{overwrite=false}={})=>{const globals=await prisma.monitoringGlobalErrorType.findMany({where:{role,kind},orderBy:{name:"asc"}});if(!globals.length)return{ok:true,kind,created:0,updated:0,skipped:0,total:0};const connect={role_year_month:{role,year,month}};let created=0,updated=0,skipped=0;for(const g of globals){const where={role_year_month_kind_name:{role,year,month,kind,name:g.name}};const existing=await prisma.monitoringErrorType.findUnique({where,select:{id:true}});if(existing){if(!overwrite){skipped++;continue;}await prisma.monitoringErrorType.update({where,data:{weight:g.weight,active:!!g.defaultActive,scoreSign:g.scoreSign,maxChecks:maxChecksOf(g.maxChecks)}});updated++;continue;}await prisma.monitoringErrorType.create({data:{kind,name:g.name,weight:g.weight,active:!!g.defaultActive,scoreSign:g.scoreSign,maxChecks:maxChecksOf(g.maxChecks),monitoringMonth:{connect}}});created++;}return{ok:true,kind,created,updated,skipped,total:globals.length};};

export async function POST(req){
  try{
    const u=new URL(req.url),b=await req.json().catch(()=>null),action=String(b?.action||"").trim(),role=roleOf(b?.role),kind=kindOf(b?.kind||b?.mode),scoreSign=signOf(b?.scoreSign);
    if(role!=="DEALER")return ns({error:"Only DEALER"},400);

    if(action==="createMonth"){
      const year=toInt(b?.year),month=toInt(b?.month);if(!year||!month)return ns({error:"Missing year/month"},400);
      const dim=new Date(year,month,0).getDate();
      const m=await ensureMonitoringMonth(role,year,month);
      const sc=await callGET(CalendarGET,req,new URL(`/api/Admin/Calendar/List?month=${month}&year=${year}&role=${role}`,u));
      if(!sc.ok)return ns({error:sc.json?.error||"Schedule error",raw:sc.json},sc.status);
      const dl=await callGET(DealerGET,req,new URL(`/api/Admin/Dealer/List`,u));
      if(!dl.ok)return ns({error:dl.json?.error||"Dealer error",raw:dl.json},dl.status);
      const dealers=Array.isArray(dl.json?.croupiers)?dl.json.croupiers:Array.isArray(dl.json?.dealers)?dl.json.dealers:[],valid=new Set(dealers.map(d=>idOf(d)));
      for(let d=1;d<=dim;d++){
        const ids=[...shiftIds(sc.json,d)].filter(x=>valid.has(String(x)));
        await prisma.monitoringDayShift.upsert({where:{role_year_month_day:{role,year,month,day:d}},update:{dealerKeys:ids},create:{day:d,dealerKeys:ids,monitoringMonth:{connect:{role_year_month:{role,year,month}}}}});
      }
      const gamesCount=await ensureScoreboardGames(role,year,month);
      const sync={technical:await syncMonthErrorsFromGlobal(role,year,month,"TECHNICAL",{overwrite:false}),performance:await syncMonthErrorsFromGlobal(role,year,month,"PERFORMANCE",{overwrite:false})};
      return ns({month:m,sync,gamesCount},201);
    }

    if(action==="setScoreboardConfig"){
      const year=toInt(b?.year),month=toInt(b?.month);if(!year||!month)return ns({error:"Missing year/month"},400);
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}});if(!pm)return ns({error:"Create month first"},409);
      const data={};
      if(b?.shiftDivider!=null){const n=toNum(b.shiftDivider);if(!(Number.isFinite(n)&&n>0))return ns({error:"Invalid shiftDivider"},400);data.shiftDivider=n;}
      if(b?.shiftMaxCount!=null){const n=toInt(b.shiftMaxCount);if(!(Number.isFinite(n)&&n>=0))return ns({error:"Invalid shiftMaxCount"},400);data.shiftMaxCount=n;}
      if(b?.minShiftCount!=null){const n=toInt(b.minShiftCount);if(!(Number.isFinite(n)&&n>=0))return ns({error:"Invalid minShiftCount"},400);data.minShiftCount=n;}
      if(b?.gamePointWeight!=null){const n=toNum(b.gamePointWeight);if(!(Number.isFinite(n)&&n>=0))return ns({error:"Invalid gamePointWeight"},400);data.gamePointWeight=n;}
      if(b?.budget!=null){const n=toNum(b.budget);if(!(Number.isFinite(n)&&n>=0))return ns({error:"Invalid budget"},400);data.budget=n;}
      if(!Object.keys(data).length)return ns({error:"Nothing to update"},400);
      return ns({item:await prisma.monitoringMonth.update({where:{role_year_month:{role,year,month}},data})});
    }

    if(action==="setScoreboardGameConfig"){
      const year=toInt(b?.year),month=toInt(b?.month),gameId=toInt(b?.gameId);if(!year||!month||!gameId)return ns({error:"Missing year/month/gameId"},400);
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}});if(!pm)return ns({error:"Create month first"},409);
      const data={},gameData={};
      if(b?.active!=null)data.active=!!b.active;
      if(b?.weight!=null){const n=toNum(b.weight);if(!(Number.isFinite(n)&&n>=0))return ns({error:"Invalid game weight"},400);data.weight=n;}
      if(b?.abbr!=null){const abbr=abbrOf(b.abbr);if(!abbr)return ns({error:"Абревиатурата е задължителна"},400);if(abbr.length>12)return ns({error:"Абревиатурата е твърде дълга"},400);gameData.abbr=abbr;}
      if(!Object.keys(data).length&&!Object.keys(gameData).length)return ns({error:"Nothing to update"},400);
      const item=await prisma.$transaction(async tx=>{
        if(Object.keys(gameData).length)await tx.game.update({where:{id:gameId},data:gameData});
        return tx.monitoringScoreboardGame.upsert({where:{role_year_month_gameId:{role,year,month,gameId}},update:data,create:{role,year,month,gameId,active:data.active??true,weight:data.weight??1}});
      });
      return ns({item});
    }

    if(action==="addGlobalErrorType"){
      const name=String(b?.name||"").trim(),weight=toNum(b?.weight)??1,defaultActive=b?.defaultActive==null?true:!!b.defaultActive,maxChecks=maxChecksOf(b?.maxChecks);if(!name)return ns({error:"Missing name"},400);
      return ns({item:await prisma.monitoringGlobalErrorType.upsert({where:{role_kind_name:{role,kind,name}},update:{weight,defaultActive,scoreSign,maxChecks},create:{role,kind,name,weight,defaultActive,scoreSign,maxChecks}})},201);
    }

    if(action==="editGlobalErrorType"){
      const id=toInt(b?.id);if(!id)return ns({error:"Missing id"},400);
      const prev=await prisma.monitoringGlobalErrorType.findUnique({where:{id}});
      if(!prev)return ns({error:"Not found"},404);
      const data={};
      if(b?.name!=null)data.name=String(b.name).trim();
      if(b?.weight!=null)data.weight=toNum(b.weight)??prev.weight;
      if(b?.defaultActive!=null)data.defaultActive=!!b.defaultActive;
      if(b?.scoreSign!=null)data.scoreSign=scoreSign;
      if(b?.maxChecks!=null)data.maxChecks=maxChecksOf(b.maxChecks);
      const item=await prisma.$transaction(async tx=>{
        const updated=await tx.monitoringGlobalErrorType.update({where:{id},data});
        const nextName=data.name||prev.name;
        if(data.name&&data.name!==prev.name)await tx.monitoringErrorType.updateMany({where:{role:prev.role,kind:prev.kind,name:prev.name},data:{name:data.name}});
        if(data.weight!=null||data.defaultActive!=null||data.scoreSign!=null||data.maxChecks!=null)await tx.monitoringErrorType.updateMany({where:{role:prev.role,kind:prev.kind,name:nextName},data:{...(data.weight!=null?{weight:Number(data.weight)}:{}),...(data.defaultActive!=null?{active:!!data.defaultActive}:{}),...(data.scoreSign!=null?{scoreSign:data.scoreSign}:{}),...(data.maxChecks!=null?{maxChecks:maxChecksOf(data.maxChecks)}:{})}});
        return updated;
      });
      return ns({item});
    }

    if(action==="deleteGlobalErrorType"){
      const id=toInt(b?.id);if(!id)return ns({error:"Missing id"},400);
      const gone=await prisma.monitoringGlobalErrorType.delete({where:{id}});
      const ids=await prisma.monitoringErrorType.findMany({where:{role:gone.role,kind:gone.kind,name:gone.name},select:{id:true}});
      if(ids.length)await prisma.monitoringEntry.deleteMany({where:{errorTypeId:{in:ids.map(x=>x.id)}}});
      await prisma.monitoringErrorType.deleteMany({where:{role:gone.role,kind:gone.kind,name:gone.name}});
      return ns({ok:true});
    }

    if(action==="syncMonthErrorsFromGlobal"){
      const year=toInt(b?.year),month=toInt(b?.month),overwrite=!!b?.overwrite;if(!year||!month)return ns({error:"Missing year/month"},400);
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}});
      if(!pm)return ns({error:"Create month first"},409);
      return ns({sync:await syncMonthErrorsFromGlobal(role,year,month,kind,{overwrite})});
    }

    if(action==="addErrorType"){
      const year=toInt(b?.year),month=toInt(b?.month),name=String(b?.name||"").trim(),weight=toNum(b?.weight)??1,active=b?.active==null?true:!!b.active,maxChecks=maxChecksOf(b?.maxChecks);
      if(!year||!month||!name)return ns({error:"Missing year/month/name"},400);
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}});
      if(!pm)return ns({error:"Create month first"},409);
      return ns({item:await prisma.monitoringErrorType.upsert({where:{role_year_month_kind_name:{role,year,month,kind,name}},update:{weight,active,scoreSign,maxChecks},create:{kind,name,weight,active,scoreSign,maxChecks,monitoringMonth:{connect:{role_year_month:{role,year,month}}}}})},201);
    }

    if(action==="editErrorType"){
      const id=toInt(b?.id);if(!id)return ns({error:"Missing id"},400);
      const data={};
      if(b?.name!=null)data.name=String(b.name).trim();
      if(b?.active!=null)data.active=!!b.active;
      if(b?.weight!=null)data.weight=toNum(b.weight)??1;
      if(b?.maxChecks!=null)data.maxChecks=maxChecksOf(b.maxChecks);
      return ns({item:await prisma.monitoringErrorType.update({where:{id},data})});
    }

    if(action==="deleteErrorType"){
      const id=toInt(b?.id);if(!id)return ns({error:"Missing id"},400);
      await prisma.monitoringEntry.deleteMany({where:{errorTypeId:id}});
      await prisma.monitoringErrorType.delete({where:{id}});
      return ns({ok:true});
    }

    if(action==="setEntryCount"){
      const year=toInt(b?.year),month=toInt(b?.month),day=toInt(b?.day),dealerKey=String(b?.dealerKey||"").trim(),errorTypeId=toInt(b?.errorTypeId),rawCount=toInt(b?.count)??0;
      if(!year||!month||!day||!dealerKey||!errorTypeId)return ns({error:"Missing fields"},400);
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}});
      if(!pm)return ns({error:"Create month first"},409);
      const et=await prisma.monitoringErrorType.findUnique({where:{id:errorTypeId},select:{id:true,role:true,year:true,month:true,kind:true,maxChecks:true}});
      if(!et||et.role!==role||et.year!==year||et.month!==month||et.kind!==kind)return ns({error:"Invalid error type"},400);
      const count=Math.max(0,Math.min(maxChecksOf(et.maxChecks),rawCount));
      if(count<=0){await prisma.monitoringEntry.deleteMany({where:{role,year,month,day,kind,dealerKey,errorTypeId}});return ns({ok:true});}
      return ns({entry:await prisma.monitoringEntry.upsert({where:{role_year_month_day_kind_dealerKey_errorTypeId:{role,year,month,day,kind,dealerKey,errorTypeId}},update:{count},create:{day,kind,dealerKey,errorTypeId,count,monitoringMonth:{connect:{role_year_month:{role,year,month}}}}})});
    }

    return ns({error:"Bad action"},400);
  }catch(e){return ns({error:e?.message||"Error"},500)}
}