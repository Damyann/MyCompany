// components/Admin/Calendar/Calendar.js
"use client";
import{
useEffect,useRef,useState,useLayoutEffect}from"react";
import"./Calendar.css";
import Calendar_Month from"./Calendar_Month";
import Calendar_Pick from"./Calendar_Pick";
import Calendar_Settings from"./Calendar_Settings";
import Calendar_Schedule from"./Calendar_Schedule";

import{
decodeCode,prettyCode,buildScheduleModel,scheduleListToCodes,pickClosestCode,
getDaysInMonth,buildWeekdayByDay,getActiveSortedSections,buildShiftAuto,sortScheduleRows,buildDcByDay
}from"./Calendar_Math";

import{
getCalendarList,getCalendarMonth,getDayCard,getBills,getCalendarSettings,createSchedule,addStaffToMonth,updateCell,
dcSectionReorder,dcSectionCreate,dcSectionUpdate,dcSectionDelete,dcCodeAdd,dcCodeUpdate,dcCodeDelete,
billCodeAdd,billCodeDelete,billCodeUpdate,saveCalendarTotalCfg,getCalendarDP,saveCalendarDP,getCalendarBonus,saveCalendarBonus
}from"./Calendar_Api";

const TAB_ROLE={Dealers:"DEALER",Pitboss:"PITBOSS",QA:"QA",Training:"TRAINING",Support:"SUPPORT",Cleaners:"CLEANERS"};
const TAB_PICK_LABEL={Dealers:"Крупие",Pitboss:"Pitboss",QA:"QA",Training:"Training",Support:"Support",Cleaners:"Cleaners"};

