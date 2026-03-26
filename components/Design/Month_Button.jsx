"use client";
import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.4, 0, 0.2, 1];
const MONTH_CODES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_BG = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
const MONTH_INDEX = Object.fromEntries(MONTH_CODES.map((m, i) => [m, i + 1]));

const parseValue = value => {
  if (!value || value === "-") return { year: 0, month: 1, mode: "tag", valid: false };
  if (typeof value === "object") {
    const year = +value.year || 0;
    const month = +value.month || 1;
    return { year, month, mode: value.mode || "tag", valid: !!(year && month) };
  }
  const s = String(value).trim();
  const up = s.toUpperCase();
  if (up.includes("-")) {
    const [year, month] = up.split("-").map(Number);
    return { year: year || 0, month: month || 1, mode: "ym", valid: !!(year && month) };
  }
  const tag = up.match(/^([A-Z]{3})(\d{2})$/);
  if (tag) return { year: 2000 + +tag[2], month: MONTH_INDEX[tag[1]] || 1, mode: "tag", valid: true };
  const compact = up.match(/^(\d{4})(\d{2})$/);
  if (compact) return { year: +compact[1] || 0, month: +compact[2] || 1, mode: "ym", valid: true };
  return { year: 0, month: 1, mode: "tag", valid: false };
};

const formatTag = ({ year, month }) => `${MONTH_CODES[(month - 1 + 12) % 12]}${String(year).slice(-2)}`;
const formatOutput = (mode, value) => (mode === "ym" ? `${value.year}-${String(value.month).padStart(2, "0")}` : formatTag(value));
const formatDisplay = ({ year, month }) => `${MONTH_BG[(month - 1 + 12) % 12] || ""} ${year || ""}`.trim();

const XIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M8 10.5l4 4 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function MonthIcon({ className = "" }) {
  const id = useId().replace(/:/g, "");
  const gradientId = `mg_${id}`;
  const fillId = `mf_${id}`;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity=".98" />
          <stop offset=".6" stopColor="currentColor" stopOpacity=".82" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".64" />
        </linearGradient>
        <radialGradient id={fillId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(9.2 9) rotate(50) scale(15 12)">
          <stop offset="0" stopColor="currentColor" stopOpacity=".14" />
          <stop offset=".6" stopColor="currentColor" stopOpacity=".05" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".02" />
        </radialGradient>
      </defs>
      <path d="M7.2 6.9h9.6c1.1 0 2 .9 2 2v9.1c0 1.1-.9 2-2 2H7.2c-1.1 0-2-.9-2-2V8.9c0-1.1.9-2 2-2Z" fill={`url(#${fillId})`} />
      <path d="M7.2 6.9h9.6c1.1 0 2 .9 2 2v9.1c0 1.1-.9 2-2 2H7.2c-1.1 0-2-.9-2-2V8.9c0-1.1.9-2 2-2Z" stroke={`url(#${gradientId})`} strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M7.1 10.2h11.8" stroke="currentColor" strokeOpacity=".32" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M9 5.7v2.6M15 5.7v2.6" stroke={`url(#${gradientId})`} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8.6 12.6h2.2M13.2 12.6h2.2M8.6 15.6h2.2M13.2 15.6h2.2" stroke="currentColor" strokeOpacity=".38" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function FoldToggle({ open }) {
  return (
    <motion.span
      initial={false}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.7 }}
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(10,21,34,.96),rgba(4,9,15,.96))] text-white/90 shadow-[0_12px_26px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.05)]"
    >
      <span className="absolute inset-px rounded-[11px] bg-[radial-gradient(80px_42px_at_30%_18%,rgba(255,255,255,.08),transparent_64%)]" />
      <span className="absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,255,210,.05)]" />
      <ChevronIcon className="relative h-4.5 w-4.5" />
    </motion.span>
  );
}

