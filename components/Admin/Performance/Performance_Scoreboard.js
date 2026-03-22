"use client";
import{useEffect,useMemo,useRef,useState}from"react";
import{codeOf}from"./Performance_Math";
import{apiPost,loadScoreboard}from"./Performance_Api";

const fmt=v=>{const n=Math.round((Number(v)||0)*100)/100,s=n.toFixed(2);return s.replace(/\.00$/,"").replace(/(\.\d)0$/,"$1")};
const numVal=(v,fallback=0)=>{const n=Number(String(v??"").replace(",", "."));return Number.isFinite(n)?n:fallback;};
const intVal=(v,fallback=0)=>{const n=parseInt(String(v??""),10);return Number.isFinite(n)?n:fallback;};
const normAbbr=v=>String(v??"").trim().toUpperCase();
const mapGame=g=>({id:g.id,name:g.name,abbr:normAbbr(g.abbr),active:!!g.active,weight:String(g.weight??1)});
const sameGame=(a,b)=>!!a&&!!b&&a.active===b.active&&String(a.weight)===String(b.weight)&&normAbbr(a.abbr)===normAbbr(b.abbr);
const fullLabelOf=g=>g?.abbr?`${g.name} (${g.abbr})`:g?.name||"";
const shortLabelOf=g=>g?.abbr||g?.name||"";

