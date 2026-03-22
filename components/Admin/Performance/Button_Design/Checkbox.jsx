"use client";
import {memo} from "react";

const symbolOf={check:"✓",plus:"+",minus:"−",empty:""};

function Checkbox({state="empty",disabled=false,lock=false,onClick,title="",ariaLabel="",className="",value=null}){
  if(state==="count")return <span className={`perf-cbCount ${className}`.trim()} title={title||String(value||0)}>{value}</span>;
  const dis=!!disabled,lck=!!lock;
  return(
    <button
      type="button"
      disabled={dis||lck}
      onClick={onClick}
      aria-label={ariaLabel||title||state}
      title={title||state}
      className={`perf-cb perf-cb--${state}${dis?" is-disabled":""}${lck?" is-lock":""}${className?` ${className}`:""}`}
    >
      <span className="perf-cbFrame">
        <span className="perf-cbInner">
          {state!=="empty"&&<span className="perf-cbIcon" aria-hidden>{symbolOf[state]||""}</span>}
        </span>
      </span>
    </button>
  );
}

export default memo(Checkbox);
