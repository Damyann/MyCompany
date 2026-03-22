import LoginForm from "../components/Login/LoginForm";

export default function Home() {
  return (
<main className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
