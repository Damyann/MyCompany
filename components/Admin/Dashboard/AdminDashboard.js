// components/Admin/Dashboard/AdminDashboard.js
"use client";
import {useEffect,useRef,useState} from "react";
import "./AdminDashboard.css";
import Dealer from "../Team/Dealer";
import Pitboss from "../Team/Pitboss";
import Game from "../Team/Game";
import Calendar from "../Calendar/Calendar";
import Performance from "../Performance/Performance";

const NAV_ITEMS=[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"admin",label:"Performance",icon:"📈"},{id:"calendar",label:"Calendar",icon:"📅"},{id:"team",label:"Team",icon:"👥"},{id:"games",label:"Games",icon:"🎮"},{id:"requests",label:"Requests",icon:"📥"},{id:"reports",label:"Reports",icon:"📊"}];
const TEAM_TABS=["Dealer","Pitboss","QA","Training"];
const GAME_TABS=["Всички","Мъже","Жени"];
const CALENDAR_TABS=["Dealers","Pitboss","QA","Training","Support","Cleaners"];
const TAB_ROLE={Dealers:"DEALER",Pitboss:"PITBOSS",QA:"QA",Training:"TRAINING",Support:"SUPPORT",Cleaners:"CLEANERS"};

export default function AdminDashboard(){
  const[active,setActive]=useState("dashboard"),[collapsed,setCollapsed]=useState(false);
  const[teamTab,setTeamTab]=useState("Dealer"),teamRefs=useRef([]),[teamInd,setTeamInd]=useState({});
  const[gameTab,setGameTab]=useState("Всички"),gameRefs=useRef([]),[gameInd,setGameInd]=useState({});
  const[calendarTab,setCalendarTab]=useState("Dealers"),calRefs=useRef([]),[calInd,setCalInd]=useState({});
  const[dealers,setDealers]=useState([]),[loadingDealers,setLoadingDealers]=useState(true);
  const[pitbosses,setPitbosses]=useState([]),[loadingPitbosses,setLoadingPitbosses]=useState(true);
  const[games,setGames]=useState([]),[loadingGames,setLoadingGames]=useState(true);
  const calendarListPromiseRef=useRef({}),calendarSchedulePromisesRef=useRef({}),dayCardPromiseRef=useRef({});

  async function getCalendarList(role){
    const r=String(role||"DEALER").toUpperCase();
    if(calendarListPromiseRef.current[r])return calendarListPromiseRef.current[r];
    calendarListPromiseRef.current[r]=fetch(`/api/Admin/Calendar/List?list=1&role=${r}`,{cache:"no-store"}).then(async x=>{const j=await x.json().catch(()=>null);if(!x.ok)throw new Error(j?.error||"Error");return Array.isArray(j?.schedules)?j.schedules:[];}).catch(e=>{delete calendarListPromiseRef.current[r];throw e});
    return calendarListPromiseRef.current[r];
  }
  async function getCalendarSchedule(role,month,year){
    const r=String(role||"DEALER").toUpperCase(),key=`${r}-${month}-${year}`;
    if(calendarSchedulePromisesRef.current[key])return calendarSchedulePromisesRef.current[key];
    calendarSchedulePromisesRef.current[key]=fetch(`/api/Admin/Calendar/List?month=${month}&year=${year}&role=${r}`,{cache:"no-store"}).then(async x=>{const j=await x.json().catch(()=>null);if(!x.ok)throw new Error(j?.error||"Error");return j;}).catch(e=>{delete calendarSchedulePromisesRef.current[key];throw e});
    return calendarSchedulePromisesRef.current[key];
  }
  async function getDayCard(role,force){
    const r=String(role||"DEALER").toUpperCase();
    if(force)delete dayCardPromiseRef.current[r];
    if(dayCardPromiseRef.current[r])return dayCardPromiseRef.current[r];
    dayCardPromiseRef.current[r]=fetch(`/api/Admin/Calendar/List?dayCard=1&role=${r}`,{cache:"no-store"}).then(x=>x.json()).then(j=>Array.isArray(j?.sections)?j.sections:[]).catch(e=>{delete dayCardPromiseRef.current[r];throw e});
    return dayCardPromiseRef.current[r];
  }
  function invalidateCalendarCache(role){
    if(role){
      const r=String(role).toUpperCase();
      delete calendarListPromiseRef.current[r];delete dayCardPromiseRef.current[r];
      for(const k of Object.keys(calendarSchedulePromisesRef.current))if(k.startsWith(r+"-"))delete calendarSchedulePromisesRef.current[k];
    }else{calendarListPromiseRef.current={};calendarSchedulePromisesRef.current={};dayCardPromiseRef.current={};}
  }

  useEffect(()=>{(async()=>{try{const r=await fetch("/api/Admin/Dealer/List",{cache:"no-store"});if(r.ok){const d=await r.json();setDealers(Array.isArray(d?.croupiers)?d.croupiers:Array.isArray(d?.dealers)?d.dealers:[]);}else setDealers([]);}catch{setDealers([])}finally{setLoadingDealers(false);}})()},[]);
  useEffect(()=>{(async()=>{try{const r=await fetch("/api/Admin/Pitboss/List",{cache:"no-store"});if(r.ok){const d=await r.json();setPitbosses(Array.isArray(d?.pitbosses)?d.pitbosses:[]);}}finally{setLoadingPitbosses(false);}})()},[]);
  useEffect(()=>{(async()=>{try{const r=await fetch("/api/Admin/Game/List",{cache:"no-store"});if(r.ok){const d=await r.json();setGames(d?.games||[]);}}finally{setLoadingGames(false);}})()},[]);
  useEffect(()=>{(async()=>{try{const role="DEALER",all=await getCalendarList(role);if(!Array.isArray(all)||!all.length)return;const now=new Date(),nm=now.getMonth()+1,ny=now.getFullYear();let closest=null,diff=Infinity;for(const s of all){const d=Math.abs(s.year-ny)*12+Math.abs(s.month-nm);if(d<diff){closest=s;diff=d;}}if(closest)await getCalendarSchedule(role,closest.month,closest.year);}catch{}})()},[]);
  useEffect(()=>{getDayCard("DEALER").catch(()=>{})},[]);
  useEffect(()=>{if(active!=="team")return;const el=teamRefs.current[TEAM_TABS.indexOf(teamTab)];if(el)setTeamInd({width:el.offsetWidth,left:el.offsetLeft});},[teamTab,active]);
  useEffect(()=>{if(active!=="games")return;const el=gameRefs.current[GAME_TABS.indexOf(gameTab)];if(el)setGameInd({width:el.offsetWidth,left:el.offsetLeft});},[gameTab,active]);
  useEffect(()=>{if(active!=="calendar")return;const el=calRefs.current[CALENDAR_TABS.indexOf(calendarTab)];if(el)setCalInd({width:el.offsetWidth,left:el.offsetLeft});},[calendarTab,active]);

  const headerTitle=active==="team"?"Team":active==="games"?"Games":NAV_ITEMS.find(i=>i.id===active)?.label;
  const onNav=(id)=>{setActive(id);if(id==="games")setGameTab("Всички");if(id==="calendar")setCalendarTab("Dealers");};

  return(
    <div className="admin-layout">
      <aside className={"admin-sidebar"+(collapsed?" admin-sidebar-collapsed":"")}>
        <button className="admin-sidebar-toggle" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} title={collapsed?"Expand":"Collapse"}>
          <svg className="admin-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/><path d="M17.5 8h0.01"/><path d="M17.5 12h0.01"/><path d="M17.5 16h0.01"/>
          </svg>
        </button>
        <nav className="admin-nav">
          {NAV_ITEMS.map(i=>(
            <button key={i.id} title={i.label} className={"admin-nav-item"+(i.id===active?" admin-nav-item-active":"")} onClick={()=>onNav(i.id)}>
              <span className="admin-nav-icon">{i.icon}</span><span className="admin-nav-label">{i.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main"><div className={"admin-main-shell"+(active==="admin"?" admin-main-shell-performance":"")}>
        <header className="admin-main-header TeamTabs-header">
          <h1>{headerTitle}</h1>
          {active==="calendar"&&(
            <div className="TeamTabs CalendarNav">
              {CALENDAR_TABS.map((t,i)=>(<button key={t} ref={el=>calRefs.current[i]=el} className={"TeamTabs-btn"+(calendarTab===t?" TeamTabs-btn-active":"")} onClick={()=>setCalendarTab(t)}>{t}</button>))}
              <div className="TeamTabs-indicator" style={calInd}/>
            </div>
          )}
          {active==="team"&&(
            <div className="TeamTabs">
              {TEAM_TABS.map((t,i)=>(<button key={t} ref={el=>teamRefs.current[i]=el} className={"TeamTabs-btn"+(teamTab===t?" TeamTabs-btn-active":"")} onClick={()=>setTeamTab(t)}>{t}</button>))}
              <div className="TeamTabs-indicator" style={teamInd}/>
            </div>
          )}
          {active==="games"&&(
            <div className="TeamTabs">
              {GAME_TABS.map((t,i)=>(<button key={t} ref={el=>gameRefs.current[i]=el} className={"TeamTabs-btn"+(gameTab===t?" TeamTabs-btn-active":"")} onClick={()=>setGameTab(t)}>{t}</button>))}
              <div className="TeamTabs-indicator" style={gameInd}/>
            </div>
          )}
        </header>

        <section className={"admin-main-body"+(active==="admin"?" admin-main-body-performance":"")}>
          <div style={{display:active==="admin"?"flex":"none",flex:1,minWidth:0,minHeight:0}}><Performance active={active==="admin"}/></div>
          {active!=="admin" ? (
            active==="team" ? (
              teamTab==="Dealer" ? <Dealer dealers={dealers} loading={loadingDealers} setDealers={setDealers} games={games}/> :
              teamTab==="Pitboss" ? <Pitboss pitbosses={pitbosses} loading={loadingPitbosses} setPitbosses={setPitbosses}/> :
              <div className="admin-placeholder-card"><p className="admin-placeholder-title">Няма съдържание</p></div>
            ) : active==="games" ? (
              <Game games={gameTab==="Всички"?games:gameTab==="Мъже"?games.filter(g=>g.gender==="MALE"||g.gender==="ALL"||g.gender===null):games.filter(g=>g.gender==="FEMALE"||g.gender==="ALL"||g.gender===null)} loading={loadingGames} setGames={setGames}/>
            ) : active==="calendar" ? (
              calendarTab==="Dealers" ? (
                <Calendar calendarTab={calendarTab} staff={dealers} loadingStaff={loadingDealers} getCalendarList={()=>getCalendarList(TAB_ROLE[calendarTab])} getCalendarSchedule={(m,y)=>getCalendarSchedule(TAB_ROLE[calendarTab],m,y)} getDayCard={(force)=>getDayCard(TAB_ROLE[calendarTab],!!force)} invalidateCalendarCache={()=>invalidateCalendarCache(TAB_ROLE[calendarTab])}/>
              ) : calendarTab==="Pitboss" ? (
                <Calendar calendarTab={calendarTab} staff={pitbosses} loadingStaff={loadingPitbosses} getCalendarList={()=>getCalendarList(TAB_ROLE[calendarTab])} getCalendarSchedule={(m,y)=>getCalendarSchedule(TAB_ROLE[calendarTab],m,y)} getDayCard={(force)=>getDayCard(TAB_ROLE[calendarTab],!!force)} invalidateCalendarCache={()=>invalidateCalendarCache(TAB_ROLE[calendarTab])}/>
              ) : (
                <div className="admin-placeholder-card"><p className="admin-placeholder-title">Coming soon</p></div>
              )
            ) : (
              <div className="admin-placeholder-card"><p className="admin-placeholder-title">Няма данни за показване</p></div>
            )
          ) : null}
        </section>
      </div></main>
    </div>
  );
}