export default function Performance_Scoreboard({role="DEALER",sel,hasDb,refreshKey=0,settingsOpen=false,onCloseSettings,nickFilter="",genderFilter="ALL"}){
  const[data,setData]=useState({hasDb:false,config:null,games:[],rows:[]}),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[msg,setMsg]=useState(""),[gameDrafts,setGameDrafts]=useState([]),[cfg,setCfg]=useState({shiftDivider:"5",shiftMaxCount:"22",minShiftCount:"5",gamePointWeight:"1",budget:"0"});
  const dataRef=useRef(data),draftsRef=useRef(gameDrafts),savingRef=useRef(new Set()),queuedRef=useRef(new Map()),deadRef=useRef(false);
  const monthCode=sel?codeOf(sel.month,sel.year):"";

  const applyDrafts=games=>{
    const next=(Array.isArray(games)?games:[]).map(mapGame);
    draftsRef.current=next;
    setGameDrafts(next);
  };

  const reload=async()=>{
    if(!sel){
      const empty={hasDb:false,config:null,games:[],rows:[]};
      dataRef.current=empty;
      setData(empty);
      applyDrafts([]);
      return;
    }
    setLoading(true);
    try{
      setMsg("");
      const j=await loadScoreboard({role,year:sel.year,month:sel.month});
      dataRef.current=j;
      setData(j);
      applyDrafts(j?.games);
    }catch(e){
      setMsg(e?.message||"Error");
      const empty={hasDb:false,config:null,games:[],rows:[]};
      dataRef.current=empty;
      setData(empty);
      applyDrafts([]);
    }finally{setLoading(false);}
  };

  useEffect(()=>{dataRef.current=data;},[data]);
  useEffect(()=>{draftsRef.current=gameDrafts;},[gameDrafts]);
  useEffect(()=>{reload();},[role,sel?.year,sel?.month,hasDb,refreshKey]);
  useEffect(()=>()=>{deadRef.current=true;},[]);
  useEffect(()=>{
    if(!settingsOpen)return;
    const onKey=e=>{if(e.key==="Escape")onCloseSettings?.();};
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[settingsOpen,onCloseSettings]);

  const conf=useMemo(()=>({shiftDivider:numVal(data?.config?.shiftDivider,5),shiftMaxCount:intVal(data?.config?.shiftMaxCount,22),minShiftCount:intVal(data?.config?.minShiftCount,5),gamePointWeight:numVal(data?.config?.gamePointWeight,1),budget:numVal(data?.config?.budget,0),maxShiftPoints:numVal(data?.config?.maxShiftPoints,4.4),pointValue:numVal(data?.config?.pointValue,0)}),[data]);

  useEffect(()=>{
    const c=data?.config||{};
    setCfg({shiftDivider:String(c.shiftDivider??5),shiftMaxCount:String(c.shiftMaxCount??22),minShiftCount:String(c.minShiftCount??5),gamePointWeight:String(c.gamePointWeight??1),budget:String(c.budget??0)});
  },[data?.config?.shiftDivider,data?.config?.shiftMaxCount,data?.config?.minShiftCount,data?.config?.gamePointWeight,data?.config?.budget]);


  const rowsRaw=Array.isArray(data?.rows)?data.rows:[];
  const rows=useMemo(()=>{
    const q=nickFilter.trim().toLowerCase();
    return rowsRaw.filter(r=>{
      if(genderFilter!=="ALL"&&String(r?.gender||"").toUpperCase()!==genderFilter)return false;
      return !q||String(r?.nickname||r?.name||"").toLowerCase().includes(q);
    }).slice().sort((a,b)=>(Number(b?.points)||0)-(Number(a?.points)||0)||(Number(b?.money)||0)-(Number(a?.money)||0)||String(a?.name||"").localeCompare(String(b?.name||""),"bg",{sensitivity:"base"}));
  },[rowsRaw,nickFilter,genderFilter]);
  const activeGames=useMemo(()=>gameDrafts.filter(g=>g.active).map((g,i)=>({...g,__i:i})),[gameDrafts]);
  const dirtyConfig=useMemo(()=>String(cfg.shiftDivider)!==String(conf.shiftDivider)||String(cfg.shiftMaxCount)!==String(conf.shiftMaxCount)||String(cfg.minShiftCount)!==String(conf.minShiftCount)||String(cfg.gamePointWeight)!==String(conf.gamePointWeight)||String(cfg.budget)!==String(conf.budget),[cfg,conf]);
  const rowDirty=g=>{const cur=(Array.isArray(dataRef.current?.games)?dataRef.current.games:[]).map(mapGame).find(x=>x.id===g.id);return!cur||!sameGame(g,cur)};

  const saveConfig=async()=>{
    if(!sel||saving||!dirtyConfig)return;
    setSaving(true);setMsg("");
    try{
      await apiPost({action:"setScoreboardConfig",role,year:sel.year,month:sel.month,shiftDivider:numVal(cfg.shiftDivider,conf.shiftDivider),shiftMaxCount:intVal(cfg.shiftMaxCount,conf.shiftMaxCount),minShiftCount:intVal(cfg.minShiftCount,conf.minShiftCount),gamePointWeight:numVal(cfg.gamePointWeight,conf.gamePointWeight),budget:Math.max(0,numVal(cfg.budget,conf.budget))});
      await reload();
    }catch(e){setMsg(e?.message||"Error");}
    setSaving(false);
  };

  const replaceDraft=(id,patchOrFn)=>{
    let nextGame=null,nextDrafts=null;
    setGameDrafts(list=>{
      nextDrafts=list.map(g=>{
        if(g.id!==id)return g;
        const patch=typeof patchOrFn==="function"?patchOrFn(g):patchOrFn;
        nextGame={...g,...patch};
        return nextGame;
      });
      draftsRef.current=nextDrafts;
      return nextDrafts;
    });
    return nextGame||draftsRef.current.find(g=>g.id===id)||null;
  };

  const persistGame=async gameOrId=>{
    if(!sel)return;
    const game=typeof gameOrId==="object"&&gameOrId?gameOrId:draftsRef.current.find(g=>g.id===gameOrId);
    const id=game?.id;
    if(!id||!rowDirty(game))return;
    if(savingRef.current.has(id)){queuedRef.current.set(id,game);return;}
    savingRef.current.add(id);setMsg("");
    try{
      await apiPost({action:"setScoreboardGameConfig",role,year:sel.year,month:sel.month,gameId:id,active:!!game.active,abbr:normAbbr(game.abbr),weight:numVal(game.weight,1)});
      await reload();
    }catch(e){setMsg(e?.message||"Error");}
    finally{
      if(deadRef.current)return;
      savingRef.current.delete(id);
      const queued=queuedRef.current.get(id);
      if(queued){queuedRef.current.delete(id);persistGame(queued);}
    }
  };

  const setGameField=(id,key,val)=>{replaceDraft(id,{[key]:val});};
  const saveGameOnBlur=id=>{persistGame(draftsRef.current.find(g=>g.id===id));};
  const toggleGame=id=>{const next=replaceDraft(id,g=>({active:!g.active}));if(next)persistGame(next);};
  const onGameKeyDown=(e,id)=>{if(e.key==="Enter"){e.preventDefault();persistGame(draftsRef.current.find(g=>g.id===id));e.currentTarget.blur();}};

  if(!sel)return<div className="perf-hint">Избери месец</div>;
  if(!hasDb||!data?.hasDb)return<div className="perf-hint">Създай месеца, за да има scoreboard.</div>;

  return(<>
    {settingsOpen&&<div className="perf-modal" role="dialog" aria-modal="true" aria-label="Scoreboard settings">
      <div className="perf-modal-backdrop" onClick={()=>onCloseSettings?.()} aria-hidden="true"/>
      <div className="perf-modal-card perf-sb-settingsCard">
        <div className="perf-modal-head">
          <div className="perf-modal-left"><div className="perf-month perf-monthStatic">{monthCode}</div></div>
          <div className="perf-modal-mid"><div className="perf-editTitle"><span className="perf-editTitleLbl">Scoreboard</span><span className="perf-editTitleName">Настройки</span></div></div>
          <div className="perf-modal-right"><button type="button" className="perf-x" onClick={()=>onCloseSettings?.()}>Close</button></div>
        </div>

        <div className="perf-sb-settingsBody">
          <div className="perf-sb-settingsSection">
            <div className="perf-sb-settingsGrid">
              <label className="perf-sb-chip"><span>Shifts /</span><input className="perf-sb-input" value={cfg.shiftDivider} onChange={e=>setCfg(v=>({...v,shiftDivider:e.target.value}))}/></label>
              <label className="perf-sb-chip"><span>Max shifts</span><input className="perf-sb-input" value={cfg.shiftMaxCount} onChange={e=>setCfg(v=>({...v,shiftMaxCount:e.target.value}))}/></label>
              <label className="perf-sb-chip"><span>Min shifts</span><input className="perf-sb-input" value={cfg.minShiftCount} onChange={e=>setCfg(v=>({...v,minShiftCount:e.target.value}))}/></label>
              <label className="perf-sb-chip"><span>Game x</span><input className="perf-sb-input" value={cfg.gamePointWeight} onChange={e=>setCfg(v=>({...v,gamePointWeight:e.target.value}))}/></label>
              <label className="perf-sb-chip"><span>Бюджет</span><input className="perf-sb-input" type="number" min="0" step="0.01" inputMode="decimal" value={cfg.budget} onChange={e=>setCfg(v=>({...v,budget:e.target.value}))}/></label>
              <label className="perf-sb-chip"><span>1 точка</span><input className="perf-sb-input" value={fmt(conf.pointValue)} readOnly tabIndex={-1}/></label>
              <div className="perf-sb-tag perf-sb-tagBlock">Max shift pts {fmt(conf.maxShiftPoints)}</div>
              <button type="button" className={"perf-sb-save perf-sb-saveBlock"+(dirtyConfig&&!saving?" is-dirty":"")} disabled={!dirtyConfig||saving} onClick={saveConfig}>{saving?"Saving...":"Save settings"}</button>
            </div>
          </div>

          <div className="perf-sb-settingsSection">
            <div className="perf-sb-settingsTitle">Games</div>
            <div className="perf-sb-games">
              {gameDrafts.map(g=>(
                <div key={g.id} className={"perf-sb-game"+(g.active?" is-on":" is-off")}>
                  <div className="perf-sb-gameTop">
                    <div className="perf-sb-gameName" title={fullLabelOf(g)}>{fullLabelOf(g)}</div>
                    <button type="button" className={"perf-sb-toggle"+(g.active?" is-on":" is-off")} onClick={()=>toggleGame(g.id)}>{g.active?"ON":"OFF"}</button>
                  </div>
                  <div className="perf-sb-gameRow">
                    <input className="perf-sb-input perf-sb-gameInput perf-sb-gameAbbr" placeholder="ABR" value={g.abbr} maxLength={12} onChange={e=>setGameField(g.id,"abbr",e.target.value.toUpperCase())} onBlur={()=>saveGameOnBlur(g.id)} onKeyDown={e=>onGameKeyDown(e,g.id)}/>
                    <input className="perf-sb-input perf-sb-gameInput perf-sb-gameWeight" placeholder="1" inputMode="decimal" value={g.weight} onChange={e=>setGameField(g.id,"weight",e.target.value)} onBlur={()=>saveGameOnBlur(g.id)} onKeyDown={e=>onGameKeyDown(e,g.id)}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!!msg&&<div className="perf-hint">{msg}</div>}
        </div>
      </div>
    </div>}

    {!!msg&&<div className="perf-hint">{msg}</div>}
    {loading?<div className="perf-hint">Loading...</div>:(!rows.length?<div className="perf-empty">{rowsRaw.length?"Няма хора за този филтър":"Няма"}</div>:(
      <div className="perf-sb-tableWrap">
        <table className="perf-sb-table">
          <thead>
            <tr>
              <th className="perf-sb-th perf-sb-thName" rowSpan={2}>Name</th>
              <th className="perf-sb-th" rowSpan={2}>Shifts</th>
              <th className="perf-sb-th perf-sb-thGames" colSpan={Math.max(activeGames.length,1)}>Games</th>
              <th className="perf-sb-th perf-sb-thPT" colSpan={3}>Performance &amp; Technicals</th>
              <th className="perf-sb-th perf-sb-thPoints" rowSpan={2}>Points</th>
              <th className="perf-sb-th perf-sb-thMoney" rowSpan={2}>Пари</th>
            </tr>
            <tr>
              {activeGames.length?activeGames.map(g=><th key={g.id} className="perf-sb-th perf-sb-thGame">{shortLabelOf(g)}</th>):<th className="perf-sb-th">-</th>}
              <th className="perf-sb-th perf-sb-thNeg">Appearance</th>
              <th className="perf-sb-th perf-sb-thNeg">Technical</th>
              <th className="perf-sb-th perf-sb-thPos">Exceptional</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.dealerKey}>
                <td className="perf-sb-td perf-sb-tdName" title={`${r.name} • ${r.rawShiftCount} shifts`}>{r.name}</td>
                <td className="perf-sb-td" title={r.rawShiftPoints>r.shiftPoints?`${r.rawShiftCount} shifts • ${fmt(r.rawShiftPoints)} raw pts • capped to ${fmt(r.shiftPoints)}`:`${r.rawShiftCount} shifts • ${fmt(r.shiftPoints)} pts`}>{fmt(r.shiftPoints)}</td>
                {activeGames.length?activeGames.map((g,i)=><td key={`${r.dealerKey}-${g.id}`} className="perf-sb-td"><span className={"perf-sb-icon"+(r.gamesKnown?.[i]?" is-on":"")} aria-hidden="true">{r.gamesKnown?.[i]?"✔":"□"}</span></td>):<td className="perf-sb-td">-</td>}
                <td className="perf-sb-td">{fmt(r.appearance)}</td>
                <td className="perf-sb-td">{fmt(r.technical)}</td>
                <td className="perf-sb-td">{fmt(r.exceptional)}</td>
                <td className="perf-sb-td perf-sb-tdPoints">{fmt(r.points)}</td><td className="perf-sb-td perf-sb-tdMoney">{fmt(r.money)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </>);
}