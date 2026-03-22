// components/Admin/Performance/Performance_Pick.js
"use client";
import {D} from "./Performance_Math";
export default function Performance_Pick({day,onPickDay,nick="",onNick=()=>{}}){
  return(<div className="perf-days-panel"><div className="perf-days-bar">
    <input className="perf-nick" value={nick} onChange={e=>onNick(e.target.value)} placeholder="Прякор:Kai"/>
    <div className="perf-days-scroll">{D.map(n=>(<button key={n} className={"perf-day"+(day===n?" is-active":"")} type="button" onClick={()=>onPickDay(n)}>{n}</button>))}</div>
  </div></div>);
}