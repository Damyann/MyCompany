// components/Admin/Calendar/Calendar_Math.js
export const monthsMap = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
export const weekdayNamesBg = ["неделя","понеделник","вторник","сряда","четвъртък","петък","събота"];

export const norm = (x)=> (x??"").toString().trim().replace(/\s+/g,"").toUpperCase();


export const sortBillCodesByNumber=(codes)=>{
  const arr=[...(codes||[])];
  const numOf=(x)=>{const s=(x?.code??x??"").toString().trim();const m=s.match(/\d+/);const n=m?parseInt(m[0],10):NaN;return Number.isFinite(n)?n:Infinity};
  arr.sort((a,b)=>{
    const na=numOf(a), nb=numOf(b);
    if(na!==nb) return na-nb;
    const sa=norm(a?.code??a), sb=norm(b?.code??b);
    return sa.localeCompare(sb);
  });
  return arr;
};
export const buildBillTokToKey=(bills)=>{
  const m=new Map();
  for(const b of (bills||[])){
    const n=(b.name||"").toString().trim().toUpperCase();
    const key=n==="SICK"?"SICK":n==="PH"?"PH":n==="NIGHTS"?"Nights":n==="BONUS"?"Bonus":n==="DP"?"DP":null;
    if(!key) continue;
    for(const c of (b.codes||[])){
      const t=norm(c.code);
      if(!t||m.has(t)) continue;
      const mult=key==="PH"?(Number(c.multiplier)||1):1;
      m.set(t,{key,mult});
    }
  }
  return m;
};

export const toks = (v)=>{
  const s=(v??"").toString().trim().replace(/(\d+)\s+([A-Za-z]+)/g,"$1$2");
  return s ? s.split(/[,\s/]+/).filter(Boolean).map(norm) : [];
};

export const decodeCode = (code)=>{
  if(!code||code==="-") return null;
  const c=code.toString().replace(/\s+/g,"");
  if(c.length!==5) return null;
  const mRaw=c.slice(0,3);
  const short=(mRaw[0]?.toUpperCase()||"")+mRaw.slice(1).toLowerCase();
  const yearShort=c.slice(3);
  if(!/^\d{2}$/.test(yearShort)) return null;
  const month=monthsMap[short];
  const year=2000+Number(yearShort);
  if(!month||!year) return null;
  return { month, year };
};

export const cleanShift = (x)=>(x??"").toString().trim()
  .replace(/(\d+)\s+([A-Za-z]+)/g,"$1$2")
  .replace(/\s+/g,"");

export const prettyCode = (x)=>{
  const s=cleanShift(x).toUpperCase();
  return s.split("+").map(p=>{
    const m=p.match(/^(\d+)([A-Z]+)$/);
    return m ? `${m[1]} ${m[2]}` : p;
  }).join("+");
};

// ---- Shift packing (grouping base / A / G) ----
const shiftBase = (x)=>{ const s=cleanShift(x); const m=s.match(/^(.+?)([AG])$/i); return m?m[1]:s; };
const shiftNums = (base)=> base.split("+").map(p=>parseInt(p,10)).filter(n=>!Number.isNaN(n));
const shiftBaseCmp = (a,b)=>{
  const na=shiftNums(a), nb=shiftNums(b);
  if(na.length && nb.length){
    for(let i=0;i<Math.max(na.length,nb.length);i++){
      const va=na[i]??-1, vb=nb[i]??-1;
      if(va!==vb) return va-vb;
    }
    return 0;
  }
  if(na.length!==nb.length) return na.length ? -1 : 1;
  return a.localeCompare(b,"bg");
};
const shiftRank = (code, base)=>{
  const s=cleanShift(code).toUpperCase(), b=cleanShift(base).toUpperCase();
  if(s===b) return 0;
  if(s===b+"A") return 1;
  if(s===b+"G") return 2;
  return 9;
};
export const shiftPack = (codes)=>{
  const list=(codes||[]).map(cleanShift).filter(Boolean);
  const bases=[...new Set(list.map(shiftBase))].sort(shiftBaseCmp);
  return bases.map(base=>{
    const group=list.filter(x=>shiftBase(x).toUpperCase()===cleanShift(base).toUpperCase());
    group.sort((a,b)=>shiftRank(a,base)-shiftRank(b,base));
    return { base, codes:group };
  });
};

export const getActiveSortedSections = (dc)=>{
  const arr=Array.isArray(dc)?dc:[];
  return arr.filter(s=>s && s.isActive!==false).slice().sort((a,b)=>{
    const sa=Number(a.sortOrder)||0, sb=Number(b.sortOrder)||0;
    if(sa!==sb) return sa-sb;
    return (a.id||0)-(b.id||0);
  }).map(s=>({...s,codes:(s.codes||[]).filter(c=>c && c.isActive!==false)}));
};

