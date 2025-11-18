"use client";import{useEffect,useState}from"react";import"./Dealer.css";

const PROMOTION_VALUES=Array.from({length:11},(_,i)=>i);
const clampPromotion=v=>Math.min(10,Math.max(0,Number(v)||0));
const emptyForm={id:null,firstName:"",middleName:"",lastName:"",nickname:"",email:"",gender:"",startDate:"",promotionCount:0,password:""};

export default function Dealer(){
const[dealers,setDealers]=useState([]);const[loading,setLoading]=useState(true);const[listError,setListError]=useState("");const[form,setForm]=useState(null);
const[saving,setSaving]=useState(false);const[confirmDelete,setConfirmDelete]=useState(false);const[confirmNickname,setConfirmNickname]=useState("");
const[notify,setNotify]=useState(null); // ★ нов notification

useEffect(()=>{let a=true;(async()=>{try{const r=await fetch("/api/Admin/Dealer/List");if(!r.ok)throw new Error("Грешка при зареждане.");const d=await r.json();if(a)setDealers(d.croupiers||[]);}catch(e){if(a)setListError(e.message);}finally{if(a)setLoading(false);}})();return()=>a=false;},[]);

const showNotify=(msg,type="success")=>{setNotify({msg,type});setTimeout(()=>setNotify(null),10000);}; // ★ 10 секунди

const openEdit=d=>setForm({id:d.id,firstName:d.firstName||"",middleName:d.middleName||"",lastName:d.lastName||"",nickname:d.nickname||"",email:d.email||"",gender:d.gender||"",startDate:d.startDate?new Date(d.startDate).toISOString().slice(0,10):"",promotionCount:clampPromotion(d.promotions??0),password:""});
const openAdd=()=>setForm({...emptyForm});
const closeModal=()=>{setForm(null);setSaving(false);setConfirmDelete(false);setConfirmNickname("");setNotify(null);};
const handleChange=f=>e=>setForm(p=>({...p,[f]:f==="promotionCount"?clampPromotion(e.target.value):e.target.value}));

const handleSubmit=async e=>{
e.preventDefault();if(!form)return;
try{
setSaving(true);
const payload={id:form.id,firstName:form.firstName,middleName:form.middleName,lastName:form.lastName,nickname:form.nickname,email:form.email,gender:form.gender,startDate:form.startDate?new Date(form.startDate).toISOString():null,promotionCount:clampPromotion(form.promotionCount)};
if(form.password.trim())payload.password=form.password.trim();
const method=form.id?"PUT":"POST";
const url=form.id?"/api/Admin/Dealer/Edit":"/api/Admin/Dealer/Add";
const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
if(!r.ok)throw new Error("Грешка при запис.");
const data=await r.json();const updated=data.croupier||data;
setDealers(prev=>form.id?prev.map(x=>x.id===updated.id?updated:x):[...prev,updated]);
showNotify(form.id?"Промените бяха запазени успешно":"Крупието беше добавено успешно","success");
setForm({...form,id:updated.id,password:""});
}catch(e){
showNotify(form.id?"Промените не успяха да бъдат запазени":"Крупието не беше добавено","error");
}finally{setSaving(false);}
};

const handleDelete=async()=>{if(!form?.id)return;try{
const r=await fetch("/api/Admin/Dealer/Delete",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id})});
if(!r.ok)throw new Error("Грешка при изтриване.");
setDealers(prev=>prev.filter(d=>d.id!==form.id));
showNotify("Крупието беше изтрито успешно","success");
closeModal();
}catch(e){showNotify("Крупието не беше изтрито","error");}};

return(<div className="admin-dealer-wrapper">

<div className="admin-dealer-header-subrow"><button className="btn-add" onClick={openAdd}>👤 Добави дилър</button></div>
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
<div className="admin-dealer-modal-backdrop" onClick={closeModal}>
<div className="admin-dealer-modal" onClick={e=>e.stopPropagation()}>

<div className="admin-dealer-modal-header">
<div className="admin-dealer-modal-main">
<div className="admin-dealer-modal-avatar">{String(form.nickname||form.firstName||"?").charAt(0).toUpperCase()}</div>
<div><div className="admin-dealer-modal-title">{form.id?"Редакция":"Добавяне"} на {form.nickname||"нов дилър"}</div>{form.id&&(<div className="admin-dealer-modal-sub">ID: {form.id}</div>)}</div>
</div>

{notify&&(<div className={"notify-chip "+notify.type}>{notify.msg}</div>)} {/* ★ нов badge */}

<button className="btn-modal-close" onClick={closeModal}>✕</button>
</div>

<form className="admin-dealer-modal-form" onSubmit={handleSubmit}>
<div className="admin-dealer-modal-grid">
<div><label>Име</label><input required value={form.firstName} onChange={handleChange("firstName")}/></div>
<div><label>Презиме</label><input required value={form.middleName} onChange={handleChange("middleName")}/></div>
<div><label>Фамилия</label><input required value={form.lastName} onChange={handleChange("lastName")}/></div>
<div><label>Псевдоним</label><input required value={form.nickname} onChange={handleChange("nickname")}/></div>
<div><label>Email</label><input required type="email" value={form.email} onChange={handleChange("email")}/></div>
<div><label>Пол</label><select required value={form.gender} onChange={handleChange("gender")}><option value="">-</option><option value="MALE">Мъж</option><option value="FEMALE">Жена</option></select></div>
<div><label>Начална дата</label><input required type="date" value={form.startDate} onChange={handleChange("startDate")}/></div>
<div><label>Повишения (0–10)</label><select value={form.promotionCount} onChange={handleChange("promotionCount")}>{PROMOTION_VALUES.map(n=>(<option key={n} value={n}>{n}</option>))}</select></div>
<div><label>{form.id?"Нова парола":"Парола"}</label><input required={!form.id} type="password" value={form.password} onChange={handleChange("password")}/></div>
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
<button className="confirm-delete-btn" disabled={confirmNickname!==form.nickname} style={{opacity:confirmNickname===form.nickname?1:.4,cursor:confirmNickname===form.nickname?"pointer":"not-allowed"}} onClick={()=>confirmNickname===form.nickname&&handleDelete()}>🗑</button>
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
