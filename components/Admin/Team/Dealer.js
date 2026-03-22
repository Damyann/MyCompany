// components/Admin/Team/Dealer.js
"use client";import{useState}from"react";import"./Team.css";import"./Dealer.css";

export default function Dealer({dealers,loading,setDealers,games}) {
const[listError,setListError]=useState(""),[form,setForm]=useState(null),[saving,setSaving]=useState(false),
[confirmDelete,setConfirmDelete]=useState(false),[confirmNickname,setConfirmNickname]=useState(""),
[notify,setNotify]=useState(null),[showPanel,setShowPanel]=useState(false),
[genderFilter,setGenderFilter]=useState("ALL"),[nickFilter,setNickFilter]=useState("");

const totalCount=dealers?.length||0;
const femaleCount=(dealers||[]).filter(d=>d.gender==="FEMALE").length;
const maleCount=(dealers||[]).filter(d=>d.gender==="MALE").length;
const q=nickFilter.trim().toLowerCase();
const filteredDealers=(dealers||[]).filter(d=>{
if(genderFilter!=="ALL"&&d.gender!==genderFilter)return false;
if(q&&!String(d.nickname||"").toLowerCase().includes(q))return false;
return true;
});

const note=(m,t="success")=>{setNotify({msg:m,type:t});setTimeout(()=>setNotify(null),10000)};
const gameIdsOf=gs=>(Array.isArray(gs)?gs.map(x=>x?.id??x?.game?.id).filter(Boolean):[]);
const promoOf=x=>(x?.promotionCount??x?.promotions??0);

const openEdit=d=>setForm({
...d,
middleName:d?.middleName??"",
email:d?.email??"",
startDate:d?.startDate?new Date(d.startDate).toISOString().slice(0,10):"",
promotionCount:promoOf(d),
password:"",
gameIds:gameIdsOf(d?.games),
});
const openAdd=()=>setForm({id:null,firstName:"",middleName:"",lastName:"",nickname:"",email:"",gender:"",startDate:"",promotionCount:0,password:"",gameIds:[]});
const close=()=>{setForm(null);setSaving(false);setConfirmDelete(false);setConfirmNickname("");setNotify(null);setShowPanel(false)};
const ch=f=>e=>setForm(p=>({...p,[f]:e.target.value}));

// Game can be for ALL / MALE / FEMALE.
// If the game is ALL (or null/undefined), it should be selectable for everyone.
const gameDisabled=g=>!!(form?.gender&&g?.gender&&g.gender!=="ALL"&&g.gender!==form.gender);
const toggleGame=id=>setForm(p=>{
const g=games?.find(x=>x.id===id);
if(g&&gameDisabled(g))return p;
return({...p,gameIds:p.gameIds.includes(id)?p.gameIds.filter(x=>x!==id):[...p.gameIds,id]});
});

const save=async e=>{
e.preventDefault();if(!form)return;
try{
setSaving(true);
const body={
id:form.id,
firstName:form.firstName,
middleName:form.middleName,
lastName:form.lastName,
nickname:form.nickname,
email:form.email,
gender:form.gender,
startDate:form.startDate?new Date(form.startDate).toISOString():null,
promotionCount:Number(form.promotionCount)||0,
password:form.password.trim()?form.password.trim():null,
gameIds:form.gameIds,
};
const m=form.id?"PUT":"POST";
const r=await fetch("/api/Admin/Dealer/Add_Delete_Edit",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const d=await r.json().catch(()=>({}));
if(!r.ok)throw new Error(d?.error||"Грешка");
const u=d.croupier||d;
setDealers(x=>form.id?x.map(z=>z.id===u.id?u:z):[...x,u]);
note(form.id?"Променено":"Добавено");
setForm(p=>({...p,id:u.id,password:""}));
}catch(err){note(err?.message||"Грешка","error")}finally{setSaving(false)}
};

const del=async()=>{
try{
const r=await fetch("/api/Admin/Dealer/Add_Delete_Edit",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id})});
const d=await r.json().catch(()=>({}));
if(!r.ok)throw new Error(d?.error||"Грешка");
setDealers(x=>x.filter(z=>z.id!==form.id));note("Изтрито");close();
}catch(err){note(err?.message||"Грешка","error")}
};

