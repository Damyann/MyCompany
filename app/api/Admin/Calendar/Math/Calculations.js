import "server-only";
import prisma from "@/lib/prisma";

export const ROLES=new Set(["DEALER","PITBOSS","SUPPORT","QA","TRAINING","CLEANERS"]);
export const BILL_NAMES=["Shifts","SICK","PH","Nights","TOTAL","Bonus","DP"];
export const TOTAL_KEYS=["Shifts","SICK","PH","Bonus","DP"]; // Nights се включва по default
export const DEF_TOTAL=Object.fromEntries(TOTAL_KEYS.map(k=>[k,true]));
export const DEFAULT_BONUS_THRESHOLD=22;

export const toInt=v=>{const n=Number(v);return Number.isFinite(n)?Math.trunc(n):null;};
export const roleOf=v=>{const r=String(v||"DEALER").toUpperCase();return ROLES.has(r)?r:"DEALER";};
export const normCode=x=>String(x??"").trim().replace(/\s+/g,"").toUpperCase();
export const normTotalCfg=v=>Object.fromEntries(TOTAL_KEYS.map(k=>[k,v?.[k]!==false]));
export const normDpCfg=v=>{const o={};for(let d=1;d<=31;d++){const k=""+d,a=Array.isArray(v?.[k])?v[k]:Array.isArray(v?.[d])?v[d]:[];const u=[...new Set((a||[]).map(normCode).filter(Boolean))].sort();if(u.length)o[k]=u}return o};
export const normBonusCfg=v=>{const raw=v&&typeof v==="object"?(v.threshold??v.bonusThreshold):v;const n=Number(raw);const threshold=Number.isFinite(n)?Math.max(0,Math.round(n*2)/2):DEFAULT_BONUS_THRESHOLD;return{threshold}};
const DAY_MS=86400000,pad2=n=>String(n).padStart(2,"0"),dateKey=(y,m,d)=>`${y}-${pad2(m)}-${pad2(d)}`,toUtcDate=(y,m,d)=>new Date(Date.UTC(y,m-1,d)),addUtcDays=(dt,days)=>new Date(dt.getTime()+days*DAY_MS),keyOfDate=dt=>dateKey(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate()),weekdayOf=(y,m,d)=>toUtcDate(y,m,d).getUTCDay();
const BG_FIXED_HOLIDAYS=[[1,1],[3,3],[5,1],[5,6],[5,24],[9,6],[9,22],[12,24],[12,25],[12,26]];
const BG_EXTRA_NON_WORKING={2025:[dateKey(2025,12,31)],2026:[dateKey(2026,1,2)]};
const BG_EXTRA_WORKING={};
export const getOrthodoxEasterSunday=(year)=>{const a=year%4,b=year%7,c=year%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7,month=Math.floor((d+e+114)/31),day=((d+e+114)%31)+1;return addUtcDays(new Date(Date.UTC(year,month-1,day)),13)};
export const getBgOfficialHolidayKeys=year=>{const y=toInt(year);if(!y)return new Set();const out=new Set(BG_FIXED_HOLIDAYS.map(([m,d])=>dateKey(y,m,d)));const easter=getOrthodoxEasterSunday(y);for(const off of[-2,-1,0,1]) out.add(keyOfDate(addUtcDays(easter,off)));return out};
const getBgExtraNonWorkingKeys=year=>new Set(BG_EXTRA_NON_WORKING[toInt(year)]||[]);
const getBgExtraWorkingKeys=year=>new Set(BG_EXTRA_WORKING[toInt(year)]||[]);
export const getBgCompensationHolidayKeys=year=>{const y=toInt(year);if(!y)return new Set();const fixed=BG_FIXED_HOLIDAYS.map(([m,d])=>toUtcDate(y,m,d)).filter(dt=>{const wd=dt.getUTCDay();return wd===0||wd===6});const official=getBgOfficialHolidayKeys(y),extraOff=getBgExtraNonWorkingKeys(y),extraOn=getBgExtraWorkingKeys(y),out=new Set();if(!fixed.length)return out;let i=0;while(i<fixed.length){let last=fixed[i],count=1;i++;while(i<fixed.length&&((fixed[i].getTime()-last.getTime())===DAY_MS)){last=fixed[i];count++;i++}let cur=addUtcDays(last,1);while(count>0){const key=keyOfDate(cur),wd=cur.getUTCDay(),isWeekday=wd>=1&&wd<=5,canUse=((isWeekday&&!official.has(key)&&!extraOff.has(key))||extraOn.has(key))&&!out.has(key);if(canUse){out.add(key);count--}cur=addUtcDays(cur,1)}}return out};
export const getBgNonWorkingWeekdayKeys=year=>{const y=toInt(year);if(!y)return new Set();const out=new Set([...getBgOfficialHolidayKeys(y),...getBgCompensationHolidayKeys(y),...getBgExtraNonWorkingKeys(y)]);for(const k of getBgExtraWorkingKeys(y)) out.delete(k);return out};
export const countBgWorkdaysInMonth=(year,month)=>{const y=toInt(year),m=toInt(month);if(!y||!m)return 0;const dim=new Date(y,m,0).getDate(),off=getBgNonWorkingWeekdayKeys(y),extraOn=getBgExtraWorkingKeys(y);let n=0;for(let d=1;d<=dim;d++){const key=dateKey(y,m,d),wd=weekdayOf(y,m,d);if(extraOn.has(key)){n++;continue}if(wd>=1&&wd<=5&&!off.has(key)) n++}return n};
export const countBgWorkdaysInYear=year=>{const y=toInt(year);if(!y)return 0;let n=0;for(let m=1;m<=12;m++) n+=countBgWorkdaysInMonth(y,m);return n};
export const buildBonusCfg=(v,year,month)=>{const cfg=normBonusCfg(v),y=toInt(year),m=toInt(month);return{...cfg,monthWorkdays:y&&m?countBgWorkdaysInMonth(y,m):0,yearWorkdays:y?countBgWorkdaysInYear(y):0}};
export const toks=v=>{const s=(v??"").toString().trim().replace(/(\d+)\s+([A-Za-z]+)/g,"$1$2");return s?s.split(/[,\s/]+/).filter(Boolean).map(normCode):[]};
const cleanShift=x=>(x??"").toString().trim().replace(/(\d+)\s+([A-Za-z]+)/g,"$1$2").replace(/\s+/g,"");

