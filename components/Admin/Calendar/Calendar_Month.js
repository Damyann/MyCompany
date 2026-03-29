"use client";
import {useEffect} from "react";
import Month_Button from "../../Design/Month_Button";
import Calculations_Button from "../../Design/Calculations_Button.jsx";
import Pick_Button from "../../Design/Pick_Button";
export default function Calendar_Month({pickLabel,createOpen,closeCreate,createRef,createCode,setCreateCode,createErr,creating,submitCreate,selected,setSelected,dropdownItems,loadSchedule,openCreate,openCalc,openPicker}){
  useEffect(()=>{if(createOpen)setTimeout(()=>createRef.current?.focus(),0);},[createOpen,createRef]);
  return <><>{createOpen&&<div className="create-box" onMouseDown={closeCreate}><div className="create-window" onMouseDown={e=>e.stopPropagation()}><button type="button" className="modal-x" onClick={closeCreate} aria-label="Close">×</button><h3>Създай График</h3><div className="create-label">Код за месец</div><input ref={createRef} className="create-input" value={createCode} onChange={e=>setCreateCode(e.target.value)} placeholder="Dec25" autoComplete="off"/>{!!createErr&&<div className="create-error">{createErr}</div>}<div className="create-actions"><button type="button" className="create-save" onClick={submitCreate} disabled={creating}>{creating?"...":"Създай"}</button></div></div></div>}</><div className="cal-top-bar"><button className="create-btn" onClick={openCreate}>Създай График</button><Month_Button value={selected} items={dropdownItems} disabled={!dropdownItems?.some(x=>x&&x!=="-")} onChange={code=>{setSelected(code);loadSchedule(code);}} title="ИЗБЕРИ МЕСЕЦ"/><Calculations_Button onClick={openCalc}/><Pick_Button label={`Избери ${pickLabel||"Служител"}`} onClick={openPicker} disabled={false}/></div></>;
}
