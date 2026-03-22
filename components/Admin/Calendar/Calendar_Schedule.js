// components/Admin/Calendar/Calendar_Schedule.js
export default function Calendar_Schedule({
days,daysInMonth,weekdayByDay,dcByDay,dcSorted,activeDay,setActiveDay,
topRef,gridScrollRef,headScrollRef,namesRef,sortedRows,setSchedule,tableRef,
saveCell,statsByStaffId,hScrollRef,hScrollW,statsLabels
}){
const rid=(row)=>row?.staffId??row?.id??row?.staff?.id??null;
const focusEnd=i=>{if(!i)return;const l=(i.value||"").length;i.focus();try{i.setSelectionRange(l,l)}catch{}};

return(<>
<div className="day-box-row" ref={topRef}>
{days.map(d=>{const off=d>daysInMonth,st=(dcByDay?.[d-1]||{});return(
  <div key={d} className={"day-box"+(off?" day-box-off":"")+(activeDay===d?" day-box-selected":"")} onClick={()=>setActiveDay(d)}>
    <div className="day-box-num">Ден {d}</div>
    <div className="day-box-dow">{weekdayByDay?.[d-1]||""}</div>
    {dcSorted?.length?dcSorted.map(sec=>(
      <div key={sec.id} className="shift-line">{sec.name}: <span>{st?.[sec.id]||0}</span></div>
    )):<div className="shift-line">—</div>}
  </div>
)})}
</div>

<div className="cal-grid-panel">
  <div className="cal-grid-head">
    <div className="cal-names-head"><div className="name-card head"><span className="name-txt">Имена</span></div></div>
    <div className="cal-table-head-scroller" ref={headScrollRef}>
      <div className="table-head">
        {days.map(d=>{const off=d>daysInMonth;return(
          <div key={d} className={"day-head"+(off?" day-head-off":"")+(activeDay===d?" day-head-selected":"")} onClick={()=>setActiveDay(d)}>{d}</div>
        )})}
        {(statsLabels||[]).map((s,i)=><div key={"hs"+i} className="head-stat">{s}</div>)}
      </div>
    </div>
  </div>

  <div className="cal-grid-scroller" ref={gridScrollRef}>
    <div className="cal-grid-wrap">
      <div className="cal-grid">
        <div className="cal-names" ref={namesRef}>
          {(sortedRows||[]).map((row,i)=>(
            <div key={rid(row)??("r"+i)} className={"name-card "+((row.staff?.gender)==="FEMALE"?"female":"male")}>
              <span className="name-txt">{row.staff?.nickname||""}</span>
            </div>
          ))}
        </div>

        <div className="cal-table" ref={tableRef}>
          {(sortedRows||[]).map((row,i)=>{const rowId=rid(row)??("r"+i);const stats=statsByStaffId?.[String(rowId)]||null;return(
            <div key={rowId} className="table-row">
              {days.map(d=>{const off=d>daysInMonth,field="day"+d,val=row?.[field]||"";
                if(off)return(
                  <div key={d} className={"slot slot-disabled"+(activeDay===d?" slot-selected":"")}><span className="slot-lock">🔒</span></div>
                );
                return(
                  <div key={d} className={"slot"+(activeDay===d?" slot-selected":"")}
                    onMouseDown={e=>{const inp=e.currentTarget.querySelector(".slot-input");if(!inp||document.activeElement===inp)return;e.preventDefault();focusEnd(inp);setActiveDay(d);}}>
                    <input className="slot-input" value={val}
                      onChange={e=>{const v=e.target.value;setSchedule(s=>!s?s:{...s,rows:(s.rows||[]).map(r=>((r.staffId??r.id??r.staff?.id)===(row.staffId??row.id??row.staff?.id))?{...r,[field]:v}:r)})}}
                      onBlur={e=>saveCell?.((row.staffId??row.id??row.staff?.id),d,e.target.value)}
                      onMouseDown={e=>{if(document.activeElement===e.currentTarget)e.stopPropagation()}}
                      onFocus={e=>{focusEnd(e.target);setActiveDay(d)}}
                      onKeyDown={e=>{const input=e.currentTarget,v=input.value||"",pos=input.selectionStart??v.length,rowEl=input.closest(".table-row"),table=tableRef?.current||rowEl?.parentElement;
                        if(e.key==="ArrowLeft"&&pos===0&&d>1){e.preventDefault();const prev=rowEl?.querySelector(`.slot:nth-child(${d-1}) .slot-input`);if(prev){focusEnd(prev);setActiveDay(d-1)}}
                        else if(e.key==="ArrowRight"&&pos===v.length&&d<daysInMonth){e.preventDefault();const next=rowEl?.querySelector(`.slot:nth-child(${d+1}) .slot-input`);if(next){focusEnd(next);setActiveDay(d+1)}}
                        else if((e.key==="ArrowUp"||e.key==="ArrowDown"||e.key==="Enter")&&table&&rowEl){e.preventDefault();const rows=[...table.querySelectorAll(".table-row")],ri=rows.indexOf(rowEl);if(ri<0)return;const ti=e.key==="ArrowUp"?ri-1:ri+1;if(ti<0||ti>=rows.length)return;const next=rows[ti]?.querySelector(`.slot:nth-child(${d}) .slot-input`);if(next){focusEnd(next);setActiveDay(d)}}
                      }}
                    />
                  </div>
                );
              })}
              {(statsLabels||[]).map((s,si)=><div key={String(rowId)+"-st"+si} className="stat-box">{stats?.[s]??"0"}</div>)}
            </div>
          )})}
        </div>
      </div>
    </div>
  </div>
</div>

<div className="cal-xscroll-panel">
  <div className="cal-hscroll" ref={hScrollRef}>
    <div className="cal-hscroll-inner" style={{width:(hScrollW||1)+"px"}}/>
  </div>
</div>
</>);
}