const hoursRank=h=>h===4?0:h===8?1:h===12?2:h===16?3:9;

export const ensureBills=async role=>{
  const ex=await prisma.bill.findMany({where:{role,name:{in:BILL_NAMES}},select:{name:1}});
  const have=new Set(ex.map(b=>b.name));
  const data=BILL_NAMES.filter(n=>!have.has(n)).map((name,i)=>({role,name,sortOrder:i*10,isActive:true}));
  if(data.length) await prisma.bill.createMany({data,skipDuplicates:true});
};

export const syncShiftBillCodes=async role=>{
  await ensureBills(role);
  const bill=await prisma.bill.findFirst({where:{role,name:"Shifts"},select:{id:1}});
  if(!bill) return;

  const sc=await prisma.shiftCode.findMany({where:{role,isActive:true},select:{code:1,hours:1}});
  const desired=[],seen=new Set();
  for(const c of sc){
    const code=String(c.code||"").trim(),k=normCode(code);
    if(!k||seen.has(k)) continue;
    seen.add(k);desired.push({k,code,hours:Number(c.hours)||0});
  }
  desired.sort((a,b)=>{const ra=hoursRank(a.hours),rb=hoursRank(b.hours);return ra!==rb?ra-rb:a.code.localeCompare(b.code)});

  const existing=await prisma.billCode.findMany({where:{billId:bill.id},select:{id:1,code:1,isActive:1}});
  const exByK=new Map();
  for(const e of existing){const k=normCode(e.code);if(k&&!exByK.has(k)) exByK.set(k,e);}

  const wantedK=new Set(desired.map(d=>d.k));
  const toDeactivate=existing.filter(e=>{const k=normCode(e.code);return k&&!wantedK.has(k)&&e.isActive!==false}).map(e=>e.id);

  const tx=[];
  if(toDeactivate.length) tx.push(prisma.billCode.updateMany({where:{id:{in:toDeactivate}},data:{isActive:false}}));

  const toCreate=[];
  for(let i=0;i<desired.length;i++){const d=desired[i];if(!exByK.has(d.k)) toCreate.push({role,billId:bill.id,code:d.code,sortOrder:i*10,isActive:true});}
  if(toCreate.length) tx.push(prisma.billCode.createMany({data:toCreate,skipDuplicates:true}));

  for(let i=0;i<desired.length;i++){const d=desired[i],ex=exByK.get(d.k);if(ex) tx.push(prisma.billCode.update({where:{id:ex.id},data:{code:d.code,sortOrder:i*10,isActive:true}}));}
  if(tx.length) await prisma.$transaction(tx);
};

