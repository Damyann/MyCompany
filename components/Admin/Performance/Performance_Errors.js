"use client";
import{useEffect,useMemo,useRef,useState}from"react";
import{apiPost,listErrorsGlobal,listErrorsMonth,syncMonthErrorsFromGlobal}from"./Performance_Api";
import Delete_Button from"./Button_Design/Delete_Button.jsx";
import{maxChecksOf}from"./Performance_Math";

const toNum=v=>{const s=String(v??"").trim().replace(",", ".");const n=Number(s);return Number.isFinite(n)?n:1;};
const toChecks=v=>maxChecksOf(v);
const fmt=v=>{const n=Number(v)||0,x=Math.round(n*100)/100,s=x.toFixed(2);return s.replace(/\.00$/,'').replace(/(\.\d)0$/,'$1')};
const signOf=v=>{const raw=v&&typeof v==="object"?(v.scoreSign??v.sign??(v.isPositive===true||v.positive===true?"POSITIVE":v.isNegative===true||v.negative===true?"NEGATIVE":null)):v;if(raw===true||raw===1)return"POSITIVE";if(raw===false||raw===0)return"NEGATIVE";const s=String(raw??"").trim().toUpperCase();return["POSITIVE","POS","PLUS","+","TRUE","1"].includes(s)?"POSITIVE":"NEGATIVE";};
const signMeta=v=>signOf(v)==="POSITIVE"?{key:"POSITIVE",label:"Положителна",cls:"is-pos"}:{key:"NEGATIVE",label:"Отрицателна",cls:"is-neg"};
const signOptions=[signMeta("NEGATIVE"),signMeta("POSITIVE")];
const cleanChecksInput=v=>{const d=String(v??"").replace(/\D+/g,"");if(!d)return"";const n=Math.min(12,Math.max(1,parseInt(d,10)||1));return String(n);};
const rowOf=(x,scope)=>({id:Number(x?.id),name:String(x?.name||""),weight:Number(x?.weight??1),maxChecks:toChecks(x?.maxChecks),active:scope==="month"?!!x?.active:undefined,scoreSign:signOf(x)});
const SignDropdown=({value,onChange,disabled,className=""})=>{const[open,setOpen]=useState(false);const ref=useRef(null),active=signMeta(value);useEffect(()=>{if(!open)return;const onPointer=e=>{if(!ref.current?.contains(e.target))setOpen(false);},onKey=e=>{if(e.key==="Escape")setOpen(false);};document.addEventListener("pointerdown",onPointer);document.addEventListener("keydown",onKey);return()=>{document.removeEventListener("pointerdown",onPointer);document.removeEventListener("keydown",onKey);};},[open]);useEffect(()=>{if(disabled)setOpen(false);},[disabled]);return(<div ref={ref} className={`perf-signDd ${active.cls} ${className}`.trim()}><button type="button" className={`perf-signDdBtn ${active.cls}${open?" is-open":""}`} onClick={()=>!disabled&&setOpen(v=>!v)} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}><span className="perf-signDdDot" aria-hidden="true"/><span className="perf-signDdText">{active.label}</span><span className="perf-signDdCaret" aria-hidden="true"/></button>{open&&<div className="perf-signDdMenu" role="listbox" aria-label="Тип грешка">{signOptions.map(x=><button key={x.key} type="button" className={`perf-signDdItem ${x.cls}${value===x.key?" is-active":""}`} onClick={()=>{onChange(x.key);setOpen(false);}} role="option" aria-selected={value===x.key}><span className="perf-signDdDot" aria-hidden="true"/><span>{x.label}</span></button>)}</div>}</div>)};
const signRank=v=>signOf(v)==="POSITIVE"?0:1;
const sortRows=list=>(Array.isArray(list)?list:[]).slice().sort((a,b)=>(signRank(a)-signRank(b))||((Number(a?.weight)||0)-(Number(b?.weight)||0))||String(a?.name||"").localeCompare(String(b?.name||""),"bg",{sensitivity:"base"}));

