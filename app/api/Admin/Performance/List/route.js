// app/api/Admin/Performance/List/route.js
import{NextResponse}from"next/server";import prisma from"@/lib/prisma";import{GET as CalendarGET}from"../../Calendar/List/route";import{GET as DealerGET}from"../../Dealer/List/route";import{computeMonthStats,DEF_TOTAL,ENTRY_SELECT}from"../../Calendar/Math/Calculations";
export const dynamic="force-dynamic";
const ns=(p,s=200)=>{const r=NextResponse.json(p,{status:s});r.headers.set("Cache-Control","no-store");return r;};
const toInt=v=>{const n=Number(v);return Number.isFinite(n)?Math.trunc(n):null;};
const roleOf=v=>{const s=String(v||"DEALER").trim().toUpperCase();return s||"DEALER";};
const kindOf=v=>String(v||"TECHNICAL").trim().toUpperCase()==="PERFORMANCE"?"PERFORMANCE":"TECHNICAL";
const signOf=v=>{const raw=v&&typeof v==="object"?(v.scoreSign??v.sign??(v.isPositive===true||v.positive===true?"POSITIVE":v.isNegative===true||v.negative===true?"NEGATIVE":null)):v;if(raw===true||raw===1)return"POSITIVE";if(raw===false||raw===0)return"NEGATIVE";const s=String(raw??"").trim().toUpperCase();return["POSITIVE","POS","PLUS","+","TRUE","1"].includes(s)?"POSITIVE":"NEGATIVE";};
const idOf=x=>String(x?.id??x?._id??x?.dealerId??x?.croupierId??x?.userId??"");
const nameOf=x=>String(x?.nickname||[x?.firstName,x?.middleName,x?.lastName].filter(Boolean).join(" ").trim()||x?.name||x?.fullName||x?.username||x?.email||idOf(x));
const round2=v=>Math.round((Number(v)||0)*100)/100;
const maxChecksOf=v=>{const n=toInt(v);return Number.isFinite(n)?Math.max(1,Math.min(12,n)):6;};
const signRank=v=>signOf(v)==="POSITIVE"?0:1;
const sortErrors=list=>(Array.isArray(list)?list:[]).slice().sort((a,b)=>(signRank(a)-signRank(b))||((Number(a?.weight)||0)-(Number(b?.weight)||0))||String(a?.name||"").localeCompare(String(b?.name||""),"bg",{sensitivity:"base"}));
const mapError=x=>({...x,scoreSign:signOf(x),maxChecks:maxChecksOf(x?.maxChecks)});
const callGET=async(getFn,req,url)=>{const r=await getFn(new Request(url,{headers:req.headers}));const j=await r.json().catch(()=>null);return{ok:r.ok,status:r.status,json:j};};
const isWork=v=>{if(v==null)return false;if(typeof v==="boolean")return v;if(typeof v==="number")return v!==0;if(typeof v==="string"){const s=v.trim().toLowerCase();if(!s||s==="-"||s==="x"||s==="0"||s==="off"||s==="rest"||s==="почивка")return false;return true;}if(typeof v==="object")return isWork(v.shift??v.value??v.code??v.type);return!!v;};
const isShiftEntry=e=>{const sc=e?.shiftCode??e?.shift;if(sc&&typeof sc==="object"){const h=Number(sc.hours??sc.h);if(Number.isFinite(h))return h>0;return isWork(sc.code??sc.value??sc.shift??sc.type);}if(e?.shiftCodeId!=null)return true;return isWork(sc);};
const shiftIds=(sched,day)=>{const ids=new Set(),d=Number(day);if(!d)return ids;const entries=sched?.entries??sched?.data?.entries??sched?.schedule?.entries??sched?.month?.entries;if(Array.isArray(entries)){for(const e of entries){if(Number(e?.day??e?.date??e?.d)!==d)continue;if(isShiftEntry(e))ids.add(String(e?.staffId??e?.dealerId??e?.userId??""));}ids.delete("");return ids;}const s=sched?.shifts??sched?.schedule?.shifts??sched?.data?.shifts;if(Array.isArray(s)){for(const e of s)if(Number(e?.day??e?.date??e?.d)===d&&isWork(e?.shift??e?.value??e?.code??e))ids.add(String(e?.staffId??e?.dealerId??e?.userId??e?.id??""));}else if(s&&typeof s==="object"){for(const k of Object.keys(s)){const v=s[k],cell=Array.isArray(v)?v[d-1]:(v?.[d]??v?.[String(d)]??v?.days?.[d-1]);if(isWork(cell))ids.add(String(k));}}const days=sched?.days??sched?.schedule?.days;if(!ids.size&&Array.isArray(days)){const one=days.find(x=>Number(x?.day??x?.date??x?.d)===d),arr=one?.staffIds??one?.dealerIds??one?.ids??one?.onShift??one?.staff??[];for(const z of arr)ids.add(String(z));}ids.delete("");return ids;};
const shiftIdsMonth=sched=>{const ids=new Set();const entries=sched?.entries??sched?.data?.entries??sched?.schedule?.entries??sched?.month?.entries;if(Array.isArray(entries)){for(const e of entries)if(isShiftEntry(e))ids.add(String(e?.staffId??e?.dealerId??e?.userId??""));ids.delete("");return ids;}const s=sched?.shifts??sched?.schedule?.shifts??sched?.data?.shifts;if(Array.isArray(s)){for(const e of s)if(isShiftEntry(e))ids.add(String(e?.staffId??e?.dealerId??e?.userId??e?.id??""));ids.delete("");return ids;}if(s&&typeof s==="object"){for(const k of Object.keys(s)){const v=s[k];if(Array.isArray(v)){for(const cell of v)if(isWork(cell)){ids.add(String(k));break;}}else if(v&&typeof v==="object"){const days=v.days??v;if(Array.isArray(days)){for(const cell of days)if(isWork(cell)){ids.add(String(k));break;}}else for(const dk of Object.keys(v))if(isWork(v[dk])){ids.add(String(k));break;}}else if(isWork(v))ids.add(String(k));}ids.delete("");return ids;}const days=sched?.days??sched?.schedule?.days;if(Array.isArray(days))for(const one of days){const arr=one?.staffIds??one?.dealerIds??one?.ids??one?.onShift??one?.staff??[];for(const z of arr)ids.add(String(z));}ids.delete("");return ids;};
const normArr=a=>[...new Set((Array.isArray(a)?a:[]).map(x=>String(x)).filter(Boolean))].sort();
const sameArr=(a,b)=>{a=normArr(a);b=normArr(b);if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;};
const ensureScoreboardGames=async(role,year,month)=>{const games=await prisma.game.findMany({orderBy:{name:"asc"},select:{id:true}});if(games.length)await prisma.monitoringScoreboardGame.createMany({data:games.map(g=>({role,year,month,gameId:g.id,active:true,weight:1})),skipDuplicates:true});return games;};

