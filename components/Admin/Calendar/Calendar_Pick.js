// components/Admin/Calendar/Calendar_Pick.js
"use client";

export default function Calendar_Pick({title,picker,setPicker,loading,pickTab,setPickTab,pickQ,setPickQ,addStaff}){
if(!picker)return null;

const list=Array.isArray(picker)?picker:[];
const women=list.filter(c=>c.gender==="FEMALE");
const men=list.filter(c=>c.gender==="MALE");
const q=(pickQ||"").toLowerCase().trim();
const byQ=c=>!q||((c.nickname||"").toLowerCase().includes(q));
const womenF=women.filter(byQ),menF=men.filter(byQ);


const Col=({label,cls,list})=>(
  <div className={"picker-col"+(cls==="full"?" picker-col--full":"")}>
    <div className={"picker-col-title "+(cls==="female"?"female":cls==="male"?"male":"")}>{label}</div>
    <div className="picker-col-list">
      {loading?(<div className="picker-empty">Loading...</div>):
      !list.length?(<div className="picker-empty">—</div>):
      list.map(p=>(
        <button key={p.id} type="button" className={"picker-item "+(p.gender==="FEMALE"?"female":"male")} onClick={()=>addStaff(p.id)}>
          {p.nickname||""}
        </button>
      ))}
    </div>
  </div>
);

return(
<div className="picker-box" onMouseDown={()=>setPicker(null)}>
  <div className="picker-window" onMouseDown={e=>e.stopPropagation()}>
    <button type="button" className="modal-x" onClick={()=>setPicker(null)} aria-label="Close">×</button>
    <h3>{title||"Избери служител"}</h3>

    <div className="picker-controls">
      <div className="picker-tabs">
        <button type="button" className={"picker-tab"+(pickTab==="all"?" active":"")} onClick={()=>setPickTab("all")}>ВСИЧКИ</button>
        <button type="button" className={"picker-tab female"+(pickTab==="women"?" active":"")} onClick={()=>setPickTab("women")}>ЖЕНИ</button>
        <button type="button" className={"picker-tab male"+(pickTab==="men"?" active":"")} onClick={()=>setPickTab("men")}>МЪЖЕ</button>
      </div>
      <input className="picker-search" value={pickQ} onChange={e=>setPickQ(e.target.value)} placeholder="Search..." autoComplete="off"/>
    </div>

    <div className="picker-grid">
      {pickTab==="women" ? <Col label="ЖЕНИ" cls="full" list={womenF}/> :
       pickTab==="men"   ? <Col label="МЪЖЕ" cls="full" list={menF}/> :
       (<>
          <Col label="ЖЕНИ" cls="female" list={womenF}/>
          <Col label="МЪЖЕ" cls="male" list={menF}/>
        </>)
      }
    </div>
  </div>
</div>
);
}
