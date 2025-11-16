import "./AdminDashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-screen">
      <div className="admin-card">
        <header className="admin-header">
          <h1>Админ панел</h1>
          <p>Тук по-късно ще управляваш крупиета, заявки и графици.</p>
        </header>

        <div className="admin-grid">
          <section className="admin-widget">
            <h2>Крупиета</h2>
            <p>Списък с всички крупиета и техния статус.</p>
          </section>
          <section className="admin-widget">
            <h2>Заявки</h2>
            <p>Тук ще виждаш отворени заявки за смени, отпуски и др.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