export default function Calendar({calendarTab,getCalendarList:getListProp,getCalendarSchedule:getMonthProp,getDayCard:getDayCardProp,staff,loadingStaff,invalidateCalendarCache}){
const ROLE=TAB_ROLE[calendarTab]||"DEALER";
const pickLabel=TAB_PICK_LABEL[calendarTab]||"Служител";
const days=Array.from({length:31},(_,i)=>i+1),statsLabels=["Shifts","SICK","PH","Nights","TOTAL","Bonus","DP"];
const TOTAL_KEYS=["Shifts","SICK","PH","Bonus","DP"],DEF_TOTAL=Object.fromEntries(TOTAL_KEYS.map(k=>[k,true])),DEF_BONUS={threshold:22};

const[dropdownItems,setDropdownItems]=useState([]),[selected,setSelected]=useState("-"),[schedule,setSchedule]=useState(null);
const[picker,setPicker]=useState(null),[pickTab,setPickTab]=useState("all"),[pickQ,setPickQ]=useState("");
const[activeDay,setActiveDay]=useState(null),[calcOpen,setCalcOpen]=useState(false),[calcTab,setCalcTab]=useState("calc");

const[bills,setBills]=useState([]),[billsErr,setBillsErr]=useState(""),[billsBusy,setBillsBusy]=useState(false);
const[dc,setDc]=useState([]),[dcErr,setDcErr]=useState(""),[dcBusy,setDcBusy]=useState(false);

const[totalCfg,setTotalCfg]=useState(DEF_TOTAL);
const normTotalCfg=v=>Object.fromEntries(TOTAL_KEYS.map(k=>[k,v?.[k]!==false]));
const saveTotalCfgPersist=async up=>{const prev=totalCfg;const next=typeof up==="function"?up(prev):up;const cfg=normTotalCfg(next);setTotalCfg(cfg);try{await saveCalendarTotalCfg(ROLE,cfg);bustAndRefresh();return cfg;}catch(e){setTotalCfg(prev);throw e;}};
useEffect(()=>{let dead=false;(async()=>{try{const j=await getCalendarSettings(ROLE);const cfg=normTotalCfg(j?.settings?.totalCfg||j?.totalCfg);if(!dead)setTotalCfg(cfg);}catch{if(!dead)setTotalCfg(DEF_TOTAL);}})();return()=>{dead=true};},[ROLE]);

const[dpCfg,setDpCfg]=useState({});
const setDpCfgPersist=up=>setDpCfg(prev=>{const next=typeof up==="function"?up(prev):up;const cfg=next&&typeof next==="object"?next:{};const m=schedule?.month,y=schedule?.year;if(m&&y)saveCalendarDP(ROLE,m,y,cfg).then(()=>{bustAndRefresh();}).catch(()=>{});return cfg;});
useEffect(()=>{let dead=false;const m=schedule?.month,y=schedule?.year;if(!m||!y){setDpCfg({});return}(async()=>{try{const j=await getCalendarDP(ROLE,m,y);if(dead)return;setDpCfg(j?.dpCfg||{});}catch{if(!dead)setDpCfg({});}})();return()=>{dead=true};},[ROLE,schedule?.month,schedule?.year]);

const[bonusCfg,setBonusCfg]=useState(DEF_BONUS);
const normBonusCfg=v=>{const raw=v&&typeof v==="object"?(v.threshold??v.bonusThreshold):v;const n=Number(raw),threshold=Number.isFinite(n)?Math.max(0,Math.round(n*2)/2):22,monthWorkdays=Math.max(0,Math.trunc(Number(v?.monthWorkdays)||0)),yearWorkdays=Math.max(0,Math.trunc(Number(v?.yearWorkdays)||0));return{threshold,monthWorkdays,yearWorkdays}};
const saveBonusCfgPersist=async up=>{const prev=bonusCfg;const next=typeof up==="function"?up(prev):up;const cfg=normBonusCfg(next);const m=schedule?.month,y=schedule?.year;setBonusCfg(cfg);try{if(m&&y){await saveCalendarBonus(ROLE,m,y,cfg);bustAndRefresh();}return cfg;}catch(e){setBonusCfg(prev);throw e;}};
useEffect(()=>{let dead=false;const m=schedule?.month,y=schedule?.year;if(!m||!y){setBonusCfg(DEF_BONUS);return}(async()=>{try{const j=await getCalendarBonus(ROLE,m,y);if(dead)return;setBonusCfg(normBonusCfg(j?.bonusCfg));}catch{if(!dead)setBonusCfg(DEF_BONUS);}})();return()=>{dead=true};},[ROLE,schedule?.month,schedule?.year]);

const[dcEdit,setDcEdit]=useState(null),[dcEditCode,setDcEditCode]=useState(""),[dcEditHours,setDcEditHours]=useState(8),[dcEditDel,setDcEditDel]=useState(false),[dcEditConfirm,setDcEditConfirm]=useState(""),[dcEditBusy,setDcEditBusy]=useState(false);

const[createOpen,setCreateOpen]=useState(false),[createCode,setCreateCode]=useState(""),[createErr,setCreateErr]=useState(""),[creating,setCreating]=useState(false);
const[hScrollW,setHScrollW]=useState(0);

const topRef=useRef(null),gridScrollRef=useRef(null),tableRef=useRef(null),hScrollRef=useRef(null),headScrollRef=useRef(null),syncLock=useRef(false),createRef=useRef(null),namesRef=useRef(null);

useEffect(()=>{const el=topRef.current;if(!el)return;const onWheel=e=>{el.scrollLeft+=e.deltaY;e.preventDefault()};el.addEventListener("wheel",onWheel,{passive:false});return()=>el.removeEventListener("wheel",onWheel)},[]);
const fitNames=()=>{const wrap=namesRef.current;if(!wrap)return;const cards=wrap.querySelectorAll("[data-name-card], .name-card");for(const card of cards){const txt=card.querySelector("[data-name-txt], .name-txt");if(!txt)continue;txt.style.display="block";txt.style.width="100%";txt.style.whiteSpace="nowrap";txt.style.overflow="hidden";txt.style.textOverflow="ellipsis";let fs=22,min=9;txt.style.fontSize=fs+"px";for(let i=0;i<80;i++){if(txt.scrollWidth<=txt.clientWidth+1&&txt.scrollHeight<=txt.clientHeight+1)break;fs-=.5;if(fs<min){fs=min;break}txt.style.fontSize=fs+"px"}}};
const reindexSections=list=>(Array.isArray(list)?list:[]).map((s,i)=>({...s,sortOrder:i*10}));

const loadSchedule=async code=>{
  const p=decodeCode(code);if(!p){setSchedule(null);return}
  const j=await(getMonthProp?getMonthProp(p.month,p.year):getCalendarMonth(ROLE,p.month,p.year)).catch(()=>null);
  setSchedule(buildScheduleModel(j||{},p.month,p.year,ROLE));
};

const loadList=async()=>{
  const raw=await(getListProp?getListProp():getCalendarList(ROLE)).catch(()=>null);
  const list=Array.isArray(raw?.months)?raw.months:Array.isArray(raw?.schedules)?raw.schedules:Array.isArray(raw)?raw:[];
  if(!list.length){setDropdownItems(["-"]);setSelected("-");setSchedule(null);return}
  const items=scheduleListToCodes(list);setDropdownItems(items);
  const code=pickClosestCode(list);setSelected(code);await loadSchedule(code);
};

const refreshSchedule=()=>{if(selected&&selected!=="-")loadSchedule(selected).catch(()=>{});};
const bustMonthCache=()=>{invalidateCalendarCache&&invalidateCalendarCache();};
const bustAndRefresh=()=>{bustMonthCache();refreshSchedule();};

const loadDayCard=async force=>{
  setDcErr("");
  try{
    const j=await(getDayCardProp?getDayCardProp(!!force):getDayCard(ROLE));
    const arr=Array.isArray(j?.sections)?j.sections:Array.isArray(j)?j:[];
    const sorted=[...arr].sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)||((a.id||0)-(b.id||0)));
    setDc(reindexSections(sorted.map(s=>({...s,_code:"",_hours:8}))));
  }catch(e){setDcErr(e?.message||"Error");setDc([])}
};

