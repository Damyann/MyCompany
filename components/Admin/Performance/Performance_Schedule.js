"use client";
import{memo,useCallback,useEffect,useMemo,useRef,useState}from"react";
import{buildCellBoxes,clamp,maxChecksOf}from"./Performance_Math";
import Checkbox from"./Button_Design/Checkbox";

const FALLBACK_METRICS={rowStep:46,headFallback:40,nameWidth:110,checkSize:26,checkGap:3,cellPadX:8,colMaxW:185,labelCharW:13.2};
const DAY_OVERSCAN=10,MAX_MEASURE_RETRIES=8;
const signOf=v=>String(v||"NEGATIVE").trim().toUpperCase()==="POSITIVE"?"POSITIVE":"NEGATIVE";
const cx=(...a)=>a.filter(Boolean).join(" ");
const cellTitle=(item,errorName,maxChecks)=>item.action==="inc"?`${errorName}: +1 (${item.count+1}/${maxChecks})`:item.action==="dec"?`${errorName}: -1 (${item.count-1}/${maxChecks})`:`${errorName}: ${item.count}/${maxChecks}`;
const genderCls=g=>{const v=String(g||"ALL").toUpperCase();return v==="FEMALE"?"perf-namePanel--female":v==="MALE"?"perf-namePanel--male":"";};
const numVar=(styles,name,fallback)=>{const n=parseFloat(styles.getPropertyValue(name).trim());return Number.isFinite(n)?n:fallback;};
const readScheduleMetrics=node=>{if(typeof window==="undefined"||!node)return FALLBACK_METRICS;const styles=getComputedStyle(node);return{rowStep:numVar(styles,"--perf-row-step",FALLBACK_METRICS.rowStep),headFallback:numVar(styles,"--perf-head-fallback-h",FALLBACK_METRICS.headFallback),nameWidth:numVar(styles,"--perf-name-w",FALLBACK_METRICS.nameWidth),checkSize:numVar(styles,"--perf-check-size",FALLBACK_METRICS.checkSize),checkGap:numVar(styles,"--perf-check-gap",FALLBACK_METRICS.checkGap),cellPadX:numVar(styles,"--perf-cell-pad-x",FALLBACK_METRICS.cellPadX),colMaxW:numVar(styles,"--perf-col-max-w",FALLBACK_METRICS.colMaxW),labelCharW:numVar(styles,"--perf-label-char-w",FALLBACK_METRICS.labelCharW)};};
const sameMetrics=(a,b)=>a.rowStep===b.rowStep&&a.headFallback===b.headFallback&&a.nameWidth===b.nameWidth&&a.checkSize===b.checkSize&&a.checkGap===b.checkGap&&a.cellPadX===b.cellPadX&&a.colMaxW===b.colMaxW&&a.labelCharW===b.labelCharW;
const checkboxTrackWidth=(cap,m)=>Math.max(0,Number(cap)||0)*m.checkSize+Math.max(0,Math.max(0,Number(cap)||0)-1)*m.checkGap+m.cellPadX*2;
const fallbackLabelWidth=(txt,m)=>Math.ceil(String(txt||"").trim().toUpperCase().length*m.labelCharW)+m.cellPadX*2;
const fitColWidth=(labelW,checksW,m)=>Math.min(m.colMaxW,Math.max(labelW,checksW));
const colWidthFor=(t,labelMetrics,m)=>{const cap=maxChecksOf(t?.maxChecks),id=String(t?.id??"");return labelMetrics[id]?.col??fitColWidth(fallbackLabelWidth(t?.name,m),checkboxTrackWidth(cap,m),m);};
const measuredTextWidth=(el,fallback)=>{const w=el?Math.ceil(Math.max(el.scrollWidth||0,el.getBoundingClientRect().width||0,el.offsetWidth||0)):0;return w>0?w:Math.max(1,Math.ceil(fallback));};

function useVirtualRows(count,offsetTop,rowStep){
  const ref=useRef(null),rafRef=useRef(0);
  const[state,setState]=useState({top:0,height:0});
  const step=Math.max(1,Math.ceil(rowStep||FALLBACK_METRICS.rowStep));
  const read=useCallback(()=>{const el=ref.current;if(!el)return;const next={top:el.scrollTop,height:el.clientHeight};setState(prev=>prev.top===next.top&&prev.height===next.height?prev:next)},[]);
  const schedule=useCallback(()=>{if(rafRef.current)return;rafRef.current=requestAnimationFrame(()=>{rafRef.current=0;read()})},[read]);
  useEffect(()=>{const el=ref.current;if(!el)return;read();el.addEventListener("scroll",schedule,{passive:true});const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(schedule):null;if(ro)ro.observe(el);window.addEventListener("resize",schedule,{passive:true});return()=>{el.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);if(ro)ro.disconnect();if(rafRef.current)cancelAnimationFrame(rafRef.current)}},[count,read,schedule,step]);
  const usableTop=Math.max(0,state.top-(offsetTop||0)),usableHeight=Math.max(step,state.height-(offsetTop||0));
  const start=Math.max(0,Math.floor(usableTop/step)-DAY_OVERSCAN),end=Math.min(count,Math.ceil((usableTop+usableHeight)/step)+DAY_OVERSCAN);
  return{ref,start,end,offset:start*step,total:count*step};
}