export const groupCodes = (codes)=>{
  const out={4:[],8:[],12:[],16:[],other:[]};
  for(const c of (codes||[])){
    const h=Number(c.hours);
    if(h===4) out[4].push(c);
    else if(h===8) out[8].push(c);
    else if(h===12) out[12].push(c);
    else if(h===16) out[16].push(c);
    else out.other.push(c);
  }
  return out;
};

export const buildShiftAuto = (dcSorted)=>{
  const shiftHours=[4,8,12,16];
  const shiftCodeHours=new Map(); // token->hours (for Shifts calc)
  const shiftAutoByHours={4:[],8:[],12:[],16:[]};
  for(const s of (Array.isArray(dcSorted)?dcSorted:[])){
    const per={4:[],8:[],12:[],16:[]};
    const seen=new Set();
    for(const c of (s.codes||[])){
      const raw=cleanShift(c.code);
      const k=norm(raw);
      if(!k || seen.has(k)) continue;
      seen.add(k);
      const h=Number(c.hours)||8;
      if(shiftCodeHours.get(k)==null && shiftHours.includes(h)) shiftCodeHours.set(k,h);
      if(per[h]) per[h].push(raw);
    }
    for(const h of shiftHours) if(per[h].length) shiftAutoByHours[h].push({ id:s.id, name:s.name, groups:shiftPack(per[h]) });
  }
  return { shiftHours, shiftCodeHours, shiftAutoByHours };
};

export const buildDcByDay = (rows, dcSorted, dim=31)=>{
  const dcByDay=Array.from({length:dim},()=>({}));
  const codeMap=new Map(); // token -> [sectionId...]
  for(const s of (Array.isArray(dcSorted)?dcSorted:[])) for(const c of (s.codes||[])){
    const k=norm(c.code);
    if(!k) continue;
    (codeMap.get(k) || codeMap.set(k,[]).get(k)).push(s.id);
  }
  if(!Array.isArray(rows) || !rows.length || !codeMap.size) return dcByDay;
  for(const row of rows) for(let d=1; d<=dim; d++){
    const val=row?.["day"+d];
    if(!val) continue;
    for(const t of toks(val)){
      const secIds=codeMap.get(t);
      if(!secIds) continue;
      const obj=dcByDay[d-1];
      for(const secId of secIds) obj[secId]=(obj[secId]||0)+1;
    }
  }
  return dcByDay;
};

// ---- Cell lookups + parsing (used on saveCell) ----
export const buildCellLookups = (dcSorted, bills)=>{
  const shiftLookup=new Map(); // token -> ShiftCode.id
  for(const s of (Array.isArray(dcSorted)?dcSorted:[])) for(const c of (s.codes||[])){
    const k=norm(cleanShift(c.code));
    if(k && !shiftLookup.has(k)) shiftLookup.set(k, c.id);
  }
  const billLookup=new Map(); // token -> BillCode.id
  for(const b of (Array.isArray(bills)?bills:[])){
    if(/^shifts$/i.test((b.name||"").toString().trim())) continue; // Shifts codes са ShiftCode, не BillCode
    for(const c of (b.codes||[])){
      const k=norm(c.code);
      if(k && !billLookup.has(k)) billLookup.set(k, c.id);
    }
  }
  return { shiftLookup, billLookup };
};

export const parseCell = (raw, {shiftLookup, billLookup}={})=>{
  const ts=toks(raw);
  const rest=[];
  let shiftCodeId=null, billCodeId=null;
  for(const t of ts){
    if(!shiftCodeId && shiftLookup?.has?.(t)) shiftCodeId=shiftLookup.get(t);
    else if(!billCodeId && billLookup?.has?.(t)) billCodeId=billLookup.get(t);
    else rest.push(t);
  }
  return { shiftCodeId, billCodeId, note: rest.length ? rest.join(" ") : null };
};

// ---- Row stats (for now only Shifts; others stay 0 until we define rules) ----
export const calcRowShiftsHalf = (row, dim, shiftCodeHours)=>{
  let half=0;
  for(let d=1; d<=dim; d++){
    const val=row?.["day"+d];
    if(!val) continue;
    const ts=toks(val);
    for(const t of ts){
      const h=shiftCodeHours?.get?.(t);
      if(h==null) continue;
      half += (h===4?1 : h===8?2 : h===12?3 : h===16?4 : 0);
      break;
    }
  }
  return half;
};

