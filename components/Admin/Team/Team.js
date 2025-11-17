"use client";
import { useEffect, useState } from "react";
import "./Team.css";

const PROMOTION_VALUES = Array.from({ length: 11 }, (_, i) => i);

function clampPromotion(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

const emptyForm = {
  id: null,
  firstName: "",
  middleName: "",
  lastName: "",
  nickname: "",
  email: "",
  gender: "",
  startDate: "",
  promotionCount: 0,
  password: ""
};

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/team");
        if (!r.ok) throw new Error("Грешка при зареждане.");
        const d = await r.json();
        if (active) setTeam(d.croupiers || []);
      } catch (e) {
        if (active) setListError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => (active = false);
  }, []);

  const openEdit = c =>
    setForm({
      id: c.id,
      firstName: c.firstName || "",
      middleName: c.middleName || "",
      lastName: c.lastName || "",
      nickname: c.nickname || "",
      email: c.email || "",
      gender: c.gender || "",
      startDate: c.startDate
        ? new Date(c.startDate).toISOString().slice(0, 10)
        : "",
      promotionCount: clampPromotion(c.promotions ?? 0),
      password: ""
    });

  const openAdd = () => setForm({ ...emptyForm });

  const closeModal = () => {
    setForm(null);
    setSaving(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const handleChange = field => e =>
    setForm(prev => ({
      ...prev,
      [field]:
        field === "promotionCount"
          ? clampPromotion(e.target.value)
          : e.target.value
    }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form) return;

    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess("");

      const payload = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        nickname: form.nickname,
        email: form.email,
        gender: form.gender,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        promotionCount: clampPromotion(form.promotionCount)
      };

      if (form.password.trim()) payload.password = form.password.trim();

      const method = form.id ? "PUT" : "POST";
      const url = form.id
        ? `/api/admin/team/${form.id}`
        : `/api/admin/team`;

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!r.ok) throw new Error("Грешка при запис.");

      const data = await r.json();
      const updated = data.croupier || data;

      if (form.id) {
        setTeam(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      } else {
        setTeam(prev => [...prev, updated]);
      }

      setSaveSuccess("Успешно записано.");
      setForm({ ...form, id: updated.id, password: "" });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-team-wrapper">
      <div className="admin-team-header-subrow">
        <button className="admin-team-add" type="button" onClick={openAdd}>
          ➕ Добави крупие
        </button>
      </div>

      {listError && (
        <span className="admin-team-sub admin-team-error">{listError}</span>
      )}

      {!loading && !listError && team.length === 0 && (
        <div className="admin-team-empty">Няма крупиета.</div>
      )}

      {!loading && !listError && team.length > 0 && (
        <div className="admin-team-grid">
          {team.map(c => (
            <button
              key={c.id}
              type="button"
              className="admin-team-card admin-team-card-clickable"
              onClick={() => openEdit(c)}
            >
              <div className="admin-team-card-top">
                <div className="admin-team-avatar">
                  {String(c.nickname || c.firstName || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="admin-team-main">
                  <div className="admin-team-name">
                    {c.firstName} {c.middleName ? c.middleName + " " : ""} {c.lastName}
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
                    : "-"}
                </span>
                {c.email && <span>Email: {c.email}</span>}
                {c.startDate && (
                  <span>
                    От: {new Date(c.startDate).toLocaleDateString("bg-BG")}
                  </span>
                )}
                <span>Повишения: {c.promotions ?? 0}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {form && (
        <div className="admin-team-modal-backdrop" onClick={closeModal}>
          <div
            className="admin-team-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-team-modal-header">
              <div className="admin-team-modal-main">
                <div className="admin-team-modal-avatar">
                  {String(form.nickname || form.firstName || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="admin-team-modal-title">
                    {form.id ? "Редакция" : "Добавяне"} на {form.nickname || "ново крупие"}
                  </div>
                  {form.id && (
                    <div className="admin-team-modal-sub">ID: {form.id}</div>
                  )}
                </div>
              </div>

              <button className="admin-team-modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="admin-team-modal-form" onSubmit={handleSubmit}>
              <div className="admin-team-modal-grid">
                <div>
                  <label>Име</label>
                  <input required value={form.firstName} onChange={handleChange("firstName")} />
                </div>
                <div>
                  <label>Презиме</label>
                  <input required value={form.middleName} onChange={handleChange("middleName")} />
                </div>
                <div>
                  <label>Фамилия</label>
                  <input required value={form.lastName} onChange={handleChange("lastName")} />
                </div>
                <div>
                  <label>Псевдоним</label>
                  <input required value={form.nickname} onChange={handleChange("nickname")} />
                </div>
                <div>
                  <label>Email</label>
                  <input required type="email" value={form.email} onChange={handleChange("email")} />
                </div>
                <div>
                  <label>Пол</label>
                  <select required value={form.gender} onChange={handleChange("gender")}>
                    <option value="">-</option>
                    <option value="MALE">Мъж</option>
                    <option value="FEMALE">Жена</option>
                  </select>
                </div>
                <div>
                  <label>Начална дата</label>
                  <input required type="date" value={form.startDate} onChange={handleChange("startDate")} />
                </div>
                <div>
                  <label>Повишения (0–10)</label>
                  <select value={form.promotionCount} onChange={handleChange("promotionCount")}>
                    {PROMOTION_VALUES.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{form.id ? "Нова парола" : "Парола"}</label>
                  <input
                    required={!form.id}
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                  />
                </div>
              </div>

              {saveError && <div className="admin-team-modal-error">{saveError}</div>}
              {saveSuccess && <div className="admin-team-modal-success">{saveSuccess}</div>}

              <div className="admin-team-modal-actions">
                <button type="button" className="admin-team-button-ghost" onClick={closeModal}>
                  Затвори
                </button>
                <button type="submit" className="admin-team-button" disabled={saving}>
                  {saving ? "Запазване..." : "Запази"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
