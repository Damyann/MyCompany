"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {loadMonthly} from "./Performance_Api";

const MON_ROW_STEP=46;
const MON_HEAD_FALLBACK=62;
const MON_OVERSCAN=10;
const fmt=v=>{const n=Number(v)||0,x=Math.round(n*100)/100,s=x.toFixed(2);return s.replace(/\.00$/,"").replace(/(\.\d)0$/,"$1")};
const onKey=(e,fn)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn();}};

function useVirtualRows(count,offsetTop){
  const ref=useRef(null),rafRef=useRef(0);
  const[state,setState]=useState({top:0,height:0});
  const read=useCallback(()=>{
    const el=ref.current;
    if(!el)return;
    const next={top:el.scrollTop,height:el.clientHeight};
    setState(prev=>prev.top===next.top&&prev.height===next.height?prev:next);
  },[]);
  const schedule=useCallback(()=>{
    if(rafRef.current)return;
    rafRef.current=requestAnimationFrame(()=>{rafRef.current=0;read();});
  },[read]);
  useEffect(()=>{
    const el=ref.current;
    if(!el)return;
    read();
    el.addEventListener("scroll",schedule,{passive:true});
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(schedule):null;
    if(ro)ro.observe(el);
    window.addEventListener("resize",schedule,{passive:true});
    return()=>{
      el.removeEventListener("scroll",schedule);
      window.removeEventListener("resize",schedule);
      if(ro)ro.disconnect();
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
    };
  },[schedule,read,count]);
  const usableTop=Math.max(0,state.top-(offsetTop||0));
  const usableHeight=Math.max(MON_ROW_STEP,state.height-(offsetTop||0));
  const start=Math.max(0,Math.floor(usableTop/MON_ROW_STEP)-MON_OVERSCAN);
  const end=Math.min(count,Math.ceil((usableTop+usableHeight)/MON_ROW_STEP)+MON_OVERSCAN);
  return{ref,start,end,offset:start*MON_ROW_STEP,total:count*MON_ROW_STEP};
}

export default function Performance_Monthly({role="DEALER",sel,hasDb,mode="Technical",refreshKey=0,onJumpDay=()=>{}}){
  const headRef=useRef(null);
  const[rows,setRows]=useState([]),[dim,setDim]=useState(31),[loading,setLoading]=useState(false),[msg,setMsg]=useState(""),[headHeight,setHeadHeight]=useState(MON_HEAD_FALLBACK);
  const kind=mode==="Performance"?"PERFORMANCE":"TECHNICAL",isTech=kind==="TECHNICAL";
  useEffect(()=>{(async()=>{if(!sel){setRows([]);setDim(31);return;}setLoading(true);try{setMsg("");const j=await loadMonthly({role,year:sel.year,month:sel.month,kind});setDim(Math.max(28,Math.min(31,Number(j?.daysInMonth)||new Date(sel.year,sel.month,0).getDate())));setRows(Array.isArray(j?.rows)?j.rows:[]);}catch(e){setRows([]);setDim(Math.max(28,Math.min(31,new Date(sel?.year||2000,sel?.month||1,0).getDate())));setMsg(e?.message||"Error");}finally{setLoading(false);}})();},[sel?.year,sel?.month,hasDb,role,kind,refreshKey]);
  useEffect(()=>{
    const update=()=>setHeadHeight(headRef.current?.offsetHeight||MON_HEAD_FALLBACK);
    update();
    const ro=typeof ResizeObserver!=="undefined"&&headRef.current?new ResizeObserver(update):null;
    if(ro)ro.observe(headRef.current);
    window.addEventListener("resize",update,{passive:true});
    return()=>{window.removeEventListener("resize",update);if(ro)ro.disconnect();};
  },[dim,isTech]);
  const days=useMemo(()=>Array.from({length:dim},(_,i)=>i+1),[dim]);
  const totalLabel=isTech?"Technical skills":"Performance";
  const gridStyle=useMemo(()=>({gridTemplateColumns:`var(--mon-name-w) ${isTech?"var(--mon-tech-w)":"var(--mon-perf-w)"} repeat(${dim}, var(--mon-day-w))`}),[dim,isTech]);
  const {ref,start,end,offset,total}=useVirtualRows(rows.length,headHeight);
  const visibleRows=useMemo(()=>rows.slice(start,end),[rows,start,end]);
  if(!sel)return <div className="perf-hint">Избери месец</div>;
  return <div className="perf-monthlyWrap">
    {!hasDb&&<div className="perf-hint">Създай месеца, за да има данни за грешки.</div>}
    {!!msg&&<div className="perf-hint">{msg}</div>}
    {loading?<div className="perf-hint">Loading...</div>:(!rows.length?<div className="perf-empty">Няма</div>:<div ref={ref} className="perf-mon-scroll perf-vscroll">
      <div ref={headRef} className="perf-mon-head" style={gridStyle}>
        <div className="perf-mon-h perf-mon-st1">Име</div>
        <div className={"perf-mon-h perf-mon-st2"+(isTech?" is-stack":"")}>{isTech?<><span>Technical</span><span>skills</span></>:totalLabel}</div>
        {days.map(d=><div key={d} className="perf-mon-h">{d}</div>)}
      </div>
      <div className="perf-vspace perf-mon-vspace" style={{height:total}}>
        <div className="perf-vslice" style={{transform:`translateY(${offset}px)`}}>
          {visibleRows.map(r=>{
            const ds=Array.isArray(r.days)?r.days:[];
            return <div key={r.dealerKey} className="perf-mon-row" style={gridStyle}>
              <div className="perf-mon-c perf-mon-st1 perf-mon-name" title={r.name}>{r.name}</div>
              <div className={"perf-mon-c perf-mon-st2"+((Number(r.total)||0)?"":" is-zero")}><span>{fmt(r.total)}</span></div>
              {days.map((d,i)=>{const raw=Number(ds[i]||0),v=fmt(raw);return <div key={d} className={"perf-mon-c"+(raw?"":" is-zero")} role="button" tabIndex={0} title={`Отвори ${mode} за ден ${d}`} onClick={()=>onJumpDay(d)} onKeyDown={e=>onKey(e,()=>onJumpDay(d))}><span>{v}</span></div>;})}
            </div>;
          })}
        </div>
      </div>
    </div>)}
  </div>;
}