const calcRowShiftHours=(row,dim,shiftCodeHours)=>{
  let h=0;
  for(let d=1;d<=dim;d++){
    const val=row?.["day"+d];if(!val) continue;
    for(const t of toks(val)){
      const hh=Number(shiftCodeHours?.get?.(t));
      if(!Number.isFinite(hh)) continue;
      h+=hh;break;
    }
  }
  return h;
};


const calcRowDPHalf=(row,dim,shiftCodeHours,dpCfg)=>{
  let half=0;
  const cfg=dpCfg||{};
  for(let d=1;d<=dim;d++){
    const sel=cfg?.[String(d)]||cfg?.[d];
    if(!Array.isArray(sel) || !sel.length) continue;
    const want=new Set(sel.map(norm));
    const val=row?.["day"+d];
    if(!val) continue;
    const ts=toks(val);
    for(const t of ts){
      const h=shiftCodeHours?.get?.(t);
      if(h==null) continue;
      if(!want.has(t)) break;
      half += (h===4?1 : h===8?2 : h===12?3 : h===16?4 : 0);
      break;
    }
  }
  return half;
};

const calcRowDPHours=(row,dim,shiftCodeHours,dpCfg)=>{
  let h=0;
  const cfg=dpCfg||{};
  for(let d=1;d<=dim;d++){
    const sel=cfg?.[String(d)]||cfg?.[d];
    if(!Array.isArray(sel)||!sel.length) continue;
    const want=new Set(sel.map(norm));
    const val=row?.["day"+d];if(!val) continue;
    for(const t of toks(val)){
      const hh=Number(shiftCodeHours?.get?.(t));
      if(!Number.isFinite(hh)) continue;
      if(!want.has(t)) break;
      h+=hh;break;
    }
  }
  return h;
};


export const fmtShiftsHalf = (half)=> !half ? "0" : (half%2===0 ? String(half/2) : `${Math.floor(half/2)}.5`);

const calcRowBillCounts=(row,dim,billTokToKey)=>{
  let SICK=0,PH=0,Nights=0;
  for(let d=1;d<=dim;d++){
    const v=row?.["day"+d];
    if(!v) continue;
    for(const t of toks(v)){
      const ent=billTokToKey?.get?.(t);
      if(!ent) continue;
      const key=typeof ent==="string"?ent:ent.key;
      const mult=typeof ent==="object"?(Number(ent.mult)||1):1;
      if(key==="SICK") SICK++;
      else if(key==="PH") PH+=mult;
      else if(key==="Nights") Nights++;
      break;
    }
  }
  return {SICK,PH,Nights};
};