const loadBills=async()=>{
  setBillsErr("");
  try{
    const j=await getBills(ROLE);
    const arr=Array.isArray(j?.bills)?j.bills:Array.isArray(j)?j:[];
    const sorted=[...arr].sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)||((a.id||0)-(b.id||0)));
    setBills(sorted.map(b=>({...b,_code:""})));
  }catch(e){setBillsErr(e?.message||"Error");setBills([])}
};

const persistSectionOrder=async next=>{
  const ids=(Array.isArray(next)?next:[]).filter(x=>typeof x?.id==="number").map(x=>x.id);
  if(ids.length<2)return;
  await dcSectionReorder(ROLE,ids);
};

const dcAddSection=()=>setDc(a=>reindexSections([...a,{id:"new"+Date.now(),name:"",sortOrder:0,isActive:true,codes:[],_code:"",_hours:8,_new:true}]));
const dcSaveSection=async s=>{
  const name=(s.name??"").toString().trim();if(!name)return;
  setDcBusy(true);
  try{
    if(s._new){
      const j=await dcSectionCreate(ROLE,name);
      let next=dc.map(x=>x.id===s.id?{...j.section,codes:[],_code:"",_hours:8,sortOrder:x.sortOrder??0}:x);
      next=reindexSections(next);setDc(next);await persistSectionOrder(next);bustAndRefresh();
    }else{
      const j=await dcSectionUpdate(ROLE,s.id,name);
      setDc(a=>a.map(x=>x.id===s.id?{...x,name:j.section.name}:x));bustAndRefresh();
    }
  }catch(e){alert(e.message)}finally{setDcBusy(false)}
};
const dcDelSection=async s=>{
  if(s._new){setDc(a=>reindexSections(a.filter(x=>x.id!==s.id)));return}
  if(!confirm("Delete section?"))return;
  setDcBusy(true);
  try{
    await dcSectionDelete(ROLE,s.id);
    const next=reindexSections(dc.filter(x=>x.id!==s.id));setDc(next);await persistSectionOrder(next);bustAndRefresh();
  }catch(e){alert(e.message)}finally{setDcBusy(false)}
};
const dcMoveSection=async(sectionId,dir)=>{
  if(dcBusy)return;
  const idx=dc.findIndex(x=>x.id===sectionId);if(idx===-1)return;
  const to=idx+dir;if(to<0||to>=dc.length)return;
  const next=[...dc];const[m]=next.splice(idx,1);next.splice(to,0,m);
  const re=reindexSections(next);setDc(re);
  setDcBusy(true);
  try{await persistSectionOrder(re)}catch(e){alert(e.message);await loadDayCard(1)}finally{setDcBusy(false)}
};
const dcAddCode=async s=>{
  if(typeof s.id!=="number")return alert("Първо Save секцията");
  const codeRaw=(s._code??"").toString().trim();if(!codeRaw)return;
  const hours=Number(s._hours)||8;
  setDcBusy(true);
  try{
    const j=await dcCodeAdd(ROLE,s.id,codeRaw,hours);
    setDc(a=>a.map(x=>x.id===s.id?{...x,codes:[...(x.codes||[]),{id:j.code.id,code:j.code.code,hours:j.code.hours}],_code:""}:x));bustAndRefresh();
  }catch(e){alert(e.message)}finally{setDcBusy(false)}
};
const dcOpenCodeEdit=(sectionId,code)=>{
  setDcEdit({sectionId,codeId:code.id,code:code.code,hours:Number(code.hours)||8});
  setDcEditCode(prettyCode(code.code||""));setDcEditHours(Number(code.hours)||8);
  setDcEditDel(false);setDcEditConfirm("");setDcEditBusy(false);
};
const dcCloseCodeEdit=()=>{if(!dcEditBusy)setDcEdit(null)};
const dcSaveCodeEdit=async()=>{
  if(!dcEdit)return;
  const codeRaw=(dcEditCode??"").toString().trim();if(!codeRaw)return;
  const hours=Number(dcEditHours)||8;
  setDcEditBusy(true);
  try{
    const j=await dcCodeUpdate(ROLE,dcEdit.codeId,codeRaw,hours);
    setDc(a=>a.map(s=>s.id===dcEdit.sectionId?{...s,codes:(s.codes||[]).map(c=>c.id===dcEdit.codeId?{...c,code:j.code.code,hours:j.code.hours}:c)}:s));
    setDcEdit(null);bustAndRefresh();
  }catch(e){alert(e.message)}finally{setDcEditBusy(false)}
};
const dcDeleteCodeEdit=async()=>{
  if(!dcEdit)return;
  if((dcEditConfirm||"").toString().trim().toLowerCase()!=="del")return setDcEditConfirm("type del");
  setDcEditBusy(true);
  try{
    await dcCodeDelete(ROLE,dcEdit.codeId);
    setDc(a=>a.map(s=>s.id===dcEdit.sectionId?{...s,codes:(s.codes||[]).filter(c=>c.id!==dcEdit.codeId)}:s));
    setDcEdit(null);bustAndRefresh();
  }catch(e){alert(e.message)}finally{setDcEditBusy(false)}
};