export default function Performance_Errors({open,onClose,initialScope="global",role="DEALER",mode="Technical",monthCode,sel,hasDb,day,onReloadDay}){
  const kind=useMemo(()=>mode==="Performance"?"PERFORMANCE":"TECHNICAL",[mode]);
  const[scope,setScope]=useState(initialScope),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const[addName,setAddName]=useState(""),[addWeight,setAddWeight]=useState(1),[addMaxChecks,setAddMaxChecks]=useState(6),[addSign,setAddSign]=useState("NEGATIVE"),[rows,setRows]=useState([]);
  const[actionOpen,setActionOpen]=useState(false),[actionItem,setActionItem]=useState(null);
  const[editOpen,setEditOpen]=useState(false),[editItem,setEditItem]=useState(null),[editName,setEditName]=useState(""),[editWeight,setEditWeight]=useState(1),[editMaxChecks,setEditMaxChecks]=useState(6),[editSign,setEditSign]=useState("NEGATIVE");
  const[delOpen,setDelOpen]=useState(false),[delItem,setDelItem]=useState(null),[delText,setDelText]=useState("");

  const closeAction=()=>{setActionOpen(false);setActionItem(null);};
  const closeEdit=()=>{setEditOpen(false);setEditItem(null);setEditName("");setEditWeight(1);setEditMaxChecks(6);setEditSign("NEGATIVE");};
  const closeDelete=()=>{setDelOpen(false);setDelItem(null);setDelText("");};
  const safeClose=()=>{closeAction();closeEdit();closeDelete();onClose?.();};

  const load=async(nextScope=scope)=>{
    setMsg("");setLoading(true);
    try{
      if(nextScope==="global"){const j=await listErrorsGlobal(role,kind);setRows(sortRows((Array.isArray(j?.errorTypes)?j.errorTypes:[]).map(x=>rowOf(x,"global"))));return;}
      if(!sel){setRows([]);return;}
      if(!hasDb){setRows([]);setMsg("Създай месеца първо, за да активираш грешки за него.");return;}
      await syncMonthErrorsFromGlobal({role,year:sel.year,month:sel.month,kind,overwrite:false}).catch(()=>null);
      const j=await listErrorsMonth({role,year:sel.year,month:sel.month,kind});
      setRows(sortRows((Array.isArray(j?.errorTypes)?j.errorTypes:[]).map(x=>rowOf(x,"month"))));
    }catch(e){setRows([]);setMsg(e?.message||"Error");}
    finally{setLoading(false);}
  };

  const addGlobal=async()=>{
    const name=String(addName||"").trim();if(!name||busy||loading)return;
    setMsg("");setBusy(true);
    try{
      await apiPost({action:"addGlobalErrorType",role,kind,name,weight:toNum(addWeight),maxChecks:toChecks(addMaxChecks),scoreSign:addSign});
      setAddName("");setAddWeight(1);setAddMaxChecks(6);setAddSign("NEGATIVE");
      if(sel&&hasDb)await syncMonthErrorsFromGlobal({role,year:sel.year,month:sel.month,kind,overwrite:false}).catch(()=>null);
      await load("global");
      if(sel&&hasDb&&onReloadDay)await onReloadDay(day);
    }catch(e){setMsg(e?.message||"Error");}
    setBusy(false);
  };

  const openRow=r=>{if(scope==="global"){setActionItem(r);setActionOpen(true);return;}setEditItem(r);setEditOpen(true);setEditName(String(r?.name||""));setEditWeight(r?.weight??1);setEditMaxChecks(toChecks(r?.maxChecks));setEditSign(signOf(r));};
  const openEditGlobal=()=>{if(!actionItem)return;setEditItem(actionItem);setEditOpen(true);setEditName(String(actionItem?.name||""));setEditWeight(actionItem?.weight??1);setEditMaxChecks(toChecks(actionItem?.maxChecks));setEditSign(signOf(actionItem));closeAction();};
  const openDeleteGlobal=()=>{if(!actionItem)return;setDelItem(actionItem);setDelOpen(true);setDelText("");closeAction();};

  const saveGlobal=async()=>{
    if(!editItem||scope!=="global"||busy||loading)return;
    const name=String(editName||"").trim();if(!name)return;
    setMsg("");setBusy(true);
    try{
      await apiPost({action:"editGlobalErrorType",id:editItem.id,name,weight:toNum(editWeight),maxChecks:toChecks(editMaxChecks),scoreSign:editSign});
      closeEdit();
      if(sel&&hasDb)await syncMonthErrorsFromGlobal({role,year:sel.year,month:sel.month,kind,overwrite:false}).catch(()=>null);
      await load("global");
      if(sel&&hasDb&&onReloadDay)await onReloadDay(day);
    }catch(e){setMsg(e?.message||"Error");}
    setBusy(false);
  };

  const deleteGlobal=async()=>{
    if(!delItem||busy||loading)return;
    if(String(delText||"").trim().toLowerCase()!=="del")return;
    setMsg("");setBusy(true);
    try{
      await apiPost({action:"deleteGlobalErrorType",id:delItem.id});
      closeDelete();
      if(sel&&hasDb)await syncMonthErrorsFromGlobal({role,year:sel.year,month:sel.month,kind,overwrite:false}).catch(()=>null);
      await load("global");
      if(sel&&hasDb&&onReloadDay)await onReloadDay(day);
    }catch(e){setMsg(e?.message||"Error");}
    setBusy(false);
  };

  const saveMonthPatch=async patch=>{
    if(!editItem||scope!=="month"||busy||loading)return;
    const id=editItem.id,next={...editItem,...patch};
    setEditItem(next);setRows(l=>sortRows(l.map(x=>x.id===id?{...x,...patch}:x)));
    setMsg("");setBusy(true);
    try{await apiPost({action:"editErrorType",id,...patch});if(onReloadDay)await onReloadDay(day);}catch(e){setMsg(e?.message||"Error");await load("month");}setBusy(false);
  };

  const toggleMonthActive=async()=>{if(editItem)await saveMonthPatch({active:!editItem.active});};
  const saveMonthWeight=async()=>{if(!editItem||scope!=="month"||busy||loading)return;const w=toNum(editWeight),prev=Number(editItem.weight??1);if(Math.abs(prev-w)<1e-9)return;await saveMonthPatch({weight:w});};
  const saveMonthMaxChecks=async()=>{if(!editItem||scope!=="month"||busy||loading)return;const next=toChecks(editMaxChecks),prev=toChecks(editItem.maxChecks);if(prev===next)return;await saveMonthPatch({maxChecks:next});};

  useEffect(()=>{if(open){setScope(initialScope);closeAction();closeEdit();closeDelete();}},[open,initialScope,kind]);
  useEffect(()=>{if(open)load(scope);},[open,scope,sel?.year,sel?.month,hasDb,kind]);

  const monthLabel=(()=>{if(monthCode)return String(monthCode);if(!sel?.year||!sel?.month)return"";const abbr=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return(abbr[(Number(sel.month)-1+12)%12]||"")+String(sel.year).slice(-2);})();
  if(!open)return null;

  return(
    <div className="perf-modal">
      <div className="perf-modal-backdrop" onClick={safeClose}/>
      <div className="perf-modal-card perf-errModal" onClick={e=>e.stopPropagation()}>
        <div className="perf-modal-head">
          <div className="perf-modal-left">{monthCode?<div className="perf-tag">{monthCode}</div>:<div/>}</div>
          <div className="perf-modal-mid">
            <div className="perf-seg">
              <button type="button" className={"perf-seg-btn"+(scope==="global"?" is-active":"")} onClick={()=>setScope("global")}>Глобални</button>
              <button type="button" className={"perf-seg-btn"+(scope==="month"?" is-active":"")} onClick={()=>setScope("month")} disabled={!hasDb}>За месеца</button>
            </div>
          </div>
          <div className="perf-modal-right"><button type="button" className="perf-x" onClick={safeClose} aria-label="Close"/></div>
        </div>

        {scope==="month"&&!hasDb&&<div className="perf-hint">Създай месеца първо, за да активираш грешки за него.</div>}

        {scope==="global"&&(
          <div className="perf-errAdd perf-mt10">
            <div className="perf-errAddTop">
              <input className={`perf-inp perf-errAddName ${signMeta(addSign).cls}`} placeholder={`Нова ${mode} грешка`} value={addName} onChange={e=>setAddName(e.target.value)} disabled={busy||loading}/>
              <SignDropdown className="perf-errAddSign" value={addSign} onChange={setAddSign} disabled={busy||loading}/>
            </div>
            <div className="perf-errAddBottom">
              <label className="perf-errAddField"><span className="perf-errAddLabel">Брой грешки:</span><input className="perf-inpW perf-errAddNum" type="text" inputMode="numeric" pattern="[0-9]*" value={addMaxChecks} onChange={e=>setAddMaxChecks(cleanChecksInput(e.target.value))} onBlur={()=>setAddMaxChecks(v=>cleanChecksInput(v)||6)} disabled={busy||loading} aria-label="Брой грешки"/></label>
              <label className="perf-errAddField"><span className="perf-errAddLabel">Тежест:</span><input className="perf-inpW perf-errAddWeight" type="number" step="0.01" value={addWeight} onChange={e=>setAddWeight(e.target.value)} disabled={busy||loading} aria-label="Тежест"/></label>
              <button type="button" className="perf-btn perf-errAddBtn" onClick={addGlobal} disabled={busy||loading||!String(addName||"").trim()}>Добави</button>
            </div>
          </div>
        )}

        {!!msg&&<div className="perf-hint perf-mt10">{msg}</div>}

        {loading?(<div className="perf-hint perf-mt10">Loading...</div>):!rows.length?(<div className="perf-empty perf-mt10">Няма</div>):(
          <div className="perf-errTable perf-mt10">
            <div className="perf-errHead"><div>Име</div><div className="is-center">Брой</div><div className="is-right">Тежест</div></div>
            {rows.map(r=>{const meta=signMeta(r);return(<button key={r.id} type="button" className={"perf-errRow "+meta.cls+(scope==="month"?(r.active?" is-on":" is-off"):"")} onClick={()=>openRow(r)} disabled={busy||loading}><div className={"perf-errName "+meta.cls}>{r.name}</div><div className="perf-errChecks">{toChecks(r.maxChecks)}</div><div className={"perf-errWeight "+meta.cls}>{fmt(r.weight)}</div></button>);})}
          </div>
        )}

        {actionOpen&&scope==="global"&&actionItem&&(()=>{const meta=signMeta(actionItem);return(
          <div className="perf-confirm">
            <div className="perf-confirm-backdrop" onClick={closeAction}/>
            <div className="perf-confirm-card perf-actionCard" onClick={e=>e.stopPropagation()}>
              <div className="perf-confirm-head"><div/><div className="perf-confirm-h">ДЕЙСТВИЯ</div><div style={{display:"flex",justifyContent:"flex-end"}}><button type="button" className="perf-x" onClick={closeAction} aria-label="Close"/></div></div>
              <div className="perf-actionTitle">{actionItem.name}</div>
              <div className="perf-actionSub"><span className={"perf-signPill "+meta.cls}>{meta.label}</span><span>Брой: <b>{toChecks(actionItem.maxChecks)}</b></span><span>Тежест: <b>{fmt(actionItem.weight)}</b></span></div>
              <div className="perf-actionList">
                <button type="button" className="perf-actionBtn" onClick={openEditGlobal} disabled={busy||loading}>Редактирай</button>
                <button type="button" className="perf-actionBtn is-danger" onClick={openDeleteGlobal} disabled={busy||loading}>Изтрий</button>
                <button type="button" className="perf-actionBtn is-ghost" onClick={closeAction} disabled={busy||loading}>Отказ</button>
              </div>
            </div>
          </div>
        )})()}

        {editOpen&&editItem&&(()=>{const meta=signMeta(editItem);return(
          <div className="perf-confirm">
            <div className="perf-confirm-backdrop" onClick={closeEdit}/>
            <div className={"perf-confirm-card"+(scope==="month"?" perf-editCard":"")} onClick={e=>e.stopPropagation()}>
              {scope==="month"?(
                <div className="perf-modal-head perf-editHead">
                  <div className="perf-modal-left">{monthLabel?(<div className="perf-month perf-monthStatic">{monthLabel}</div>):<div/>}</div>
                  <div className="perf-modal-mid"><div className="perf-editTitle"><span className="perf-editTitleLbl">Редактиране на</span><span className={"perf-editTitleName "+meta.cls}>{editItem.name}</span></div></div>
                  <div className="perf-modal-right"><button type="button" className="perf-x" onClick={closeEdit} aria-label="Close"/></div>
                </div>
              ):(
                <div className="perf-confirm-head"><div/><div className="perf-confirm-h">РЕДАКЦИЯ</div><div style={{display:"flex",justifyContent:"flex-end"}}><button type="button" className="perf-x" onClick={closeEdit} aria-label="Close"/></div></div>
              )}

              <div className="perf-editForm">
                <label className="perf-fld"><div className="perf-fldLbl">Име</div><input className="perf-inp perf-fldInp" value={editName} onChange={e=>setEditName(e.target.value)} disabled={scope==="month"||busy||loading}/></label>
                <label className="perf-fld"><div className="perf-fldLbl">Брой</div><input className="perf-inpW perf-fldW" type="text" inputMode="numeric" pattern="[0-9]*" value={editMaxChecks} onChange={e=>setEditMaxChecks(cleanChecksInput(e.target.value))} onBlur={e=>{setEditMaxChecks(v=>cleanChecksInput(v)||6);if(scope==="month")saveMonthMaxChecks();}} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}} disabled={busy||loading}/></label>
                <label className="perf-fld"><div className="perf-fldLbl">Тежест</div><input className="perf-inpW perf-fldW" type="number" step="0.01" value={editWeight} onChange={e=>setEditWeight(e.target.value)} onBlur={scope==="month"?saveMonthWeight:undefined} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}} disabled={busy||loading}/></label>
                {scope==="global"&&<label className="perf-fld"><div className="perf-fldLbl">Тип</div><SignDropdown className="perf-fldSign" value={editSign} onChange={setEditSign} disabled={busy||loading}/></label>}
              </div>

              {scope==="month"&&(<div className="perf-editActions"><button type="button" className={"perf-actBtn perf-actGreen"+(editItem.active?" is-on":" is-off")} onClick={toggleMonthActive} disabled={busy||loading}>{editItem.active?"АКТИВНА":"НЕАКТИВНА"}</button><button type="button" className="perf-actBtn perf-actDark" onClick={closeEdit} disabled={busy||loading}>ЗАТВОРИ</button></div>)}
              {scope==="global"&&(<div className="perf-confirm-actions perf-mt10"><button type="button" className="perf-btn" onClick={saveGlobal} disabled={busy||loading||!String(editName||"").trim()}>SAVE</button><button type="button" className="perf-btn2" onClick={closeEdit} disabled={busy||loading}>Cancel</button></div>)}
            </div>
          </div>
        )})()}

        {delOpen&&scope==="global"&&delItem&&(()=>{const meta=signMeta(delItem);return(
          <div className="perf-confirm">
            <div className="perf-confirm-backdrop" onClick={closeDelete}/>
            <div className="perf-confirm-card" onClick={e=>e.stopPropagation()}>
              <div className="perf-confirm-head"><div/><div className="perf-confirm-h">ИЗТРИВАНЕ</div><div style={{display:"flex",justifyContent:"flex-end"}}><button type="button" className="perf-x" onClick={closeDelete} aria-label="Close"/></div></div>
              <div className="perf-actionTitle">{delItem.name}</div>
              <div className="perf-actionSub"><span className={"perf-signPill "+meta.cls}>{meta.label}</span><span>Брой: <b>{toChecks(delItem.maxChecks)}</b></span><span>Тежест: <b>{fmt(delItem.weight)}</b></span></div>
              <div className="perf-danger"><div className="perf-danger-txt">За изтриване напиши точно: <b>del</b></div><input className="perf-inp" value={delText} onChange={e=>setDelText(e.target.value)} placeholder="del" autoFocus/><div className="perf-confirm-actions"><button type="button" className="perf-btn2" onClick={closeDelete} disabled={busy||loading}>Отказ</button><Delete_Button disabled={busy||loading||String(delText||"").trim().toLowerCase()!=="del"} onClick={deleteGlobal} label="Изтрий"/></div></div>
            </div>
          </div>
        )})()}
      </div>
    </div>
  );
}
