"use client";import{useEffect,useState}from"react";import{useDealers}from"@/app/contexts/Contexts";import"./Dealer.css";

const P=Array.from({length:11},(_,i)=>i),cl=v=>Math.min(10,Math.max(0,Number(v)||0)),empty={id:null,firstName:"",middleName:"",lastName:"",nickname:"",email:"",gender:"",startDate:"",promotionCount:0,password:""};

export default function Dealer(){
const{dealers,setDealers,lastUpdate,setLastUpdate,loadDealers}=useDealers();
const[loading,setLoading]=useState(false),[listError,setListError]=useState(""),[form,setForm]=useState(null),[saving,setSaving]=useState(false),[confirmDelete,setConfirmDelete]=useState(false),[confirmNickname,setConfirmNickname]=useState(""),[notify,setNotify]=useState(null);

useEffect(()=>{if(!dealers.length)loadDealers();},[]);

useEffect(()=>{const t=setInterval(async()=>{const r=await fetch("/api/Admin/Changes");if(!r.ok)return;const d=await r.json();if(!d.lastUpdate)return;if(lastUpdate&&d.lastUpdate!==lastUpdate)loadDealers();setLastUpdate(d.lastUpdate)},5000);return()=>clearInterval(t)},[lastUpdate]);

const note=(m,t="success")=>{setNotify({msg:m,type:t});setTimeout(()=>setNotify(null),10000)};
const openEdit=d=>setForm({...d,startDate:d.startDate?new Date(d.startDate).toISOString().slice(0,10):"",promotionCount:cl(d.promotions??0),password:""});
const openAdd=()=>setForm({...empty});
const close=()=>{setForm(null);setSaving(false);setConfirmDelete(false);setConfirmNickname("");setNotify(null)};
const ch=f=>e=>setForm(p=>({...p,[f]:f==="promotionCount"?cl(e.target.value):e.target.value}));

const save=async e=>{e.preventDefault();if(!form)return;try{
setSaving(true);
const p={id:form.id,firstName:form.firstName,middleName:form.middleName,lastName:form.lastName,nickname:form.nickname,email:form.email,gender:form.gender,startDate:form.startDate?new Date(form.startDate).toISOString():null,promotionCount:cl(form.promotionCount)};
if(form.password.trim())p.password=form.password.trim();
const m=form.id?"PUT":"POST",u=form.id?"/api/Admin/Dealer/Edit":"/api/Admin/Dealer/Add";
const r=await fetch(u,{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
if(!r.ok)throw new Error("Грешка при запис.");
const d=await r.json(),uC=d.croupier||d;
setDealers(x=>form.id?x.map(z=>z.id===uC.id?uC:z):[...x,uC]);
note(form.id?"Промените бяха запазени успешно":"Крупието беше добавено успешно");
setForm({...form,id:uC.id,password:""});
}catch(err){note(form.id?"Промените не успяха да бъдат запазени":"Крупието не беше добавено","error")}
finally{setSaving(false);}
};

const del=async()=>{if(!form?.id)return;try{
const r=await fetch("/api/Admin/Dealer/Delete",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id})});
if(!r.ok)throw new Error();
setDealers(x=>x.filter(z=>z.id!==form.id));
note("Крупието беше изтрито успешно");close();
}catch{note("Крупието не беше изтрито","error")}};

return(<div className="admin-dealer-wrapper">

<div className="admin-dealer-header-subrow"><button className="btn-add" onClick={openAdd}>Добави дилър</button></div>
{listError&&(<span className="admin-dealer-sub admin-dealer-error">{listError}</span>)}
{!loading&&!listError&&dealers.length===0&&(<div className="admin-dealer-empty">Няма дилъри.</div>)}

{!loading&&!listError&&dealers.length>0&&(
<div className="admin-dealer-grid">
{dealers.map(d=>(
<button id={"dealer-"+d.id} key={d.id} className="admin-dealer-card admin-dealer-card-clickable" onClick={()=>openEdit(d)}>
<div className="admin-dealer-card-top">
<div className="admin-dealer-avatar">{String(d.nickname||d.firstName||"?").charAt(0).toUpperCase()}</div>
<div className="admin-dealer-main">
<div className="admin-dealer-name">{d.firstName} {d.middleName?d.middleName+" ":""}{d.lastName}</div>
<div className="admin-dealer-nickname">Псевдоним: <strong>{d.nickname}</strong></div>
</div>
</div>
<div className="admin-dealer-meta">
<span>Пол: {d.gender==="MALE"?"Мъж":d.gender==="FEMALE"?"Жена":"-"}</span>
{d.email&&(<span>Email: {d.email}</span>)}
{d.startDate&&(<span>От: {new Date(d.startDate).toLocaleDateString("bg-BG")}</span>)}
<span>Повишения: {d.promotions??0}</span>
</div>
</button>
))}
</div>
)}

{form&&(
<div className="admin-dealer-modal-backdrop" onClick={close}>
<div className="admin-dealer-modal" onClick={e=>e.stopPropagation()}>

<div className="admin-dealer-modal-header">
<div className="admin-dealer-modal-main">
<div className="admin-dealer-modal-avatar">{String(form.nickname||form.firstName||"?").charAt(0).toUpperCase()}</div>
<div><div className="admin-dealer-modal-title">{form.id?"Редакция":"Добавяне"} на {form.nickname||"нов дилър"}</div>{form.id&&(<div className="admin-dealer-modal-sub">ID: {form.id}</div>)}</div>
</div>

{notify&&(<div className={"notify-chip "+notify.type}>{notify.msg}</div>)}

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
<div><label>Повишения (0–10)</label><select value={form.promotionCount} onChange={ch("promotionCount")}>{P.map(n=>(<option key={n} value={n}>{n}</option>))}</select></div>
<div><label>{form.id?"Нова парола":"Парола"}</label><input required={!form.id} type="password" value={form.password} onChange={ch("password")}/></div>
</div>

<div className="admin-dealer-modal-actions">
<button type="submit" className="btn-save-modal" disabled={saving}>{saving?"Запазване...":"Запази"}</button>
{form.id&&(<button type="button" className="btn-delete-modal" onClick={()=>setConfirmDelete(true)}>🗑 Изтрий</button>)}
</div>

{confirmDelete&&(
<div className="confirm-delete-box">
<p>Напишете псевдонима на крупието</p>
<div className="confirm-delete-row">
<input className="confirm-delete-input" placeholder="Псевдоним" value={confirmNickname} onChange={e=>setConfirmNickname(e.target.value)}/>
<button className="confirm-delete-btn" disabled={confirmNickname!==form.nickname} style={{opacity:confirmNickname===form.nickname?1:.4,cursor:confirmNickname===form.nickname?"pointer":"not-allowed"}} onClick={()=>confirmNickname===form.nickname&&del()}>🗑</button>
</div>
{confirmNickname!==""&&confirmNickname!==form.nickname&&(<div className="confirm-warn">Грешен псевдоним</div>)}
</div>
)}

</form>
</div>
</div>
)}

</div>);
}