const billAddCode=async b=>{
  if(!b||typeof b.id!=="number")return;
  if(/^shifts$/i.test((b.name||"").toString().trim()))return;
  const codeRaw=(b._code??"").toString().trim();if(!codeRaw)return;
  setBillsBusy(true);
  try{
    const j=await billCodeAdd(ROLE,b.id,codeRaw);
    setBills(a=>a.map(x=>x.id===b.id?{...x,codes:[...(x.codes||[]),j.code],_code:""}:x));bustAndRefresh();
  }catch(e){alert(e.message)}finally{setBillsBusy(false)}
};
const billDelCode=async(billId,codeId)=>{
  if(!confirm("Del code?"))return;
  setBillsBusy(true);
  try{
    await billCodeDelete(ROLE,codeId);
    setBills(a=>a.map(x=>x.id===billId?{...x,codes:(x.codes||[]).filter(c=>c.id!==codeId)}:x));bustAndRefresh();
  }catch(e){alert(e.message)}finally{setBillsBusy(false)}
};

const billDelCodeDirect=async(billId,codeId)=>{
  setBillsBusy(true);
  try{
    await billCodeDelete(ROLE,codeId);
    setBills(a=>a.map(x=>x.id===billId?{...x,codes:(x.codes||[]).filter(c=>c.id!==codeId)}:x));bustAndRefresh();
  }catch(e){alert(e.message)}finally{setBillsBusy(false)}
};