return(<div className="team-wrapper">

<div className="team-header">
<button className="team-btn-add" onClick={openAdd}>Добави дилър</button>

<div className="team-controls">
<div className="team-filters">
<button type="button" className={"team-filter-btn"+(genderFilter==="ALL"?" active":"")} onClick={()=>setGenderFilter("ALL")}>Всички<span className="team-filter-count">{totalCount}</span></button>
<button type="button" className={"team-filter-btn"+(genderFilter==="FEMALE"?" active":"")} onClick={()=>setGenderFilter("FEMALE")}>Жени<span className="team-filter-count">{femaleCount}</span></button>
<button type="button" className={"team-filter-btn"+(genderFilter==="MALE"?" active":"")} onClick={()=>setGenderFilter("MALE")}>Мъже<span className="team-filter-count">{maleCount}</span></button>
</div>
<div className="team-search">
<input value={nickFilter} onChange={e=>setNickFilter(e.target.value)} placeholder="Филтър по прякор (nickname)" />
</div>
</div>
</div>

{listError&&<span className="team-sub team-error">{listError}</span>}
{!loading&&!listError&&dealers.length===0&&<div className="team-empty">Няма дилъри.</div>}
{!loading&&!listError&&dealers.length>0&&filteredDealers.length===0&&<div className="team-empty">Няма резултати.</div>}

{!loading&&!listError&&filteredDealers.length>0&&(
<div className="team-grid">
{filteredDealers.map(d=>(
<button key={d.id} className="team-card team-card-clickable" onClick={()=>openEdit(d)}>
<div className="team-card-top">
<div className="team-avatar" data-letter={String(d.nickname||d.firstName||"?").charAt(0).toUpperCase()}></div>
<div className="team-main">
<div className="team-name">{d.firstName} {d.middleName?d.middleName+" ":""}{d.lastName}</div>
<div className="team-nickname">Псевдоним: <strong>{d.nickname}</strong></div>
</div>
</div>
<div className="team-meta">
<span>Пол: {d.gender==="MALE"?"Мъж":"Жена"}</span>
{d.email&&<span>Email: {d.email}</span>}
{d.startDate&&<span>От: {new Date(d.startDate).toLocaleDateString("bg-BG")}</span>}
<span>Повишения: {promoOf(d)}</span>
</div>
</button>
))}
</div>
)}

{form&&(
<div className="team-backdrop" onClick={close}>
<div className="team-modal-wrap" onClick={e=>e.stopPropagation()}>

<div className="team-modal">
<div className="team-modal-header">
<div className="team-modal-main">
<div className="team-modal-avatar"><span>{String(form.nickname||form.firstName||"?").charAt(0).toUpperCase()}</span></div>
<div>
<div className="team-modal-title">{form.id?"Редакция":"Добавяне"} на {form.nickname||"нов дилър"}</div>
{form.id&&<div className="team-modal-sub">ID: {form.id}</div>}
</div>
</div>
{notify&&<div className={"team-notify "+notify.type}>{notify.msg}</div>}
<button type="button" className="dealer-settings-btn" onClick={()=>setShowPanel(!showPanel)}>⚙</button>
<button type="button" className="team-modal-close" onClick={close}>✕</button>
</div>

<form className="team-form" onSubmit={save}>
<div className="team-form-grid">
<div><label>Име</label><input required value={form.firstName} onChange={ch("firstName")}/></div>
<div><label>Презиме</label><input required value={form.middleName} onChange={ch("middleName")}/></div>
<div><label>Фамилия</label><input required value={form.lastName} onChange={ch("lastName")}/></div>
<div><label>Псевдоним</label><input required value={form.nickname} onChange={ch("nickname")}/></div>
<div><label>Email</label><input required type="email" value={form.email} onChange={ch("email")}/></div>
<div><label>Пол</label>
<select required value={form.gender} onChange={ch("gender")}>
<option value="">-</option><option value="MALE">Мъж</option><option value="FEMALE">Жена</option>
</select>
</div>
<div><label>Начална дата</label><input required type="date" value={form.startDate} onChange={ch("startDate")}/></div>
<div><label>Повишения</label><input type="number" min="0" max="10" value={form.promotionCount} onChange={ch("promotionCount")}/></div>
<div><label>{form.id?"Нова парола":"Парола"}</label><input required={!form.id} type="password" value={form.password} onChange={ch("password")}/></div>
</div>

<div className="team-actions">
<button type="submit" className="team-btn-save" disabled={saving}>{saving?"Запазване...":"Запази"}</button>
{form.id&&<button type="button" className="team-btn-delete" onClick={()=>setConfirmDelete(v=>!v)}>🗑 Изтрий</button>}
</div>

{confirmDelete&&(
<div className="team-confirm">
<p>Напишете псевдонима</p>
<div className="team-confirm-row">
<input className="team-confirm-input" value={confirmNickname} onChange={e=>setConfirmNickname(e.target.value)}/>
<button className="team-confirm-btn" disabled={confirmNickname!==form.nickname} onClick={()=>confirmNickname===form.nickname&&del()}>🗑</button>
</div>
{confirmNickname!==""&&confirmNickname!==form.nickname&&<div className="team-confirm-warn">Грешен псевдоним</div>}
</div>
)}
</form>
</div>

<div className={"dealer-side-panel "+(showPanel?"open":"")}>
<div className="dealer-side-title">Игри:</div>
<div className="dealer-side-list">
{(games||[]).map(g=>(
<label key={g.id} className={"dealer-side-item "+(gameDisabled(g)?"disabled":"")}>
{gameDisabled(g)?<div className="dealer-lock"></div>:<input type="checkbox" checked={form.gameIds.includes(g.id)} onChange={()=>toggleGame(g.id)}/>}
<span>{g.name}</span>
</label>
))}
</div>
</div>

</div>
</div>
)}

</div>);
}