const ScheduleCell=memo(function ScheduleCell({dealerKey,errorTypeId,errorName,count,sign,maxChecks,onSetCount}){
  const cap=maxChecksOf(maxChecks),safeCount=clamp(count,0,cap),items=useMemo(()=>buildCellBoxes(safeCount,cap),[cap,safeCount]);
  const inc=useCallback(()=>safeCount<cap&&onSetCount(dealerKey,errorTypeId,safeCount+1),[cap,dealerKey,errorTypeId,onSetCount,safeCount]);
  const dec=useCallback(()=>safeCount>0&&onSetCount(dealerKey,errorTypeId,safeCount-1),[dealerKey,errorTypeId,onSetCount,safeCount]);
  return(
    <div className={cx("perf-cell",sign==="POSITIVE"?"is-pos":"is-neg")}>
      <div className="perf-checks">
        <div className="perf-checkgrid" style={{"--perf-check-count":String(cap)}}>
          {items.map(item=><Checkbox key={item.key} state={item.kind} lock={!item.action} title={cellTitle(item,errorName,cap)} onClick={item.action==="inc"?inc:item.action==="dec"?dec:undefined}/>) }
        </div>
      </div>
    </div>
  );
});

const ScheduleRow=memo(function ScheduleRow({person,dayErrTypes,entryMap,gridVars,onSetCount}){
  const dealerKey=String(person?.id||"");
  return(
    <div className="perf-matrix-row" style={gridVars}>
      <div className="perf-nameCell" title={person?.name||dealerKey}><div className={cx("perf-namePanel",genderCls(person?.gender))}><span className="perf-stickyTxt">{person?.name||dealerKey}</span></div></div>
      {dayErrTypes.length?dayErrTypes.map(t=>{const count=entryMap.get(dealerKey)?.get(Number(t.id))||0;return <ScheduleCell key={t.id} dealerKey={dealerKey} errorTypeId={t.id} errorName={t.name} count={count} sign={signOf(t?.scoreSign)} maxChecks={t?.maxChecks} onSetCount={onSetCount}/>;}):<div className="perf-cell" />}
    </div>
  );
});

