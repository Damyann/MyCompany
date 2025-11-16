"use client";

import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import "./team.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "requests", label: "Requests", icon: "📥" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "admin", label: "Admin", icon: "⚙️" },
];

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const activeItem = NAV_ITEMS.find((item) => item.id === active);

  // ---- Състояние само за TEAM ----
  const [team, setTeam] = useState([]);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");

  // Когато натиснем "Team" за първи път -> зареждаме от /api/admin/team
  useEffect(() => {
    if (active !== "team") return;        // не сме на Team
    if (teamLoaded || teamLoading) return; // вече е заредено или се зарежда

    async function loadTeam() {
      try {
        setTeamLoading(true);
        setTeamError("");

        const res = await fetch("/api/admin/team");
        if (!res.ok) {
          throw new Error("Грешка при зареждане на крупиетата.");
        }

        const data = await res.json();
        setTeam(data.croupiers || []);
        setTeamLoaded(true);
      } catch (err) {
        setTeamError(err.message || "Непозната грешка.");
      } finally {
        setTeamLoading(false);
      }
    }

    loadTeam();
  }, [active, teamLoaded, teamLoading]);

  // ---- UI ----
  return (
    <div className="admin-layout">
      {/* Сайдбар */}
      <aside className="admin-sidebar">
        <div className="admin-logo-block">
          <div className="admin-logo-dot" />
          <div className="admin-logo-text">
            <span className="admin-logo-title">Control Panel</span>
            <span className="admin-logo-sub">Casino Staff</span>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={
                "admin-nav-item" +
                (item.id === active ? " admin-nav-item-active" : "")
              }
              onClick={() => setActive(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-status-dot" />
          <span className="admin-status-text">Secure session active</span>
        </div>
      </aside>

      {/* Главна част */}
      <main className="admin-main">
        <div className="admin-main-shell">
          <header className="admin-main-header">
            <h1>{activeItem?.label || "Dashboard"}</h1>
          </header>

          <section className="admin-main-body">
            {active === "team" ? (
              // -------- TEAM ЕКРАН --------
              <div className="admin-team-wrapper">
                <div className="admin-team-header">
                  <span className="admin-team-title">Team</span>

                  {teamLoading && (
                    <span className="admin-team-sub">
                      Зареждане на крупиетата…
                    </span>
                  )}

                  {teamError && (
                    <span className="admin-team-sub admin-team-error">
                      {teamError}
                    </span>
                  )}

                  {!teamLoading && !teamError && (
                    <span className="admin-team-sub">
                      Налични крупиета:{" "}
                      <span className="admin-team-count">
                        {team.length}
                      </span>
                    </span>
                  )}
                </div>

                {!teamLoading && !teamError && team.length === 0 && (
                  <div className="admin-team-empty">
                    Няма регистрирани крупиета.
                  </div>
                )}

                {!teamLoading && !teamError && team.length > 0 && (
                  <div className="admin-team-grid">
                    {team.map((c) => (
                      <div key={c.id} className="admin-team-card">
                        <div className="admin-team-card-top">
                          <div className="admin-team-avatar">
                            {(c.nickname || c.firstName || "?")
                              .toString()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="admin-team-main">
                            <div className="admin-team-name">
                              {c.firstName}{" "}
                              {c.lastName ? c.lastName : ""}
                            </div>
                            <div className="admin-team-nickname">
                              Псевдоним: <strong>{c.nickname}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="admin-team-meta">
                          <span>
                            Пол:{" "}
                            {c.gender === "MALE"
                              ? "Мъж"
                              : c.gender === "FEMALE"
                              ? "Жена"
                              : "n/a"}
                          </span>
                          {c.email && <span>Email: {c.email}</span>}
                          {c.startDate && (
                            <span>
                              От:{" "}
                              {new Date(
                                c.startDate
                              ).toLocaleDateString("bg-BG")}
                            </span>
                          )}
                          <span>
                            Повишения: {c.promotionCount ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // -------- Останалите табове (Dashboard, Requests...) --------
              <div className="admin-placeholder-card">
                <p className="admin-placeholder-title">
                  Няма данни за показване
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
