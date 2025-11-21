"use client";import{useState}from"react";import"./Game.css";

export default function Game({games,loading,setGames}){
const[form,setForm]=useState(null),[saving,setSaving]=useState(false),[notify,setNotify]=useState(null),[delAsk,setDelAsk]=useState(false),[delName,setDelName]=useState("");

const note=(m,t="success")=>{setNotify({msg:m,type:t});setTimeout(()=>setNotify(null),4000)};
const openAdd=()=>setForm({id:null,name:"",gender:""});
const openEdit=g=>setForm({...g,gender:g.gender||""});
const close=()=>{setForm(null);setSaving(false);setNotify(null);setDelAsk(false);setDelName("")};
const ch=f=>e=>setForm(p=>({...p,[f]:e.target.value}));

const save=async e=>{e.preventDefault();if(!form)return;try{
setSaving(true);
const m=form.id?"PUT":"POST";
const s={id:form.id,name:form.name,gender:form.gender||null};
const r=await fetch("/api/Admin/Game/Add_Delete_Edit",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});
if(!r.ok)throw new Error();
const d=await r.json(),u=d.game||d;
setGames(x=>form.id?x.map(i=>i.id===u.id?u:i):[...x,u]);
note(form.id?"Запазено":"Добавено");
setForm({...form,id:u.id});
}catch{note("Грешка","error")}
finally{setSaving(false)}};

const del=async()=>{try{
const r=await fetch("/api/Admin/Game/Add_Delete_Edit",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id})});
if(!r.ok)throw new Error();
setGames(x=>x.filter(i=>i.id!==form.id));
note("Изтрито");
close();
}catch{note("Грешка","error")}};

return(<div className="game-wrap">

<div className="game-top"><button className="game-add-btn" onClick={openAdd}>Добави игра</button></div>

{!loading&&games.length>0&&(<div className="game-grid">
{games.map(g=>(<button key={g.id} className="game-card" onClick={()=>openEdit(g)}>
<div className="game-card-name">{g.name}</div>
<div className="game-card-gender">{g.gender==="MALE"?"Мъже":g.gender==="FEMALE"?"Жени":"Всички"}</div>
</button>))}
</div>)}

{form&&(
<div className="game-modal-back" onClick={close}>
<div className="game-modal" onClick={e=>e.stopPropagation()}>

<div className="game-modal-head">
<div>
<div className="game-modal-title">{form.id?`Редакция на ${form.name}`:"Добавяне на нова игра"}</div>
{form.id&&(<div className="game-modal-sub">ID: {form.id}</div>)}
</div>
{notify&&(<div className={"game-note "+notify.type}>{notify.msg}</div>)}
<button className="game-close" onClick={close}>✕</button>
</div>

<form className="game-form" onSubmit={save}>
<label>Име</label><input required value={form.name} onChange={ch("name")}/>
<label>Пол</label>
<select value={form.gender||""} onChange={ch("gender")}>
<option value="">Всички</option>
<option value="MALE">Мъже</option>
<option value="FEMALE">Жени</option>
</select>

<div className="game-actions">
<button type="submit" className="game-save" disabled={saving}>{saving?"...":"Запази"}</button>
{form.id&&(<button type="button" className="game-del" onClick={()=>setDelAsk(true)}>🗑 Изтрий</button>)}
</div>

{delAsk&&(
<div className="game-del-box">
<p>Въведете името на играта:</p>
<input className="game-del-input" value={delName} onChange={e=>setDelName(e.target.value)} placeholder="Име"/>
<button 
className="game-del-confirm"
disabled={delName!==form.name}
style={{opacity:delName===form.name?1:.4,cursor:delName===form.name?"pointer":"not-allowed"}}
onClick={()=>delName===form.name&&del()}
>🗑</button>
{delName&&delName!==form.name&&(<div className="game-del-warn">Грешно име</div>)}
</div>
)}

</form>

</div>
</div>
)}

</div>);
}