export default function Performance_Schedule({active=true,hasDb,loading,onShift=[],dayErrTypes=[],dayEntries=[],onSetCount=()=>{}}){
  const shellRef=useRef(null),headRef=useRef(null),measureRefs=useRef(new Map()),measureRafRef=useRef(0),measureRetryRef=useRef(0),resizeObsRef=useRef(null);
  const[metrics,setMetrics]=useState(FALLBACK_METRICS),[headHeight,setHeadHeight]=useState(FALLBACK_METRICS.headFallback),[labelMetrics,setLabelMetrics]=useState({});
  const setMeasureRef=useCallback((id,node)=>{const k=String(id);if(node)measureRefs.current.set(k,node);else measureRefs.current.delete(k)},[]);
  const syncMetrics=useCallback(()=>{const el=shellRef.current||headRef.current;if(!el)return false;const next=readScheduleMetrics(el);let changed=false;setMetrics(prev=>{changed=!sameMetrics(prev,next);return changed?next:prev});return changed},[]);
  const measureLabelWidths=useCallback(()=>{let allReady=true;setLabelMetrics(prev=>{let changed=Object.keys(prev).length!==dayErrTypes.length;const next={};for(const t of dayErrTypes||[]){const id=String(t?.id??""),fallbackText=fallbackLabelWidth(t?.name,metrics)-metrics.cellPadX*2,el=measureRefs.current.get(id),textW=measuredTextWidth(el,fallbackText),hasLiveWidth=!!el&&textW>1&&Math.max(el.scrollWidth||0,el.getBoundingClientRect().width||0,el.offsetWidth||0)>0,checksW=checkboxTrackWidth(t?.maxChecks,metrics),col=fitColWidth(textW+metrics.cellPadX*2,checksW,metrics),wrap=textW+metrics.cellPadX*2>col;next[id]={col,wrap};if(prev[id]?.col!==col||prev[id]?.wrap!==wrap)changed=true;if(el&&!hasLiveWidth)allReady=false;}return changed?next:prev});return allReady},[dayErrTypes,metrics]);
  const syncHeadHeight=useCallback(()=>setHeadHeight(prev=>{const next=headRef.current?.offsetHeight||Math.ceil(metrics.headFallback);return prev===next?prev:next}),[metrics.headFallback]);
  const runMeasure=useCallback(({retry=0}={})=>{if(typeof window==="undefined")return;const shell=shellRef.current;if(!shell||!active||loading)return;const visible=shell.offsetParent!==null&&shell.clientWidth>0&&shell.clientHeight>0;if(!visible){if(retry<MAX_MEASURE_RETRIES)measureRafRef.current=requestAnimationFrame(()=>runMeasure({retry:retry+1}));return;}syncMetrics();syncHeadHeight();const ready=measureLabelWidths();if(!ready&&retry<MAX_MEASURE_RETRIES)measureRafRef.current=requestAnimationFrame(()=>runMeasure({retry:retry+1}));else measureRetryRef.current=0;},[active,loading,measureLabelWidths,syncHeadHeight,syncMetrics]);
  const scheduleMeasure=useCallback(()=>{if(measureRafRef.current)cancelAnimationFrame(measureRafRef.current);measureRafRef.current=requestAnimationFrame(()=>requestAnimationFrame(()=>runMeasure()));},[runMeasure]);
  const entryMap=useMemo(()=>{const m=new Map();for(const x of dayEntries||[]){const dk=String(x?.dealerKey??""),et=Number(x?.errorTypeId),c=Math.max(0,Number(x?.count)||0);if(!dk||!Number.isFinite(et))continue;if(!m.has(dk))m.set(dk,new Map());m.get(dk).set(et,c)}return m},[dayEntries]);
  const colWidths=useMemo(()=>dayErrTypes.length?dayErrTypes.map(t=>colWidthFor(t,labelMetrics,metrics)):[checkboxTrackWidth(6,metrics)],[dayErrTypes,labelMetrics,metrics]);
  const gridVars=useMemo(()=>({"--perf-grid-cols":[`${Math.ceil(metrics.nameWidth)}px`,...colWidths.map(w=>`${Math.ceil(w)}px`)].join(" ")}),[colWidths,metrics.nameWidth]);
  useEffect(()=>{if(!active||loading)return;if(typeof window==="undefined")return;scheduleMeasure();const onResize=()=>scheduleMeasure();window.addEventListener("resize",onResize,{passive:true});const ready=typeof document!=="undefined"&&document.fonts&&document.fonts.ready&&typeof document.fonts.ready.then==="function"?document.fonts.ready:null;if(ready)ready.then(()=>scheduleMeasure()).catch(()=>{});const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>scheduleMeasure()):null;resizeObsRef.current=ro;if(ro){if(shellRef.current)ro.observe(shellRef.current);if(headRef.current)ro.observe(headRef.current);}return()=>{window.removeEventListener("resize",onResize);if(ro)ro.disconnect();resizeObsRef.current=null;if(measureRafRef.current){cancelAnimationFrame(measureRafRef.current);measureRafRef.current=0;}}},[active,loading,dayErrTypes,metrics.nameWidth,scheduleMeasure]);
  useEffect(()=>{if(active&&!loading)scheduleMeasure();},[active,loading,onShift.length,dayErrTypes,scheduleMeasure]);
  useEffect(()=>{syncHeadHeight();},[colWidths,syncHeadHeight]);
  const{ref,start,end,offset,total}=useVirtualRows(onShift.length,headHeight,metrics.rowStep),visibleRows=useMemo(()=>onShift.slice(start,end),[onShift,start,end]),vspaceVars=useMemo(()=>({"--perf-vh":`${total}px`}),[total]),vsliceVars=useMemo(()=>({"--perf-vy":`${offset}px`}),[offset]);
  if(loading)return <div className="perf-hint">Loading...</div>;
  return(
    <div ref={shellRef} className="perf-box perf-boxSchedule">
      {!hasDb&&<div className="perf-hint">Създай месеца, за да записваш грешки.</div>}
      {hasDb&&!dayErrTypes.length&&<div className="perf-hint">Няма активни грешки за месеца.</div>}
      {!onShift.length?<div className="perf-empty">Няма хора за деня.</div>:<div className="perf-matrix-shell">
        <div ref={ref} className="perf-matrix-scroll perf-vscroll">
          <div className="perf-matrix-canvas">
            {!!dayErrTypes.length&&<div aria-hidden className="perf-matrix-measure">{dayErrTypes.map(t=><span key={`measure-${t.id}`} ref={node=>setMeasureRef(t.id,node)} className="perf-mhMeasureText">{t.name}</span>)}</div>}
            <div ref={headRef} className="perf-matrix-head" style={gridVars}>
              <div className="perf-mh perf-mhName"><div className="perf-namePanel perf-namePanel--head"><span className="perf-stickyTxt">Имена:</span></div></div>
              {dayErrTypes.length?dayErrTypes.map(t=>{const sign=signOf(t?.scoreSign),cap=maxChecksOf(t?.maxChecks),wrap=!!labelMetrics[String(t?.id??"")]?.wrap;return <div key={t.id} className={cx("perf-mh","perf-mhErr",sign==="POSITIVE"?"is-pos":"is-neg")} title={`${t.name} (${cap})`}><span className={cx("perf-mhLabel",sign==="POSITIVE"?"is-pos":"is-neg",wrap&&"is-wrap")}>{t.name}</span></div>;}):<div className="perf-mh perf-mhErr"><span className="perf-mhLabel">Грешка</span></div>}
            </div>
            <div className="perf-vspace" style={vspaceVars}>
              <div className="perf-vslice" style={vsliceVars}>
                {visibleRows.map(person=><ScheduleRow key={person.id} person={person} dayErrTypes={dayErrTypes} entryMap={entryMap} gridVars={gridVars} onSetCount={onSetCount}/>) }
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