const billUpdateCode=async(billId,codeId,codeRaw,multiplier)=>{
  const code=(codeRaw??"").toString().trim();if(!code)return;
  setBillsBusy(true);
  try{
    const j=await billCodeUpdate(ROLE,codeId,code, multiplier);
    setBills(a=>a.map(x=>x.id===billId?{...x,codes:(x.codes||[]).map(c=>c.id===codeId?{...c,code:j.code.code,multiplier:j.code.multiplier}:c)}:x));bustAndRefresh();
  }catch(e){alert(e.message)}finally{setBillsBusy(false)}
};

const openCreate=()=>{setCreateErr("");setCreateCode("");setCreateOpen(true)};
const closeCreate=()=>{if(!creating)setCreateOpen(false)};
const submitCreate=async()=>{
  const code=(createCode??"").toString().trim();if(code.length!==5){setCreateErr("Кодът трябва да е 5 символа");return}
  const p=decodeCode(code);if(!p){setCreateErr("Невалиден формат");return}
  setCreateErr("");setCreating(true);
  try{
    await createSchedule(ROLE,p.month,p.year);
    invalidateCalendarCache&&invalidateCalendarCache();
    await loadList();setSelected(code);await loadSchedule(code);setCreateOpen(false);
  }catch(e){setCreateErr(e?.message||"Error")}finally{setCreating(false)}
};

const openCalc=()=>{setCalcTab("calc");setCalcOpen(true)};
const closeCalc=()=>setCalcOpen(false);

const openPicker=()=>{
  if(loadingStaff||!schedule)return;
  const used=new Set((schedule.rows||[]).map(r=>r.staffId));
  setPickTab("all");setPickQ("");
  setPicker(Array.isArray(staff)?staff.filter(d=>!used.has(d.id)):[]);
};

const addStaff=async staffId=>{
  if(!schedule?.monthId)return alert("Първо създай графика за месеца");
  try{
    await addStaffToMonth(ROLE,schedule.monthId,staffId);
    invalidateCalendarCache&&invalidateCalendarCache();
    setPicker(list=>Array.isArray(list)?list.filter(p=>p.id!==staffId):list);
    await loadSchedule(selected);
  }catch(e){alert(e?.message||"Error")}
};

useEffect(()=>{loadList();loadDayCard();loadBills()},[ROLE]);

const dcSorted=getActiveSortedSections(dc);
const {shiftHours,shiftAutoByHours}=buildShiftAuto(dcSorted);
const sortedRows=schedule?.rows?sortScheduleRows(schedule.rows):[];
useLayoutEffect(()=>{const raf=requestAnimationFrame(()=>fitNames());const onR=()=>fitNames();window.addEventListener("resize",onR);return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onR)}},[selected,sortedRows.length]);
useEffect(()=>{if(schedule)setTimeout(()=>fitNames(),0)},[schedule]);

const daysInMonth=schedule?getDaysInMonth(schedule.year,schedule.month):31;
const weekdayByDay=schedule?buildWeekdayByDay(schedule.year,schedule.month,31):days.map(()=>"");
const dcByDay=buildDcByDay(sortedRows,dcSorted,31);
const saveCell=async(staffId,day,raw)=>{
  if(!schedule?.monthId||!staffId||schedule.isLocked)return;
  try{
    const j=await updateCell(ROLE,{monthId:schedule.monthId,staffId,day,raw});bustMonthCache();
    if(j?.stats) setSchedule(s=>!s?s:{...s,statsByStaffId:{...(s.statsByStaffId||{}),[String(staffId)]:j.stats}});
  }catch(e){console.error("Save error:",e?.message||e)}
};

