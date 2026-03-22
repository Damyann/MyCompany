"use client";
import{useState}from"react";
import{useRouter}from"next/navigation";
import"./LoginForm.css";

export default function LoginForm(){
  const router=useRouter();
  const[nickname,setNickname]=useState("");
  const[password,setPassword]=useState("");
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);

  async function handleSubmit(e){
    e.preventDefault();
    setError("");
    if(!nickname||!password){setError("Попълни псевдоним и парола.");return;}

    try{
      setLoading(true);
      const res=await fetch("/api/login",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nickname,username:nickname,password}),
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok){setError(data.error||"Неуспешен вход.");return;}

      const raw=String(data.accountRole??data.role??"");
      const upper=raw.toUpperCase();
      const lower=raw.toLowerCase();

      if(lower==="admin"||upper==="ADMIN"||upper==="MAIN_PITBOSS") router.push("/admin");
      else if(lower==="croupier"||upper==="STAFF") router.push("/croupier");
      else setError("Неизвестен тип потребител.");
    }catch(err){
      console.error(err);
      setError("Грешка при връзката със сървъра.");
    }finally{
      setLoading(false);
    }
  }

  return(
    <section className="login-card">
      <header className="login-header">
        <h1>Добре дошъл, крупие 🎲</h1>
        <p>Влез в панела, за да управляваш смените и служебните заявки.</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="nickname">Псевдоним</label>
          <input id="nickname" type="text" placeholder="Kai" value={nickname} onChange={e=>setNickname(e.target.value)} />
        </div>

        <div className="login-field">
          <label htmlFor="password">Парола</label>
          <input id="password" type="password" placeholder="Парола" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>

        {error&&<p className="login-error">{error}</p>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading?"Влизане...":"Влез в системата"}
        </button>
      </form>

      <p className="login-note">Входът е само за оторизиран персонал на казиното.</p>
    </section>
  );
}
