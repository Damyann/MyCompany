import "./CroupierDashboard.css";

export default function CroupierDashboard() {
  return (
    <div className="croupier-screen">
      <div className="croupier-card">
        <header className="croupier-header">
          <h1>Панел на крупие</h1>
          <p>Тук ще виждаш своя график и заявките си.</p>
        </header>

        <section className="croupier-section">
          <h2>Моят график</h2>
          <p>По-късно тук ще показваме конкретните ти смени.</p>
        </section>

        <section className="croupier-section">
          <h2>Моите заявки</h2>
          <p>Тук ще се появят всички твои заявки за смени/отпуски.</p>
        </section>
      </div>
    </div>
  );
}