function MonthChip({ selected, disabled, label, onClick }) {
  const enabled = !disabled;
  return (
    <button type="button" disabled={!enabled} onClick={enabled ? onClick : undefined} className={`group relative ${enabled ? "" : "cursor-not-allowed opacity-55"}`}>
      <div
        className={`relative box-border rounded-[12px] border-2 transition-[transform,border-color,background-color,box-shadow] duration-150 ${
          selected
            ? "border-emerald-400/90 bg-[linear-gradient(180deg,rgba(3,35,40,.95),rgba(3,12,18,.95))] shadow-[0_0_0_1px_rgba(0,255,210,.1),0_12px_24px_rgba(0,0,0,.28)]"
            : "border-white/[0.08] bg-[linear-gradient(180deg,rgba(8,17,28,.96),rgba(4,9,15,.96))] shadow-[0_10px_22px_rgba(0,0,0,.2)] hover:border-emerald-400/60 hover:bg-[linear-gradient(180deg,rgba(10,23,36,.98),rgba(6,12,20,.98))] hover:shadow-[0_0_0_1px_rgba(0,255,210,.08),0_12px_24px_rgba(0,0,0,.24)]"
        } ${enabled ? "" : ""}`}
      >
        <div className={`absolute inset-0 rounded-[12px] bg-[radial-gradient(240px_120px_at_50%_-18%,rgba(0,255,210,.18),transparent_56%),radial-gradient(180px_90px_at_88%_18%,rgba(80,170,255,.1),transparent_60%),linear-gradient(90deg,rgba(0,255,210,.03),transparent_34%,transparent_66%,rgba(0,255,210,.04))] ${selected ? "opacity-100" : "opacity-55 group-hover:opacity-90"}`} />
        <div className="absolute inset-0 rounded-[12px] bg-[radial-gradient(180px_80px_at_24%_16%,rgba(255,255,255,.08),transparent_65%)] opacity-70" />
        <div className={`absolute inset-0 rounded-[12px] ${selected ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,.03),inset_0_1px_0_rgba(255,255,255,.08)]" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,.02),inset_0_1px_0_rgba(255,255,255,.04)]"}`} />
        <div className="relative flex items-center justify-center px-4 py-3">
          <span className={`block w-full text-center text-[20x] font-light tracking-[.01em] ${selected ? "text-white" : "text-white/88"}`}>{label}</span>
          <span className={`absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${selected ? "bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,.34)]" : "bg-white/18 group-hover:bg-emerald-300/45"}`} />
        </div>
        <motion.div
          initial={false}
          animate={selected ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="absolute bottom-[10px] left-5 right-5 h-px origin-left bg-gradient-to-r from-emerald-300 via-teal-300 to-transparent"
        />
      </div>
    </button>
  );
}

export default function Month_Button({ value = "-", items = [], disabled = false, onChange, title = "ИЗБЕРИ МЕСЕЦ", className = "" }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [foldedYears, setFoldedYears] = useState({});

  const currentValue = parseValue(value);
  const enabled = !disabled;
  const mode = currentValue.mode || "tag";

  const groups = useMemo(() => {
    const parsed = (items || [])
      .map(item => ({ raw: item, ...parseValue(item) }))
      .filter(item => item.valid)
      .sort((a, b) => b.year - a.year || a.month - b.month);
    const byYear = {};
    parsed.forEach(item => {
      byYear[item.year] = byYear[item.year] || [];
      byYear[item.year].push({ month: item.month, raw: item.raw });
    });
    return Object.keys(byYear)
      .map(Number)
      .sort((a, b) => b - a)
      .map(year => ({
        year,
        months: [...new Map(byYear[year].sort((a, b) => a.month - b.month).map(item => [item.month, item])).values()]
      }));
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    setFoldedYears(state => (
      Object.keys(state).length
        ? state
        : Object.fromEntries(groups.filter(group => group.year !== currentValue.year).map(group => [group.year, true]))
    ));
    return () => window.removeEventListener("keydown", onKey);
  }, [open, groups, currentValue.year]);

  const selectMonth = (year, month) => {
    onChange?.(formatOutput(mode, { year, month }));
    setOpen(false);
  };

  const toggleYear = year => setFoldedYears(state => ({ ...state, [year]: !state[year] }));
  const currentLabel = currentValue.valid ? formatDisplay(currentValue) : "Няма";

  return (
    <>
      <div className={className}>
        <div className="relative inline-block align-middle">
          <div className={`relative rounded-[12px] p-px shadow-[0_14px_28px_rgba(0,0,0,.34)] ${enabled ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-600" : "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-600"}`}>
            <div className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
            <div className={`relative overflow-hidden rounded-[11px] ${enabled ? "bg-[linear-gradient(180deg,rgba(2,8,13,.985),rgba(2,6,11,.985))]" : "bg-neutral-900"}`}>
              <div className={`absolute inset-0 rounded-[11px] ${enabled ? "bg-[radial-gradient(260px_120px_at_50%_-22%,rgba(0,255,210,.16),transparent_56%),radial-gradient(180px_90px_at_84%_18%,rgba(80,170,255,.08),transparent_60%)]" : ""}`} />
              <div className={`absolute inset-0 rounded-[11px] ${enabled ? "shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]" : "shadow-[inset_0_1px_1px_rgba(107,114,128,0.16)]"}`} />
              <div className="absolute inset-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/7 to-transparent opacity-[.07]" />
              <motion.button
                type="button"
                disabled={!enabled}
                onClick={enabled ? () => setOpen(true) : undefined}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                whileTap={enabled ? { scale: 0.985 } : {}}
                className={`relative inline-flex h-[42px] items-center px-4 transition-all duration-300 ${enabled ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35" : "cursor-not-allowed"}`}
              >
                <div className="relative flex items-center gap-2.5">
                  <div className="relative">
                    <div className={`relative rounded-[8px] p-[5px] shadow-lg ${enabled ? "bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-700" : "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900"}`}>
                      <div className={`absolute inset-0 rounded-[8px] ${enabled ? "bg-[radial-gradient(120px_60px_at_50%_-10%,rgba(190,255,244,.18),transparent_55%),radial-gradient(90px_45px_at_82%_18%,rgba(80,170,255,.08),transparent_58%)]" : ""}`} />
                      <div className={`absolute inset-0 rounded-[8px] blur-md ${enabled ? "bg-emerald-500/14" : "bg-gray-500/10"}`} />
                      <div className="absolute inset-0 rounded-[8px] bg-gradient-to-br from-white/12 via-white/4 to-transparent" />
                      <MonthIcon className={`relative z-10 h-[18px] w-[18px] ${enabled ? "text-white drop-shadow-[0_2px_10px_rgba(16,185,129,0.2)]" : "text-gray-400"}`} />
                    </div>
                  </div>
                  <div className="relative h-5">
                    <motion.div
                      animate={enabled ? { opacity: hover ? [0.28, 0.5, 0.28] : [0.18, 0.34, 0.18] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className={`h-full w-px rounded-full ${enabled ? "bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent" : "bg-gradient-to-b from-transparent via-gray-600/35 to-transparent"}`}
                    />
                  </div>
                  <div className="relative">
                    <span className={`text-[14px] leading-none font-light tracking-[.03em] transition-all duration-300 ${enabled ? "text-white" : "text-gray-500"}`}>{currentLabel}</span>
                    <motion.div
                      animate={enabled && hover ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      className={`absolute -bottom-1 left-0 right-0 h-px origin-left ${enabled ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent" : ""}`}
                    />
                  </div>
                </div>
                <div className={`absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 ${enabled ? "bg-gradient-to-r from-transparent via-emerald-500/16 to-transparent" : "bg-gradient-to-r from-transparent via-gray-600/15 to-transparent"}`} />
                <motion.div
                  animate={enabled ? { opacity: [0.22, 0.42, 0.22], scaleX: [0.9, 1, 0.9] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 ${enabled ? "bg-gradient-to-r from-transparent via-emerald-500/18 to-transparent" : "bg-gradient-to-r from-transparent via-gray-600/15 to-transparent"}`}
                />
              </motion.button>
            </div>
          </div>
          <motion.div
            animate={enabled ? { opacity: hover ? [0.09, 0.14, 0.09] : [0.06, 0.1, 0.06], scale: hover ? [1, 1.012, 1] : [1, 1.006, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -bottom-1 left-1/2 h-2.5 w-4/5 -translate-x-1/2 rounded-full blur-lg ${enabled ? "bg-gradient-to-r from-transparent via-emerald-600/16 to-transparent" : "bg-gradient-to-r from-transparent via-gray-700/18 to-transparent"}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE }}>
            <button type="button" aria-label="Close" className="absolute inset-0 bg-[rgba(0,0,0,.86)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.988, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.988, y: 10 }} transition={{ duration: 0.22, ease: EASE }} className="relative w-[min(1080px,95vw)]">
              <div className="relative rounded-[24px] bg-[linear-gradient(180deg,rgba(0,245,210,.86),rgba(0,188,167,.82))] p-px shadow-[0_26px_70px_rgba(0,0,0,.72)]">
                <div className="relative overflow-hidden rounded-[23px] bg-[linear-gradient(180deg,rgba(2,8,13,.985),rgba(2,6,11,.985))]">
                  <div className="absolute inset-0 rounded-[23px] bg-[radial-gradient(1200px_560px_at_50%_-8%,rgba(0,255,210,.07),transparent_55%),radial-gradient(760px_300px_at_18%_24%,rgba(80,170,255,.08),transparent_55%)]" />
                  <div className="absolute inset-[1px] rounded-[22px] border border-white/[0.04]" />
                  <div className="absolute inset-0 rounded-[23px] shadow-[inset_0_0_0_1px_rgba(0,255,210,.05)]" />

                <div className="relative border-b border-white/8 px-6 py-4">
                  <div className="relative flex min-h-[44px] items-center justify-end">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[17px] font-medium tracking-[.24em] text-white/94 md:text-[19px]">{title}</div>
                    <button type="button" onClick={() => setOpen(false)} className="relative grid h-10 w-10 place-items-center rounded-[12px] border border-emerald-400/75 bg-[linear-gradient(180deg,rgba(6,16,24,.98),rgba(3,8,14,.98))] text-white/84 shadow-[0_12px_30px_rgba(0,0,0,.34),inset_0_1px_0_rgba(255,255,255,.06)]">
                      <span className="absolute inset-[1px] rounded-[11px] bg-[radial-gradient(70px_40px_at_32%_20%,rgba(255,255,255,.08),transparent_62%)]" />
                      <XIcon className="relative h-[18px] w-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="relative p-6">
                  <div className="max-h-[62vh] overflow-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="space-y-5">
                      {groups.map(({ year, months }) => {
                        const isOpenYear = !foldedYears[year];
                        return (
                          <div key={year} className="relative overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(6,14,22,.94),rgba(3,8,13,.98))] shadow-[0_18px_34px_rgba(0,0,0,.26)]">
                            <div className="absolute inset-0 bg-[radial-gradient(520px_180px_at_16%_0%,rgba(115,197,255,.08),transparent_55%),radial-gradient(420px_140px_at_82%_12%,rgba(0,255,210,.06),transparent_55%)] opacity-90" />
                            <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.05),inset_0_0_0_1px_rgba(255,255,255,.02)]" />
                            <div className="relative px-5 py-4">
                              <button type="button" onClick={() => toggleYear(year)} aria-expanded={isOpenYear} aria-label={`${isOpenYear ? "Скрий" : "Покажи"} месеците за ${year}`} className="group flex w-full items-center justify-between gap-4 text-left">
                                <div className="flex items-center gap-3">
                                  <span className="h-8 w-[2px] rounded-full bg-gradient-to-b from-emerald-300 via-teal-400 to-sky-400 shadow-[0_0_16px_rgba(0,255,210,.22)]" />
                                  <div className="relative">
                                    <div className="text-[13px] font-light tracking-[.22em] text-white/92">{year}</div>
                                    <motion.div initial={false} animate={isOpenYear ? { scaleX: 1, opacity: 0.9 } : { scaleX: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} className="absolute -bottom-1 left-0 right-0 h-px origin-left bg-gradient-to-r from-emerald-300 via-sky-300 to-transparent" />
                                  </div>
                                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-light tracking-[.12em] text-white/72 backdrop-blur-sm">{months.length}</span>
                                </div>
                                <FoldToggle open={isOpenYear} />
                              </button>
                              <motion.div initial={false} animate={{ gridTemplateRows: isOpenYear ? "1fr" : "0fr", opacity: isOpenYear ? 1 : 0 }} transition={{ duration: 0.2, ease: EASE }} className="grid overflow-hidden transform-gpu [will-change:grid-template-rows,opacity]">
                                <div className="min-h-0 overflow-hidden">
                                  <div className="grid grid-cols-2 gap-3 pb-1 pt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                    {months.map(({ month }) => {
                                      const selected = year === currentValue.year && month === currentValue.month;
                                      return <MonthChip key={`${year}-${month}`} selected={selected} disabled={!enabled} label={MONTH_BG[month - 1] || String(month)} onClick={() => selectMonth(year, month)} />;
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );
                      })}
                      {!groups.length && <div className="text-sm tracking-[.08em] text-white/60">Няма налични месеци.</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
              <motion.div initial={false} animate={{ opacity: [0.05, 0.09, 0.05], scale: [1, 1.01, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-2 left-1/2 h-5 w-4/5 -translate-x-1/2 rounded-full blur-2xl bg-gradient-to-r from-transparent via-emerald-500/14 to-transparent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