useEffect(()=>{const t=gridScrollRef.current,h=hScrollRef.current,hd=headScrollRef.current,n=namesRef.current,table=tableRef.current;if(!t||!h)return;let raf=0;const upd=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const next=Math.max(1,Math.ceil(Math.max((t.scrollWidth||0)-(t.clientWidth||0)+(h.clientWidth||0),h.clientWidth||0)));setHScrollW(prev=>prev===next?prev:next)})};upd();const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(upd):null;[t,h,hd,n,table].forEach(el=>el&&ro?.observe(el));window.addEventListener("resize",upd,{passive:true});return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",upd);ro&&ro.disconnect()}},[schedule,dc,sortedRows.length,daysInMonth,statsLabels.length]);
useEffect(()=>{const t=gridScrollRef.current,h=hScrollRef.current,hd=headScrollRef.current;if(!t||!h||!hd)return;const setAll=pos=>{t.scrollLeft=pos;const real=t.scrollLeft;h.scrollLeft=real;hd.scrollLeft=real};const syncT=()=>{if(syncLock.current)return;syncLock.current=true;setAll(t.scrollLeft);syncLock.current=false};const syncH=()=>{if(syncLock.current)return;syncLock.current=true;setAll(h.scrollLeft);syncLock.current=false};const syncHD=()=>{if(syncLock.current)return;syncLock.current=true;setAll(hd.scrollLeft);syncLock.current=false};t.addEventListener("scroll",syncT,{passive:true});h.addEventListener("scroll",syncH,{passive:true});hd.addEventListener("scroll",syncHD,{passive:true});syncT();return()=>{t.removeEventListener("scroll",syncT);h.removeEventListener("scroll",syncH);hd.removeEventListener("scroll",syncHD)}},[schedule,dc,hScrollW]);

return(<div className="cal-wrap">
<Calendar_Settings dcEdit={dcEdit} dcCloseCodeEdit={dcCloseCodeEdit} dcEditCode={dcEditCode} setDcEditCode={setDcEditCode} dcEditHours={dcEditHours} setDcEditHours={setDcEditHours} dcEditDel={dcEditDel} setDcEditDel={setDcEditDel} dcEditConfirm={dcEditConfirm} setDcEditConfirm={setDcEditConfirm} dcEditBusy={dcEditBusy} dcSaveCodeEdit={dcSaveCodeEdit} dcDeleteCodeEdit={dcDeleteCodeEdit} calcOpen={calcOpen} closeCalc={closeCalc} calcTab={calcTab} setCalcTab={setCalcTab} dcErr={dcErr} billsErr={billsErr} dc={dc} dcBusy={dcBusy} dcMoveSection={dcMoveSection} setDc={setDc} dcOpenCodeEdit={dcOpenCodeEdit} dcAddCode={dcAddCode} dcSaveSection={dcSaveSection} dcDelSection={dcDelSection} dcAddSection={dcAddSection} loadDayCard={loadDayCard} bills={bills} billsBusy={billsBusy} billDelCode={billDelCode} billDelCodeDirect={billDelCodeDirect} billUpdateCode={billUpdateCode} shiftHours={shiftHours} shiftAutoByHours={shiftAutoByHours} setBills={setBills} billAddCode={billAddCode} loadBills={loadBills} totalCfg={totalCfg} setTotalCfg={saveTotalCfgPersist} dpMonth={schedule?.month||0} dpYear={schedule?.year||0} dpCfg={dpCfg} setDpCfg={setDpCfgPersist} bonusCfg={bonusCfg} setBonusCfg={saveBonusCfgPersist}/>
<Calendar_Month pickLabel={pickLabel} createOpen={createOpen} closeCreate={closeCreate} createRef={createRef} createCode={createCode} setCreateCode={setCreateCode} createErr={createErr} creating={creating} submitCreate={submitCreate} selected={selected} setSelected={setSelected} dropdownItems={dropdownItems} loadSchedule={loadSchedule} openCreate={openCreate} openCalc={openCalc} openPicker={openPicker}/>
<Calendar_Pick title={`Избери ${pickLabel}`} picker={picker} setPicker={setPicker} loading={loadingStaff} pickTab={pickTab} setPickTab={setPickTab} pickQ={pickQ} setPickQ={setPickQ} addStaff={addStaff} month={schedule?.month} year={schedule?.year}/>
<Calendar_Schedule days={days} daysInMonth={daysInMonth} weekdayByDay={weekdayByDay} dcByDay={dcByDay} dcSorted={dcSorted} activeDay={activeDay} setActiveDay={setActiveDay} topRef={topRef} gridScrollRef={gridScrollRef} headScrollRef={headScrollRef} namesRef={namesRef} sortedRows={sortedRows} setSchedule={setSchedule} tableRef={tableRef} saveCell={saveCell} statsByStaffId={schedule?.statsByStaffId||{}} hScrollRef={hScrollRef} hScrollW={hScrollW} statsLabels={statsLabels}/>
</div>);
}