const fmtNum=n=>{const v=Number(n)||0;const x=Math.round(v*10000)/10000;if(Math.abs(x)<1e-12) return "0";return String(x).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1')};

export const computeRowStats=(row,dim,shiftCodeHours,billTokToKey,totalCfg,dpCfg)=>{
  const shiftH=calcRowShiftHours(row,dim,shiftCodeHours);
  const dpH=calcRowDPHours(row,dim,shiftCodeHours,dpCfg);
  const shifts=shiftH/8, dpSh=dpH/8;
  const bc=calcRowBillCounts(row,dim,billTokToKey);
  const bonus=Math.max(0,(shifts-22)*0.5);

  const cfg=totalCfg||{};
  const total=(cfg.Shifts!==false?shifts:0)
    +(cfg.SICK!==false?(bc.SICK||0):0)
    +(cfg.PH!==false?(bc.PH||0):0)
    +(cfg.Nights!==false?(bc.Nights||0):0)
    +(cfg.Bonus!==false?bonus:0)
    +(cfg.DP!==false?dpSh:0);

  return {
    Shifts:fmtNum(shifts),
    SICK:String(bc.SICK||0),
    PH:fmtNum(bc.PH||0),
    Nights:String(bc.Nights||0),
    TOTAL:fmtNum(total),
    Bonus:fmtNum(bonus),
    DP:fmtNum(dpSh),
  };
};

// ---- General date helpers ----
export const getDaysInMonth = (year, month)=> new Date(year, month, 0).getDate();

export const buildWeekdayByDay = (year, month, dim=31)=>{
  const daysInMonth=getDaysInMonth(year,month);
  return Array.from({length:dim},(_,i)=>{
    const d=i+1;
    if(d>daysInMonth) return "";
    return weekdayNamesBg[new Date(year, month-1, d).getDay()] || "";
  });
};

export const monthCodeFrom = (month, year)=>{
  const key=Object.keys(monthsMap).find(k=>monthsMap[k]===month);
  return key ? `${key}${String(year).slice(2)}` : "-";
};

export const buildMonthPickerModel = (codes)=>{
  const monthGroups=new Map();
  for(const code of (codes||[])){
    const p=decodeCode(code);
    if(!p) continue;
    const arr=monthGroups.get(p.year)||[];
    arr.push({ code, month:p.month });
    monthGroups.set(p.year,arr);
  }
  const monthYears=[...monthGroups.keys()].sort((a,b)=>b-a);
  for(const y of monthYears) monthGroups.get(y).sort((a,b)=>a.month-b.month);
  return { monthGroups, monthYears };
};

export const scheduleListToCodes = (list)=>{
  const arr=Array.isArray(list)?list:[];
  return arr.map(s=>monthCodeFrom(s.month,s.year)).filter(Boolean);
};

export const pickClosestCode = (list, now=new Date())=>{
  const arr=Array.isArray(list)?list:[];
  if(!arr.length) return "-";
  const nm=now.getMonth()+1, ny=now.getFullYear();
  let best=arr[0], diff=Infinity;
  for(const s of arr){
    const d=Math.abs((s.year*12+s.month)-(ny*12+nm));
    if(d<diff){ diff=d; best=s; }
  }
  return monthCodeFrom(best.month,best.year);
};

// ---- Schedule (API -> table rows) ----
const staffOf = (e)=> e?.staff || e?.staffMember || null;
const toInt2 = (v)=>{ const n=Number(v); return Number.isFinite(n)?Math.trunc(n):null; };

export const scheduleEntryToCell = (e)=>{
  const sc=e?.shiftCode?.code || "";
  const bc=e?.billCode?.code || "";
  const note=(e?.note ?? "").toString().trim();
  return [sc, bc, note].filter(Boolean).join(" ").trim();
};

export const buildScheduleModel = (apiResp, fallbackMonth, fallbackYear, role)=>{
  const m=apiResp?.month || apiResp?.scheduleMonth || null;
  if(!m && !(fallbackMonth && fallbackYear)) return null;
  const monthId=m?.id ?? apiResp?.monthId ?? null;
  const month=m?.month ?? fallbackMonth;
  const year=m?.year ?? fallbackYear;
  const entries=Array.isArray(apiResp?.entries) ? apiResp.entries : (Array.isArray(m?.entries)?m.entries:[]);
  const statsByStaffId=(apiResp?.statsByStaffId&&typeof apiResp.statsByStaffId==="object")?apiResp.statsByStaffId:{};
  const by=new Map();
  for(const e of entries){
    const st=staffOf(e);
    const staffId=e?.staffId ?? st?.id ?? null;
    if(!staffId) continue;
    const row=by.get(staffId) || { staffId, staff:st, role, monthId };
    const day=toInt2(e?.day);
    if(day) row["day"+day]=scheduleEntryToCell(e);
    by.set(staffId,row);
  }
  const rows=[...by.values()];
  return { monthId, month, year, role, rows, isLocked:!!m?.isLocked, statsByStaffId };
};

export const sortScheduleRows = (rows)=>{
  const arr=Array.isArray(rows)?rows:[];
  return arr.slice().sort((a,b)=>{
    const an=(a.staff?.nickname||a.staff?.lastName||"").toString();
    const bn=(b.staff?.nickname||b.staff?.lastName||"").toString();
    return an.localeCompare(bn,"bg");
  });
};

export const computeCalendarModel = ({dropdownCodes, scheduleApiResp, fallbackMonth, fallbackYear, dc, bills, role})=>{
  const {monthGroups, monthYears}=buildMonthPickerModel(dropdownCodes||[]);
  const schedule=buildScheduleModel(scheduleApiResp, fallbackMonth, fallbackYear, role);
  const dcSorted=getActiveSortedSections(dc);
  const {shiftHours, shiftCodeHours, shiftAutoByHours}=buildShiftAuto(dcSorted);
  const rowsSorted=schedule ? sortScheduleRows(schedule.rows) : [];
  const dim=schedule ? getDaysInMonth(schedule.year, schedule.month) : 31;
  const weekdayByDay=schedule ? buildWeekdayByDay(schedule.year, schedule.month, 31) : Array(31).fill("");
  const dcByDay=buildDcByDay(rowsSorted, dcSorted, 31);
  const lookups=buildCellLookups(dcSorted, bills);
  return {
    monthGroups, monthYears,
    schedule,
    dcSorted,
    shiftHours, shiftCodeHours, shiftAutoByHours,
    rowsSorted,
    daysInMonth: dim,
    weekdayByDay,
    dcByDay,
    lookups,
  };
};

