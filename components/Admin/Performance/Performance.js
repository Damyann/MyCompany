"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import "./Performance.css";
import {codeOf,parseCode,closest,clamp,COUNT_CAP,maxChecksOf} from "./Performance_Math";
import {apiPost,invalidatePerformanceCache,listMonths,loadDay as apiLoadDay,setEntryCount} from "./Performance_Api";
import Performance_Pick from "./Performance_Pick";
import Performance_Schedule from "./Performance_Schedule";
import Performance_Errors from "./Performance_Errors";
import Performance_Monthly from "./Performance_Monthly";
import Scoreboard from "./Scoreboard";

export default function Performance({active=true}={}){
  const[tab,setTab]=useState("Days"),[mode,setMode]=useState("Technical"),[nick,setNick]=useState(""),[sbNick,setSbNick]=useState(""),[sbGender,setSbGender]=useState("ALL"),[showSbSettings,setShowSbSettings]=useState(false);
  const[months,setMonths]=useState([]),[monthCode,setMonthCode]=useState(""),[hasDb,setHasDb]=useState(false),[day,setDay]=useState(1),[refreshKey,setRefreshKey]=useState(0);
  const[onShift,setOnShift]=useState([]),[dayErrTypes,setDayErrTypes]=useState([]),[dayEntries,setDayEntries]=useState([]);
  const[loadingMonths,setLoadingMonths]=useState(true),[loadingDay,setLoadingDay]=useState(false),[msg,setMsg]=useState("");
  const[showErr,setShowErr]=useState(false),[errInitScope,setErrInitScope]=useState("global");
  const sel=useMemo(()=>parseCode(monthCode),[monthCode]),kind=mode==="Performance"?"PERFORMANCE":"TECHNICAL",isDays=tab==="Days",isScoreboard=tab==="Scoreboard",showMode=isDays||tab==="Monthly";
  const saveTimers=useRef(new Map()),dead=useRef(false),loadingRef=useRef(false),busyUntil=useRef(0),dayRef=useRef(1),monthCodeRef=useRef("");

  const loadMonthsUI=useCallback(async()=>{
    setLoadingMonths(true);
    try{
      setMsg("");
      const list=await listMonths("DEALER");
      setMonths(list);
      const cur=parseCode(monthCodeRef.current),keep=cur&&list.some(x=>x.year===cur.year&&x.month===cur.month),c=keep?cur:closest(list);
      const nextCode=c?codeOf(c.month,c.year):"";
      setMonthCode(nextCode);
      const m=c?list.find(x=>x.year===c.year&&x.month===c.month):null;
      setHasDb(!!m?.hasDb);
      if(!c){setHasDb(false);setDay(1);setOnShift([]);setDayErrTypes([]);setDayEntries([]);}
    }catch(e){
      setMonths([]);setMonthCode("");setHasDb(false);setDay(1);setOnShift([]);setDayErrTypes([]);setDayEntries([]);setMsg(e?.message||"Error");
    }finally{setLoadingMonths(false);}
  },[]);

  const loadDayUI=useCallback(async(nextDay=dayRef.current,{force=false}={})=>{
    if(!sel)return;
    const target=Math.max(1,Number(nextDay)||dayRef.current||1);
    setLoadingDay(true);
    try{
      setMsg("");
      const j=await apiLoadDay({role:"DEALER",year:sel.year,month:sel.month,day:target,kind,force});
      setHasDb(!!j?.hasDb);
      setOnShift(j?.onShift||[]);
      setDayErrTypes(j?.errorTypes||[]);
      setDayEntries(j?.entries||[]);
    }catch(e){
      setOnShift([]);setDayErrTypes([]);setDayEntries([]);setMsg(e?.message||"Error");
    }finally{setLoadingDay(false);}
  },[kind,sel]);

  const reloadAfterError=useCallback(async(nextDay=day)=>{
    const target=Math.max(1,Number(nextDay)||day||1);
    try{if(sel)await loadDayUI(target,{force:false});}
    finally{setRefreshKey(v=>v+1);}
  },[day,loadDayUI,sel]);

  const createMonth=useCallback(async()=>{
    if(!sel)return;
    setMsg("");
    try{
      await apiPost({action:"createMonth",role:"DEALER",year:sel.year,month:sel.month});
      invalidatePerformanceCache({role:"DEALER",year:sel.year,month:sel.month});
      await loadMonthsUI();
      setDay(1);
      await loadDayUI(1,{force:false});
      setHasDb(true);
      setRefreshKey(v=>v+1);
    }catch(e){setMsg(e?.message||"Error");}
  },[loadDayUI,loadMonthsUI,sel]);

  const scheduleSaveEntry=useCallback((dealerKey,errorTypeId,count)=>{
    if(!sel)return;
    const key=`${kind}:${dealerKey}:${errorTypeId}`,prev=saveTimers.current.get(key);
    if(prev?.t)clearTimeout(prev.t);
    const t=setTimeout(async()=>{
      try{await setEntryCount({role:"DEALER",year:sel.year,month:sel.month,day,kind,dealerKey,errorTypeId,count});}
      catch(e){setMsg(e?.message||"Error");await loadDayUI(day,{force:true});}
      if(dead.current)return;
      saveTimers.current.delete(key);
    },180);
    saveTimers.current.set(key,{t,count});
  },[day,kind,loadDayUI,sel]);

  const errTypeMaxMap=useMemo(()=>new Map((dayErrTypes||[]).map(t=>[Number(t?.id),maxChecksOf(t?.maxChecks)])),[dayErrTypes]);

  const setEntryCountLocal=useCallback((dealerKey,errorTypeId,newCount)=>{
    if(!hasDb||!sel)return;
    const dKey=String(dealerKey),eId=Number(errorTypeId),c=clamp(Number(newCount)||0,0,errTypeMaxMap.get(eId)||COUNT_CAP);
    setDayEntries(list=>{
      let found=false,next=[];
      for(const it of list||[]){
        const match=String(it?.dealerKey)===dKey&&Number(it?.errorTypeId)===eId;
        if(!match){next.push(it);continue;}
        found=true;
        if(c>0)next.push({...it,count:c});
      }
      if(!found&&c>0)next.push({dealerKey:dKey,errorTypeId:eId,count:c});
      scheduleSaveEntry(dKey,eId,c);
      return next;
    });
  },[errTypeMaxMap,hasDb,scheduleSaveEntry,sel]);

  const markBusy=useCallback(()=>{busyUntil.current=Date.now()+1500;},[]);

  const onShiftFiltered=useMemo(()=>{
    const q=nick.trim().toLowerCase();
    if(!q)return onShift;
    return(onShift||[]).filter(p=>String(p?.name||"").toLowerCase().includes(q));
  },[onShift,nick]);

  useEffect(()=>{loadingRef.current=loadingDay;},[loadingDay]);
  useEffect(()=>{monthCodeRef.current=monthCode;},[monthCode]);
  useEffect(()=>{dayRef.current=day;},[day]);
  useEffect(()=>{loadMonthsUI();},[loadMonthsUI]);
  useEffect(()=>{
    if(!months.length||!sel)return;
    const m=months.find(x=>x.year===sel.year&&x.month===sel.month);
    setHasDb(!!m?.hasDb);
  },[months,sel?.year,sel?.month]);
  useEffect(()=>{
    if(!sel)return;
    setDay(1);
    if(isDays)loadDayUI(1);
  },[isDays,loadDayUI,sel?.year,sel?.month]);
  useEffect(()=>{
    if(sel&&isDays)loadDayUI(dayRef.current);
  },[kind,isDays,loadDayUI,sel]);
  useEffect(()=>{
    if(!isDays&&showErr)setShowErr(false);
  },[isDays,showErr]);
  useEffect(()=>{
    if(!isScoreboard&&showSbSettings)setShowSbSettings(false);
  },[isScoreboard,showSbSettings]);
  useEffect(()=>{setSbNick("");setSbGender("ALL");},[sel?.year,sel?.month]);
  useEffect(()=>{
    if(!active||!isDays||!sel)return;
    const tick=()=>{if(dead.current||loadingRef.current||saveTimers.current.size||Date.now()<busyUntil.current)return;loadDayUI(day);};
    tick();
    const t=setInterval(tick,45000),f=()=>tick(),v=()=>{if(document.visibilityState==="visible")tick();};
    window.addEventListener("focus",f);
    document.addEventListener("visibilitychange",v);
    return()=>{clearInterval(t);window.removeEventListener("focus",f);document.removeEventListener("visibilitychange",v);};
  },[active,day,isDays,kind,loadDayUI,sel]);

  useEffect(()=>()=>{dead.current=true;for(const v of saveTimers.current.values())if(v?.t)clearTimeout(v.t);saveTimers.current.clear();},[]);

  return(
    <div className="perf-wrap">
      <div className="perf-top-bar">
        <div className="perf-seg">
          <button className={"perf-seg-btn"+(tab==="Scoreboard"?" is-active":"")} onClick={()=>setTab("Scoreboard")}>Scoreboard</button>
          <button className={"perf-seg-btn"+(tab==="Monthly"?" is-active":"")} onClick={()=>setTab("Monthly")}>Monthly</button>
          <button className={"perf-seg-btn"+(tab==="Days"?" is-active":"")} onClick={()=>setTab("Days")}>Days</button>
        </div>
        <button className="perf-create" onClick={createMonth} disabled={!sel||hasDb}>Създай месец</button>
        {isDays&&<button className="perf-create" onClick={()=>{setErrInitScope(hasDb?"month":"global");setShowErr(true);}} disabled={loadingMonths||!months.length}>Грешки</button>}
        <select className="perf-month" value={monthCode} onChange={e=>setMonthCode(e.target.value)} disabled={loadingMonths||!months.length}>
          {!months.length?<option value="">No months</option>:months.slice().sort((a,b)=>(b.year-a.year)||(b.month-a.month)).map(s=>{const c=codeOf(s.month,s.year);return(<option key={c} value={c}>{c}</option>);})}
        </select>
        {showMode&&(
          <div className="perf-mode">
            <button type="button" className={"perf-mode-btn"+(mode==="Technical"?" is-active":"")} onClick={()=>setMode("Technical")}>Technical</button>
            <button type="button" className={"perf-mode-btn"+(mode==="Performance"?" is-active":"")} onClick={()=>setMode("Performance")}>Performance</button>
          </div>
        )}
        {isScoreboard&&<div className="perf-sb-topTools">
          <button type="button" className={"perf-btn2 perf-sb-settingsBtn"+(showSbSettings?" is-open":"")} onClick={()=>setShowSbSettings(v=>!v)} disabled={!sel||!hasDb}>{showSbSettings?"Затвори настройки":"Настройки"}</button>
          <input className="perf-inp perf-sb-topFilter" value={sbNick} onChange={e=>setSbNick(e.target.value)} placeholder="Псевдоним" autoComplete="off" aria-label="Филтър по прякор" disabled={!sel||!hasDb}/>
          <select className="perf-sb-topSelect" value={sbGender} onChange={e=>setSbGender(e.target.value)} aria-label="Филтър по пол" disabled={!sel||!hasDb}>
            <option value="ALL">Всички</option>
            <option value="FEMALE">Момичета</option>
            <option value="MALE">Момчета</option>
          </select>
        </div>}
      </div>

      {isDays&&<Performance_Pick day={day} onPickDay={n=>{setDay(n);loadDayUI(n);}} nick={nick} onNick={setNick}/>}

      <div className={"perf-body"+((isDays||tab==="Monthly")?" is-contained":"")} onScrollCapture={markBusy} onWheelCapture={markBusy} onTouchMoveCapture={markBusy}>
        {!!msg&&<div className="perf-hint">{msg}</div>}
        {isDays&&<Performance_Schedule active={active&&isDays&&tab==="Days"} hasDb={hasDb} loading={loadingDay} onShift={onShiftFiltered} dayErrTypes={dayErrTypes} dayEntries={dayEntries} onSetCount={setEntryCountLocal}/>}        
        {tab==="Monthly"&&<Performance_Monthly role="DEALER" sel={sel} hasDb={hasDb} mode={mode} refreshKey={refreshKey} onJumpDay={d=>{setDay(d);setTab("Days");loadDayUI(d);}}/>}
        {isScoreboard&&<Scoreboard role="DEALER" sel={sel} hasDb={hasDb} refreshKey={refreshKey} settingsOpen={showSbSettings} onCloseSettings={()=>setShowSbSettings(false)} nickFilter={sbNick} genderFilter={sbGender}/>}
      </div>

      {isDays&&<Performance_Errors open={showErr} onClose={()=>setShowErr(false)} initialScope={errInitScope} role="DEALER" mode={mode} monthCode={monthCode} sel={sel} hasDb={hasDb} day={day} onReloadDay={reloadAfterError}/>}
    </div>
  );
}
