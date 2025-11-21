"use client";import{useState}from"react";import"./Dealer.css";

export default function Dealer({dealers,loading,setDealers,games}){
const[listError,setListError]=useState(""),[form,setForm]=useState(null),[saving,setSaving]=useState(false),
[confirmDelete,setConfirmDelete]=useState(false),[confirmNickname,setConfirmNickname]=useState(""),
[notify,setNotify]=useState(null),[showPanel,setShowPanel]=useState(false);

const note=(m,t="success")=>{setNotify({msg:m,type:t});setTimeout(()=>setNotify(null),10000)};
const openEdit=d=>setForm({...d,startDate:d.startDate?new Date(d.startDate).toISOString().slice(0,10):"",promotionCount:d.promotions??0,password:"",gameIds:d.games?.map(g=>g.id)||[]});
const openAdd=()=>setForm({id:null,firstName:"",middleName:"",lastName:"",nickname:"",email:"",gender:"",startDate:"",promotionCount:0,password:"",gameIds:[]});
const close=()=>{setForm(null);setSaving(false);setConfirmDelete(false);setConfirmNickname("");setNotify(null);setShowPanel(false)};
const ch=f=>e=>setForm(p=>({...p,[f]:e.target.value}));
const toggleGame=id=>setForm(p=>({...p,gameIds:p.gameIds.includes(id)?p.gameIds.filter(x=>x!==id):[...p.gameIds,id]}));


const save=async e=>{e.preventDefault();if(!form)return;try{
setSaving(true);
const body={id:form.id,firstName:form.firstName,middleName:form.middleName,lastName:form.lastName,nickname:form.nickname,
email:form.email,gender:form.gender,startDate:form.startDate?new Date(form.startDate).toISOString():null,
promotionCount:form.promotionCount,password:form.password.trim()?form.password.trim():null,gameIds:form.gameIds};
const m=form.id?"PUT":"POST";
const r=await fetch("/api/Admin/Dealer/Add_Delete_Edit",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
if(!r.ok)throw 0;
const d=await r.json(),u=d.croupier||d;
setDealers(x=>form.id?x.map(z=>z.id===u.id?u:z):[...x,u]);
note(form.id?"Променено":"Добавено");
setForm({...form,id:u.id,password:""})
}catch{note("Грешка","error")}finally{setSaving(false)}};

const del=async()=>{try{
const r=await fetch("/api/Admin/Dealer/Add_Delete_Edit",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id})});
if(!r.ok)throw 0;
setDealers(x=>x.filter(z=>z.id!==form.id));note("Изтрито");close();
}catch{note("Грешка","error")}};

return(<div className="dealer-wrapper">

<div className="admin-dealer-header-subrow"><button className="btn-add" onClick={openAdd}>Добави дилър</button></div>
{listError&&<span className="admin-dealer-sub admin-dealer-error">{listError}</span>}
{!loading&&!listError&&dealers.length===0&&<div className="admin-dealer-empty">Няма дилъри.</div>}

{!loading&&!listError&&dealers.length>0&&(
<div className="admin-dealer-grid">
{dealers.map(d=>(
<button key={d.id} className="admin-dealer-card admin-dealer-card-clickable" onClick={()=>openEdit(d)}>
<div className="admin-dealer-card-top">
<div className="admin-dealer-avatar" data-letter={String(d.nickname||d.firstName||"?").charAt(0).toUpperCase()}></div>
<div className="admin-dealer-main">
<div className="admin-dealer-name">{d.firstName} {d.middleName?d.middleName+" ":""}{d.lastName}</div>
<div className="admin-dealer-nickname">Псевдоним: <strong>{d.nickname}</strong></div>
</div>
</div>
<div className="admin-dealer-meta">
<span>Пол: {d.gender==="MALE"?"Мъж":"Жена"}</span>
{d.email&&<span>Email: {d.email}</span>}
{d.startDate&&<span>От: {new Date(d.startDate).toLocaleDateString("bg-BG")}</span>}
<span>Повишения: {d.promotions??0}</span>
</div>
</button>
))}
</div>)}

{form&&(
<div className="admin-dealer-modal-backdrop" onClick={close}>
<div className="dealer-flex-wrap" onClick={e=>e.stopPropagation()}>

<div className="admin-dealer-modal">
<div className="admin-dealer-modal-header">
<div className="admin-dealer-modal-main">
<div className="admin-dealer-modal-avatar"><span>{String(form.nickname||form.firstName||"?").charAt(0).toUpperCase()}</span></div>
<div>
<div className="admin-dealer-modal-title">{form.id?"Редакция":"Добавяне"} на {form.nickname||"нов дилър"}</div>
{form.id&&<div className="admin-dealer-modal-sub">ID: {form.id}</div>}
</div>
</div>
{notify && <div className={"notify-chip " + notify.type}>{notify.msg}</div>}
<button className="dealer-settings-btn" onClick={() => setShowPanel(!showPanel)}>⚙</button>
<button className="btn-modal-close" onClick={close}>✕</button>
</div>

<form className="admin-dealer-modal-form" onSubmit={save}>
<div className="admin-dealer-modal-grid">
<div><label>Име</label><input required value={form.firstName} onChange={ch("firstName")}/></div>
<div><label>Презиме</label><input required value={form.middleName} onChange={ch("middleName")}/></div>
<div><label>Фамилия</label><input required value={form.lastName} onChange={ch("lastName")}/></div>
<div><label>Псевдоним</label><input required value={form.nickname} onChange={ch("nickname")}/></div>
<div><label>Email</label><input required type="email" value={form.email} onChange={ch("email")}/></div>
<div><label>Пол</label><select required value={form.gender} onChange={ch("gender")}><option value="">-</option><option value="MALE">Мъж</option><option value="FEMALE">Жена</option></select></div>
<div><label>Начална дата</label><input required type="date" value={form.startDate} onChange={ch("startDate")}/></div>
<div><label>Повишения</label><input type="number" min="0" max="10" value={form.promotionCount} onChange={ch("promotionCount")}/></div>
<div><label>{form.id?"Нова парола":"Парола"}</label><input required={!form.id} type="password" value={form.password} onChange={ch("password")}/></div>
</div>

<div className="admin-dealer-modal-actions">
<button type="submit" className="btn-save-modal" disabled={saving}>{saving?"Запазване...":"Запази"}</button>
{form.id&&<button type="button" className="btn-delete-modal" onClick={()=>setConfirmDelete(v=>!v)}>🗑 Изтрий</button>}
</div>

{confirmDelete&&(
<div className="confirm-delete-box">
<p>Напишете псевдонима</p>
<div className="confirm-delete-row">
<input className="confirm-delete-input" value={confirmNickname} onChange={e=>setConfirmNickname(e.target.value)}/>
<button className="confirm-delete-btn" disabled={confirmNickname!==form.nickname} onClick={()=>confirmNickname===form.nickname&&del()}>🗑</button>
</div>
{confirmNickname!==""&&confirmNickname!==form.nickname&&<div className="confirm-warn">Грешен псевдоним</div>}
</div>
)}
</form>
</div>

<div className={"dealer-side-panel "+(showPanel?"open":"")}>
<div className="dealer-side-title">Игри, които {form.nickname||"крупието"} знае:</div>
<div className="dealer-side-list">
{games.map(g=>(
<label key={g.id} className="dealer-side-item">
<input type="checkbox" checked={form.gameIds.includes(g.id)} onChange={()=>toggleGame(g.id)}/>
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