export async function GET(req){
  try{
    const u=new URL(req.url),sp=u.searchParams,role=roleOf(sp.get("role")),kind=kindOf(sp.get("kind")||sp.get("mode"));
    if(role!=="DEALER")return ns({error:"Only DEALER"},400);
    const year=toInt(sp.get("year")),month=toInt(sp.get("month")),day=toInt(sp.get("day"));
    const list=sp.get("list")==="1"||sp.get("list")==="true"||sp.get("list")==="list";
    const errors=sp.get("errors")==="1";
    const scope=String(sp.get("scope")||"").trim().toLowerCase();
    const force=sp.get("force")==="1";
    const monthly=sp.get("monthly")==="1"||sp.get("monthly")==="true"||sp.get("monthly")==="monthly";
    const scoreboard=sp.get("scoreboard")==="1"||sp.get("scoreboard")==="true"||sp.get("scoreboard")==="scoreboard";

    if(list){
      const {ok,status,json}=await callGET(CalendarGET,req,new URL(`/api/Admin/Calendar/List?list=1&role=${role}`,u));
      if(!ok)return ns({error:json?.error||"Calendar error",raw:json},status);
      const calendarMonths=Array.isArray(json?.schedules)?json.schedules:[];
      const saved=await prisma.monitoringMonth.findMany({where:{role},select:{year:true,month:true}});
      const set=new Set(saved.map(x=>`${x.year}-${x.month}`));
      return ns({months:calendarMonths.map(m=>({year:m.year,month:m.month,hasDb:set.has(`${m.year}-${m.month}`)}))});
    }

    if(errors){
      if(scope==="global"){const errorTypes=await prisma.monitoringGlobalErrorType.findMany({where:{role,kind}});return ns({errorTypes:sortErrors(errorTypes).map(mapError)});}
      if(year==null||month==null)return ns({error:"Missing year/month"},400);
      const errorTypes=await prisma.monitoringErrorType.findMany({where:{role,year,month,kind}});
      return ns({errorTypes:sortErrors(errorTypes).map(mapError)});
    }

    if(scoreboard){
      if(year==null||month==null)return ns({error:"Missing year/month"},400);
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true,shiftDivider:true,shiftMaxCount:true,minShiftCount:true,gamePointWeight:true,budget:true}});
      if(!pm)return ns({hasDb:false,config:{shiftDivider:5,shiftMaxCount:22,minShiftCount:5,gamePointWeight:1,budget:0,maxShiftPoints:4.4},games:[],rows:[]});
      await ensureScoreboardGames(role,year,month);
      const shiftDivider=Number(pm.shiftDivider)||5,shiftMaxCount=Math.max(0,Number(pm.shiftMaxCount)||22),minShiftCount=Math.max(0,Number(pm.minShiftCount)||5),gamePointWeight=Math.max(0,Number(pm.gamePointWeight)||0),budget=Math.max(0,Number(pm.budget)||0),maxShiftPoints=shiftDivider>0?round2(shiftMaxCount/shiftDivider):0;

      const gameCols=(await prisma.monitoringScoreboardGame.findMany({where:{role,year,month},orderBy:{game:{name:"asc"}},select:{gameId:true,active:true,weight:true,game:{select:{id:true,name:true,abbr:true}}}})).map(g=>({id:g.game.id,name:g.game.name,abbr:String(g.game.abbr||"").trim(),active:!!g.active,weight:Number(g.weight)||0}));
      const activeGames=gameCols.filter(g=>g.active);

      const dealers=await prisma.staffMember.findMany({where:{role,isActive:true},orderBy:[{nickname:"asc"},{id:"asc"}],select:{id:true,firstName:true,middleName:true,lastName:true,nickname:true,email:true,gender:true,games:{select:{gameId:true}}}});
      const calMonth=await prisma.scheduleMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true,entries:{select:ENTRY_SELECT}}});
      const statsByStaffId=calMonth?computeMonthStats(calMonth.entries,year,month,new Map(),DEF_TOTAL,{}):{};

      const typeRows=await prisma.monitoringErrorType.findMany({where:{role,year,month},select:{id:true,kind:true,weight:true,scoreSign:true}});
      const typeMap=new Map(typeRows.map(t=>[Number(t.id),{kind:t.kind,weight:Number(t.weight)||0,scoreSign:signOf(t)}]));
      const entryRows=await prisma.monitoringEntry.findMany({where:{role,year,month},select:{dealerKey:true,errorTypeId:true,count:true}});
      const perfNeg=new Map(),techNeg=new Map(),pos=new Map();

      for(const e of entryRows){
        const dealerKey=String(e?.dealerKey||"");if(!dealerKey)continue;
        const count=Number(e?.count)||0;if(count<=0)continue;
        const t=typeMap.get(Number(e?.errorTypeId));if(!t)continue;
        const value=round2(count*(Number.isFinite(t.weight)?t.weight:1));
        if(t.scoreSign==="POSITIVE")pos.set(dealerKey,round2((pos.get(dealerKey)||0)+value));
        else if(t.kind==="TECHNICAL")techNeg.set(dealerKey,round2((techNeg.get(dealerKey)||0)+value));
        else perfNeg.set(dealerKey,round2((perfNeg.get(dealerKey)||0)+value));
      }

      const baseRows=dealers.map(d=>{
        const dealerKey=String(d.id),known=new Set((d.games||[]).map(g=>Number(g.gameId)));
        const rawShiftCount=round2(Number(statsByStaffId?.[dealerKey]?.Shifts)||0);
        const rawShiftPoints=shiftDivider>0?round2(rawShiftCount/shiftDivider):0;
        const shiftPoints=round2(Math.min(rawShiftPoints,maxShiftPoints));
        const shiftRatio=maxShiftPoints>0?(shiftPoints/maxShiftPoints):0;
        const gamesKnown=activeGames.map(g=>known.has(g.id));
        const gamesBasePoints=round2(activeGames.reduce((n,g)=>n+(known.has(g.id)?Number(g.weight)||0:0),0)*gamePointWeight);
        const gamesScaledPoints=round2(gamesBasePoints*shiftRatio);
        const appearance=round2(perfNeg.get(dealerKey)||0);
        const technical=round2(techNeg.get(dealerKey)||0);
        const exceptional=round2(pos.get(dealerKey)||0);
        const points=round2(Math.max(0,shiftPoints+gamesScaledPoints-appearance-technical+exceptional));
        return{dealerKey,name:nameOf(d),nickname:String(d.nickname||""),gender:String(d.gender||"ALL").toUpperCase(),rawShiftCount,rawShiftPoints,shiftPoints,shiftRatio:round2(shiftRatio),gamesKnown,appearance,technical,exceptional,gamesScaledPoints,points};
      }).filter(r=>r.rawShiftCount>=minShiftCount);
      const totalBudget=round2(baseRows.length*budget),totalPoints=round2(baseRows.reduce((sum,r)=>sum+(Number(r.points)||0),0)),pointValue=totalPoints>0?totalBudget/totalPoints:0;
      const rows=baseRows.map(r=>({...r,money:round2(pointValue*r.points)})).sort((a,b)=>(b.points-a.points)||(b.money-a.money)||a.name.localeCompare(b.name,"bg",{sensitivity:"base"}));

      return ns({hasDb:true,config:{shiftDivider,shiftMaxCount,minShiftCount,gamePointWeight,budget,maxShiftPoints,totalBudget,totalPoints,pointValue},games:gameCols,rows});
    }

    if(monthly){
      if(year==null||month==null)return ns({error:"Missing year/month"},400);
      const daysInMonth=new Date(year,month,0).getDate();
      const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}}),hasDb=!!pm;
      const dl=await callGET(DealerGET,req,new URL(`/api/Admin/Dealer/List`,u));
      if(!dl.ok)return ns({error:dl.json?.error||"Dealer error",raw:dl.json},dl.status);
      const dealers=Array.isArray(dl.json?.croupiers)?dl.json.croupiers:Array.isArray(dl.json?.dealers)?dl.json.dealers:[];
      const dealerMap=new Map(dealers.map(d=>[idOf(d),nameOf(d)])),valid=new Set(dealers.map(d=>idOf(d)));
      const sc=await callGET(CalendarGET,req,new URL(`/api/Admin/Calendar/List?month=${month}&year=${year}&role=${role}`,u));
      if(!sc.ok)return ns({error:sc.json?.error||"Schedule error",raw:sc.json},sc.status);
      const ids=[...shiftIdsMonth(sc.json)].filter(x=>valid.has(String(x)));
      const entries=await prisma.monitoringEntry.findMany({where:{role,year,month,kind},select:{dealerKey:true,errorTypeId:true,count:true,day:true}});
      const errorTypes=await prisma.monitoringErrorType.findMany({where:{role,year,month,kind},select:{id:true,weight:true}});
      const wMap=new Map(errorTypes.map(t=>[Number(t.id),Number(t.weight)]));
      const totalMap=new Map(),dayMap=new Map();
      for(const e of entries){
        const k=String(e?.dealerKey||"");if(!k)continue;
        const c=Number(e?.count)||0;if(c<=0)continue;
        const d=Number(e?.day)||0;
        const weight=Number(wMap.get(Number(e?.errorTypeId))),value=c*(Number.isFinite(weight)?weight:1);
        totalMap.set(k,round2((totalMap.get(k)||0)+value));
        if(d>=1&&d<=daysInMonth){let a=dayMap.get(k);if(!a){a=Array(daysInMonth).fill(0);dayMap.set(k,a);}a[d-1]=round2((a[d-1]||0)+value);}
      }
      const all=new Set(ids);for(const k of totalMap.keys())all.add(k);all.delete("");
      const rows=[...all].filter(k=>valid.has(k)).map(k=>({dealerKey:k,name:dealerMap.get(k)||k,total:round2(totalMap.get(k)||0),days:(dayMap.get(k)||Array(daysInMonth).fill(0)).map(round2)})).sort((a,b)=>a.name.localeCompare(b.name,"bg",{sensitivity:"base"}));
      return ns({hasDb,daysInMonth,kind,rows});
    }

    if(!year||!month||!day)return ns({error:"Missing year/month/day"},400);
    const pm=await prisma.monitoringMonth.findUnique({where:{role_year_month:{role,year,month}},select:{id:true}}),hasDb=!!pm;
    const dl=await callGET(DealerGET,req,new URL(`/api/Admin/Dealer/List`,u));
    if(!dl.ok)return ns({error:dl.json?.error||"Dealer error",raw:dl.json},dl.status);
    const dealers=Array.isArray(dl.json?.croupiers)?dl.json.croupiers:Array.isArray(dl.json?.dealers)?dl.json.dealers:[];
    const dealerInfo=new Map(dealers.map(d=>[idOf(d),{name:nameOf(d),gender:String(d?.gender||"ALL").toUpperCase()}])),valid=new Set(dealers.map(d=>idOf(d)));
    const sc=await callGET(CalendarGET,req,new URL(`/api/Admin/Calendar/List?month=${month}&year=${year}&role=${role}`,u));
    if(!sc.ok)return ns({error:sc.json?.error||"Schedule error",raw:sc.json},sc.status);
    const ids=[...shiftIds(sc.json,day)].filter(x=>valid.has(String(x)));
    let shift=await prisma.monitoringDayShift.findUnique({where:{role_year_month_day:{role,year,month,day}}});
    if(hasDb){
      if(!shift)shift=await prisma.monitoringDayShift.create({data:{day,dealerKeys:ids,monitoringMonth:{connect:{role_year_month:{role,year,month}}}}});
      else if(force||!sameArr(shift.dealerKeys,ids))shift=await prisma.monitoringDayShift.update({where:{role_year_month_day:{role,year,month,day}},data:{dealerKeys:ids}});
    }
    const keys=Array.isArray(shift?.dealerKeys)?shift.dealerKeys:ids;
    const onShift=keys.map(k=>{const dk=String(k),info=dealerInfo.get(dk);return{id:dk,name:info?.name||dk,gender:info?.gender||"ALL"};});
    const errorTypes=sortErrors(await prisma.monitoringErrorType.findMany({where:{role,year,month,kind,active:true}})).map(mapError);
    const entries=await prisma.monitoringEntry.findMany({where:{role,year,month,day,kind}});
    return ns({hasDb,onShift,errorTypes,entries,kind});
  }catch(e){return ns({error:e?.message||"Error"},500)}
}