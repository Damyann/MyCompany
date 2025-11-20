"use client";import{useState,useRef,useEffect}from"react";import"./AdminDashboard.css";import Dealer from"./Team/Dealer";

const NAV_ITEMS=[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"requests",label:"Requests",icon:"📥"},{id:"calendar",label:"Calendar",icon:"📅"},{id:"team",label:"Team",icon:"👥"},{id:"games",label:"Games",icon:"🎮"},{id:"reports",label:"Reports",icon:"📊"},{id:"admin",label:"Admin",icon:"⚙️"}];
const TEAM_TABS=["Dealer","Pitboss","QA","Training"];

export default function AdminDashboard(){
const[active,setActive]=useState("dashboard"),[teamTab,setTeamTab]=useState("Dealer"),tabRefs=useRef([]),[indicatorStyle,setIndicatorStyle]=useState({});
const[dealers,setDealers]=useState([]),[loadingDealers,setLoadingDealers]=useState(true);

useEffect(()=>{(async()=>{try{
 const r=await fetch("/api/Admin/Dealer/List");
 if(r.ok){const d=await r.json();setDealers(d.croupiers||[]);}
}finally{setLoadingDealers(false);} })();
},[]);

useEffect(()=>{if(active!=="team")return;const el=tabRefs.current[TEAM_TABS.indexOf(teamTab)];if(el)setIndicatorStyle({width:el.offsetWidth,left:el.offsetLeft});},[teamTab,active]);

return(<div className="admin-layout">

<aside className="admin-sidebar">
<div className="admin-logo-block"><div className="admin-logo-dot"/><div className="admin-logo-text"><span className="admin-logo-title">Control Panel</span><span className="admin-logo-sub">Casino Staff</span></div></div>
<nav className="admin-nav">{NAV_ITEMS.map(i=>(<button key={i.id} className={"admin-nav-item"+(i.id===active?" admin-nav-item-active":"")} onClick={()=>setActive(i.id)}><span className="admin-nav-icon">{i.icon}</span><span className="admin-nav-label">{i.label}</span></button>))}</nav>
<div className="admin-sidebar-footer"><div className="admin-status-dot"/><span className="admin-status-text">Secure session active</span></div>
</aside>

<main className="admin-main"><div className="admin-main-shell">

<header className="admin-main-header TeamTabs-header">
<h1>{active==="team"?"Team":NAV_ITEMS.find(i=>i.id===active)?.label}</h1>
{active==="team"&&(<div className="TeamTabs">{TEAM_TABS.map((t,i)=>(<button key={t} ref={el=>tabRefs.current[i]=el} className={"TeamTabs-btn"+(teamTab===t?" TeamTabs-btn-active":"")} onClick={()=>setTeamTab(t)}>{t}</button>))}<div className="TeamTabs-indicator" style={indicatorStyle}/></div>)}
</header>

<section className="admin-main-body">
{active!=="team"
?(<div className="admin-placeholder-card"><p className="admin-placeholder-title">Няма данни за показване</p></div>)
:teamTab==="Dealer"
?(<Dealer dealers={dealers} loading={loadingDealers} setDealers={setDealers}/>)
:(<div className="admin-placeholder-card"><p className="admin-placeholder-title">Няма съдържание</p></div>)}
</section>

</div></main>
</div>);
}