export const STAFF_SELECT={id:1,nickname:1,gender:1,firstName:1,middleName:1,lastName:1};
export const MONTH_SELECT={id:1,role:1,year:1,month:1,isLocked:1,createdAt:1,updatedAt:1};
export const ENTRY_SELECT={
  id:1,day:1,staffId:1,note:1,shiftCodeId:1,shiftRole:1,billCodeId:1,billRole:1,
  staff:{select:STAFF_SELECT},
  shiftCode:{select:{id:1,role:1,code:1,hours:1}},
  billCode:{select:{id:1,role:1,code:1,multiplier:1}},
};

export const listSchedules=role=>prisma.scheduleMonth.findMany({where:{role},orderBy:[{year:"desc"},{month:"desc"}],select:{id:1,role:1,year:1,month:1,isLocked:1}});
export const getMonth=id=>prisma.scheduleMonth.findFirst({where:{id},select:{id:1,role:1,year:1,month:1,isLocked:1}});
export const getStaff=id=>prisma.staffMember.findFirst({where:{id},select:{id:1,role:1}});

// --- Stats ---
const halfOfHours=h=>h===4?1:h===8?2:h===12?3:h===16?4:0;
const fmtHalf=half=>!half?"0":(half%2===0?String(half/2):`${Math.floor(half/2)}.5`);
const fmt05=n=>{const x=Math.round((Number(n)||0)*2)/2;return Number.isInteger(x)?String(x):String(x)};
const fmtNum=n=>{const v=Number(n)||0;const x=Math.round(v*10000)/10000;if(Math.abs(x)<1e-12) return "0";return String(x).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1')};
const zero=()=>({Shifts:"0",SICK:"0",PH:"0",Nights:"0",Bonus:"0",DP:"0",TOTAL:"0"});

export const buildBillTokToKey=bills=>{
  const m=new Map();
  for(const b of (bills||[])){
    const n=(b.name||"").toString().trim().toUpperCase();
    const key=n==="SICK"?"SICK":n==="PH"?"PH":n==="NIGHTS"?"Nights":n==="BONUS"?"Bonus":n==="DP"?"DP":null;
    if(!key) continue;
    for(const c of (b.codes||[])){
      const t=normCode(c.code); if(!t||m.has(t)) continue;
      m.set(t,{key,mult:key==="PH"?(Number(c.multiplier)||1):1});
    }
  }
  return m;
};

export const buildCellLookups=(dcSorted,bills)=>{
  const shiftLookup=new Map(),billLookup=new Map(),nightLookup=new Map();
  for(const s of (dcSorted||[])) for(const c of (s.codes||[])){
    const k=normCode(cleanShift(c.code));
    if(k&&!shiftLookup.has(k)) shiftLookup.set(k,c.id);
  }
  for(const b of (bills||[])){
    const name=(b.name||"").toString().trim();
    if(/^shifts$/i.test(name)) continue;
    const isNight=/^nights$/i.test(name);
    for(const c of (b.codes||[])){
      const k=normCode(c.code);
      if(!k) continue;
      if(!billLookup.has(k)) billLookup.set(k,c.id);
      if(isNight&&!nightLookup.has(k)) nightLookup.set(k,c.id);
    }
  }
  return {shiftLookup,billLookup,nightLookup};
};

export const parseCell=(raw,{shiftLookup,billLookup,nightLookup}={})=>{
  const ts=toks(raw),rest=[];
  let shiftCodeId=null,billCodeId=null,shiftTok="";
  for(const t of ts){
    if(!shiftCodeId&&shiftLookup?.has?.(t)){shiftCodeId=shiftLookup.get(t);shiftTok=t;}
    else if(!billCodeId&&billLookup?.has?.(t)) billCodeId=billLookup.get(t);
    else rest.push(t);
  }
  if(!billCodeId&&shiftTok&&nightLookup?.has?.(shiftTok)) billCodeId=nightLookup.get(shiftTok);
  return {shiftCodeId,billCodeId,note:rest.length?rest.join(" "):null};
};

const isNightTok=(tok,billTokToKey)=>billTokToKey?.get?.(normCode(tok))?.key==="Nights";

export const computeMonthStats=(entries,year,month,billTokToKey,totalCfg,dpCfg,bonusCfg)=>{
  const dim=new Date(year,month,0).getDate();
  const dp=dpCfg||{};
  const wantByDay=Array.from({length:dim+1},(_,d)=>{const sel=dp[String(d)]||dp[d];return Array.isArray(sel)&&sel.length?new Set(sel.map(normCode)):null;});
  const by=new Map();

  for(const e of (entries||[])){
    const staffId=e?.staffId; if(!staffId) continue;
    const day=Number(e?.day)||0;
    const s=by.get(staffId)||{h:0,dpH:0,SICK:0,PH:0,Nights:0};

    const sc=e?.shiftCode;
    if(sc){
      const h=Number(sc.hours)||0;
      if(h){
        s.h+=h;
        const set=wantByDay[day];
        if(set && set.has(normCode(sc.code))) s.dpH+=h;
      }
    }

    let hasNight=false;
    const bc=e?.billCode;
    if(bc){
      const ent=billTokToKey?.get?.(normCode(bc.code));
      if(ent){
        if(ent.key==="SICK") s.SICK++;
        else if(ent.key==="PH") s.PH+=Number(ent.mult)||1;
        else if(ent.key==="Nights"){s.Nights++;hasNight=true;}
      }
    }
    if(!hasNight&&isNightTok(sc?.code,billTokToKey)) s.Nights++;
    by.set(staffId,s);
  }

  const cfg=totalCfg||{};
  const bonusThreshold=normBonusCfg(bonusCfg).threshold;
  const out={};
  for(const [staffId,s] of by){
    const shifts=(s.h||0)/8;
    const dpSh=(s.dpH||0)/8;
    const bonus=Math.max(0,(shifts-bonusThreshold)*0.5);

    const total=
      (cfg.Shifts!==false?shifts:0)+
      (cfg.SICK!==false?(s.SICK||0):0)+
      (cfg.PH!==false?(s.PH||0):0)+
      (cfg.Nights!==false?(s.Nights||0):0)+
      (cfg.Bonus!==false?bonus:0)+
      (cfg.DP!==false?dpSh:0);

    out[staffId]={
      Shifts:fmtNum(shifts),
      SICK:String(s.SICK||0),
      PH:fmtNum(s.PH||0),
      Nights:String(s.Nights||0),
      Bonus:fmtNum(bonus),
      DP:fmtNum(dpSh),
      TOTAL:fmtNum(total),
    };
  }
  return out;
};

export const computeStaffStats=(staffId,entries,year,month,billTokToKey,totalCfg,dpCfg,bonusCfg)=>{
  const m=computeMonthStats(entries,year,month,billTokToKey,totalCfg,dpCfg,bonusCfg);
  return m?.[staffId]||zero();
};
