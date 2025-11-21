"use client";import{useState,useRef,useEffect}from"react";import"./AdminDashboard.css";import Dealer from"./Team/Dealer";import Game from"./Team/Game";

const NAV_ITEMS=[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"requests",label:"Requests",icon:"📥"},{id:"calendar",label:"Calendar",icon:"📅"},{id:"team",label:"Team",icon:"👥"},{id:"games",label:"Games",icon:"🎮"},{id:"reports",label:"Reports",icon:"📊"},{id:"admin",label:"Admin",icon:"⚙️"}];
const TEAM_TABS=["Dealer","Pitboss","QA","Training"];
const GAME_TABS=["Всички","Мъже","Жени"];

export default function AdminDashboard(){
const[active,setActive]=useState("dashboard"),[teamTab,setTeamTab]=useState("Dealer"),tabRefs=useRef([]),[indicatorStyle,setIndicatorStyle]=useState({}),[gameTab,setGameTab]=useState("Всички"),gameRefs=useRef([]),[gameInd,setGameInd]=useState({});
const[dealers,setDealers]=useState([]),[loadingDealers,setLoadingDealers]=useState(true);
const[games,setGames]=useState([]),[loadingGames,setLoadingGames]=useState(true);

useEffect(()=>{(async()=>{try{const r=await fetch("/api/Admin/Dealer/List");if(r.ok){const d=await r.json();setDealers(d.croupiers||[]);}}finally{setLoadingDealers(false);}})()},[]);
useEffect(()=>{(async()=>{try{const r=await fetch("/api/Admin/Game/List");if(r.ok){const d=await r.json();setGames(d.games||[]);}}finally{setLoadingGames(false);}})()},[]);

useEffect(()=>{if(active!=="team")return;const el=tabRefs.current[TEAM_TABS.indexOf(teamTab)];if(el)setIndicatorStyle({width:el.offsetWidth,left:el.offsetLeft});},[teamTab,active]);
useEffect(()=>{if(active!=="games")return;const el=gameRefs.current[GAME_TABS.indexOf(gameTab)];if(el)setGameInd({width:el.offsetWidth,left:el.offsetLeft});},[gameTab,active]);

return(<div className="admin-layout">

<aside className="admin-sidebar">
<nav className="admin-nav">{NAV_ITEMS.map(i=>(<button key={i.id} className={"admin-nav-item"+(i.id===active?" admin-nav-item-active":"")} onClick={()=>{setActive(i.id);if(i.id==="games")setGameTab("Всички")}}><span className="admin-nav-icon">{i.icon}</span><span className="admin-nav-label">{i.label}</span></button>))}</nav>
</aside>

<main className="admin-main"><div className="admin-main-shell">

<header className="admin-main-header TeamTabs-header">
<h1>{active==="team"?"Team":active==="games"?"Games":NAV_ITEMS.find(i=>i.id===active)?.label}</h1>

{active==="team"&&(<div className="TeamTabs">{TEAM_TABS.map((t,i)=>(<button key={t} ref={el=>tabRefs.current[i]=el} className={"TeamTabs-btn"+(teamTab===t?" TeamTabs-btn-active":"")} onClick={()=>setTeamTab(t)}>{t}</button>))}<div className="TeamTabs-indicator" style={indicatorStyle}/></div>)}

{active==="games"&&(<div className="TeamTabs">{GAME_TABS.map((t,i)=>(<button key={t} ref={el=>gameRefs.current[i]=el} className={"TeamTabs-btn"+(gameTab===t?" TeamTabs-btn-active":"")} onClick={()=>setGameTab(t)}>{t}</button>))}<div className="TeamTabs-indicator" style={gameInd}/></div>)}
</header>

<section className="admin-main-body">
{active==="team"
?(teamTab==="Dealer"
?<Dealer dealers={dealers} loading={loadingDealers} setDealers={setDealers} games={games}/>
:<div className="admin-placeholder-card"><p className="admin-placeholder-title">Няма съдържание</p></div>)
:active==="games"
?<Game 
    games={
      gameTab==="Всички"
      ? games
      : gameTab==="Мъже"
        ? games.filter(g=>g.gender==="MALE" || g.gender===null)
        : games.filter(g=>g.gender==="FEMALE" || g.gender===null)
    }
    loading={loadingGames}
    setGames={setGames}
  />
:<div className="admin-placeholder-card"><p className="admin-placeholder-title">Няма данни за показване</p></div>}
</section>

</div></main>

</div>);
}
