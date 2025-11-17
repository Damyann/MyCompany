"use client";

import { useState } from "react";
import "./AdminDashboard.css";
import Team from "./Tеam/Team";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "requests", label: "Requests", icon: "📥" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "games", label: "Games", icon: "🎮" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "admin", label: "Admin", icon: "⚙️" },
];

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const activeItem = NAV_ITEMS.find((item) => item.id === active);
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
              <Team />
            ) : active === "games" ? (
              <div className="admin-placeholder-card">
                <p className="admin-placeholder-title">Games</p>
                <p className="admin-placeholder-sub">
                  Тук по-късно ще добавим управление на игрите.
                </p>
              </div>
            ) : (
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
