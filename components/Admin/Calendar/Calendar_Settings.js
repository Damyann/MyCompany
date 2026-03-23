"use client";
import { useEffect, useMemo, useState } from "react";
import { groupCodes, prettyCode, norm, sortBillCodesByNumber } from "./Calendar_Math";

export default function Calendar_Settings({
  dcEdit, dcCloseCodeEdit, dcEditCode, setDcEditCode, dcEditHours, setDcEditHours, dcEditDel, setDcEditDel, dcEditConfirm, setDcEditConfirm, dcEditBusy, dcSaveCodeEdit, dcDeleteCodeEdit,
  calcOpen, closeCalc, calcTab, setCalcTab,
  dcErr, billsErr, dc, dcBusy, dcMoveSection, setDc, dcOpenCodeEdit, dcAddCode, dcSaveSection, dcDelSection, dcAddSection, loadDayCard,
  bills, billsBusy, billDelCode, billDelCodeDirect, billUpdateCode, shiftHours, shiftAutoByHours, setBills, billAddCode, loadBills
  , totalCfg, setTotalCfg, dpMonth, dpYear, dpCfg, setDpCfg
}) {
  const billMode = calcTab !== "calc";
  const byHours = (codes) => { const g = groupCodes(codes); if (Array.isArray(g)) { const o = { 4: [], 8: [], 12: [], 16: [], x: [] }; for (const it of g) { o[it.h] = it.list || [] } return o } return g || {} };
  const canDel = ((dcEditConfirm || "").toString().trim().toLowerCase() === "del");
  const [billEdit, setBillEdit] = useState(null);
  const [billEditCode, setBillEditCode] = useState("");
  const [billEditMult, setBillEditMult] = useState(1);
  const [billEditDel, setBillEditDel] = useState(false);
  const [billEditConfirm, setBillEditConfirm] = useState("");
  const billCanDel = billEdit && norm(billEditConfirm) === norm(billEdit.code);
  const billCloseEdit = () => { if (!billsBusy) setBillEdit(null) };
  const billOpenEdit = (bill, code) => {
    if (!bill || !code) return;
    setBillEdit({ billId: bill.id, billName: bill.name, codeId: code.id, code: code.code, multiplier: Number(code.multiplier) || 1 });
    setBillEditCode((code.code ?? "").toString());
    setBillEditMult(Number(code.multiplier) || 1);
    setBillEditDel(false);
    setBillEditConfirm("");
  };
  const billSaveEdit = async () => {
    if (!billEdit) return;
    await billUpdateCode?.(billEdit.billId, billEdit.codeId, billEditCode, billEditMult);
    if (!billsBusy) setBillEdit(null);
  };
  const billDeleteEdit = async () => {
    if (!billEdit) return;
    if (!billCanDel) return;
    await billDelCodeDirect?.(billEdit.billId, billEdit.codeId);
    if (!billsBusy) setBillEdit(null);
  };

  const dpDim = (dpYear && dpMonth) ? new Date(dpYear, dpMonth, 0).getDate() : 31;
  const [dpDay, setDpDay] = useState(1);
  useEffect(() => { if (dpDay > dpDim) setDpDay(dpDim || 1) }, [dpDim]);
  const dpSel = useMemo(() => new Set(((dpCfg || {})[String(dpDay)] || []).map(norm)), [dpCfg, dpDay]);
  const dpOpts = useMemo(() => {
    const o = {}; for (const h of [4, 8, 12, 16]) {
      const seen = new Set(), list = [];
      for (const sec of (shiftAutoByHours?.[h] || [])) for (const g of (sec.groups || [])) for (const c of (g.codes || [])) {
        const k = norm(c); if (!k || seen.has(k)) continue; seen.add(k); list.push(c)
      }
      if (list.length) o[h] = list
    }
    return o
  }, [shiftAutoByHours]);
  const dpToggle = code => { const k = norm(code), day = String(dpDay); setDpCfg?.(c => { const n = { ...(c || {}) }; const s = new Set((n[day] || []).map(norm)); s.has(k) ? s.delete(k) : s.add(k); const a = [...s].sort(); a.length ? n[day] = a : delete n[day]; return n }) };
  const dpClear = () => { const day = String(dpDay); setDpCfg?.(c => { const n = { ...(c || {}) }; delete n[day]; return n }) };


  return (<>
    {dcEdit && (
      <div className="dc-edit-box" onMouseDown={dcCloseCodeEdit}>
        <div className="dc-edit-window" onMouseDown={e => e.stopPropagation()}>
          <button type="button" className="modal-x" onClick={dcCloseCodeEdit} aria-label="Close">×</button>
          <h3>РЕДАКЦИЯ НА {prettyCode(dcEdit.code || "")}</h3>

          <div className="dc-edit-grid">
            <div className="dc-edit-col">
              <div className="dc-edit-label">Код</div>
              <input className="dc-edit-inp" value={dcEditCode || ""} onChange={e => setDcEditCode(e.target.value)} autoComplete="off" disabled={dcEditBusy} />
            </div>
            <div className="dc-edit-col">
              <div className="dc-edit-label">Часове</div>
              <select className="dc-edit-sel" value={dcEditHours || 8} onChange={e => setDcEditHours(Number(e.target.value))} disabled={dcEditBusy}>
                <option value={4}>4h</option><option value={8}>8h</option><option value={12}>12h</option><option value={16}>16h</option>
              </select>
            </div>
          </div>

          <div className="dc-edit-actions">
            <button type="button" className="dc-edit-save" onClick={dcSaveCodeEdit} disabled={dcEditBusy}>Save</button>
            <button type="button" className="dc-edit-delbtn" onClick={() => { setDcEditDel(v => !v); setDcEditConfirm("") }} disabled={dcEditBusy}>Delete</button>
          </div>

          <div className="dc-edit-delwrap">
            {dcEditDel && (
              <div className="dc-edit-confirm">
                <div className="dc-edit-warn">За изтриване напиши точно: <b>del</b></div>
                <input className="dc-edit-confirm-inp" value={dcEditConfirm || ""} onChange={e => setDcEditConfirm(e.target.value)} placeholder="del" autoComplete="off" disabled={dcEditBusy} />
                <button type="button" className="dc-edit-delok" onClick={dcDeleteCodeEdit} disabled={dcEditBusy || !canDel}>Потвърди</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}


    {billEdit && (
      <div className="dc-edit-box" onMouseDown={billCloseEdit}>
        <div className="dc-edit-window" onMouseDown={e => e.stopPropagation()}>
          <button type="button" className="modal-x" onClick={billCloseEdit} aria-label="Close">×</button>
          <h3>РЕДАКЦИЯ НА {prettyCode(billEdit.code || "")}</h3>

          <div className="dc-edit-grid">
            <div className="dc-edit-col">
              <div className="dc-edit-label">Име</div>
              <input className="dc-edit-inp" value={billEditCode || ""} onChange={e => setBillEditCode(e.target.value)} autoComplete="off" disabled={billsBusy} />
            </div>

            {/^ph$/i.test((billEdit.billName || "").toString().trim()) && (
              <div className="dc-edit-col">
                <div className="dc-edit-label">Multiplier</div>
                <select className="dc-edit-sel" value={billEditMult === 1.5 ? 1.5 : 1} onChange={e => setBillEditMult(Number(e.target.value))} disabled={billsBusy}>
                  <option value={1}>1</option>
                  <option value={1.5}>1.5</option>
                </select>
              </div>
            )}
          </div>

          <div className="dc-edit-actions">
            <button type="button" className="dc-edit-save" onClick={billSaveEdit} disabled={billsBusy}>Save</button>
            <button type="button" className="dc-edit-delbtn" onClick={() => { setBillEditDel(v => !v); setBillEditConfirm("") }} disabled={billsBusy}>Delete</button>
          </div>

          <div className="dc-edit-delwrap">
            {billEditDel && (
              <div className="dc-edit-confirm">
                <div className="dc-edit-warn">За изтриване напиши точно: <b>{prettyCode(billEdit.code || "")}</b></div>
                <input className="dc-edit-confirm-inp" value={billEditConfirm || ""} onChange={e => setBillEditConfirm(e.target.value)} placeholder={prettyCode(billEdit.code || "")} autoComplete="off" disabled={billsBusy} />
                <button type="button" className="dc-edit-delok" onClick={billDeleteEdit} disabled={billsBusy || !billCanDel}>Потвърди</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    {calcOpen && (
      <div className="calc-box" onMouseDown={closeCalc}>
        <div className={"calc-window" + (billMode ? " bill-mode" : "")} onMouseDown={e => e.stopPropagation()}>
          <button type="button" className="modal-x" onClick={closeCalc} aria-label="Close">×</button>

          <div className="calc-tabs">
            <button type="button" className={"calc-tab" + (!billMode ? " active" : "")} onClick={() => setCalcTab("calc")}>КОДОВЕ</button>
            <button type="button" className={"calc-tab" + (billMode ? " active" : "")} onClick={() => setCalcTab("bill")}>СМЕТКИ</button>
          </div>

          {!billMode ? (
            <>
              <h3>КОДОВЕ</h3>
              {!!dcErr && <div className="calc-err">{dcErr}</div>}

              <div className="calc-list">
                <div className="calc-head"><div>СЕКЦИЯ</div><div>КОДОВЕ</div><div>ДЕЙСТВИЯ</div></div>

                {(dc || []).map(s => {
                  const groups = byHours((s.codes || []).filter(c => c && c.isActive !== false));
                  return (
                    <div key={s.id} className="calc-row">
                      <div className="calc-sec">
                        <div className="calc-move">
                          <button type="button" className="calc-move-btn" onClick={() => dcMoveSection(s.id, -1)} disabled={dcBusy}>▲</button>
                          <button type="button" className="calc-move-btn" onClick={() => dcMoveSection(s.id, 1)} disabled={dcBusy}>▼</button>
                        </div>
                        <input className="calc-inp" value={s.name || ""}
                          onChange={e => setDc(a => a.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))}
                          onBlur={() => dcSaveSection(s)}
                          placeholder="име на секция"
                          autoComplete="off"
                          disabled={dcBusy}
                        />
                      </div>

                      <div className="calc-codes">
                        <div className="calc-chips">
                          {[4, 8, 12, 16].map(h => (
                            <div key={h} className={"calc-group h" + h}>
                              <div className="calc-group-title">{h}H</div>
                              <div className="calc-group-list">
                                {(groups[h] || []).length ? (groups[h] || []).map(c => (
                                  <button key={c.id} type="button" className="calc-chip" onClick={() => dcOpenCodeEdit(s.id, c)} disabled={dcBusy} title="Edit">
                                    {prettyCode(c.code)}
                                  </button>
                                )) : <div className="calc-empty">—</div>}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="calc-addline">
                          <input className="calc-code-inp" value={s._code || ""}
                            onChange={e => setDc(a => a.map(x => x.id === s.id ? { ...x, _code: e.target.value } : x))}
                            placeholder="код + Enter" autoComplete="off" disabled={dcBusy}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); dcAddCode(s) } }}
                          />
                          <select className="calc-hours" value={s._hours || 8}
                            onChange={e => setDc(a => a.map(x => x.id === s.id ? { ...x, _hours: Number(e.target.value) } : x))}
                            title="Hours" disabled={dcBusy}
                          >
                            <option value={4}>4h</option><option value={8}>8h</option><option value={12}>12h</option><option value={16}>16h</option>
                          </select>
                        </div>
                      </div>

                      <div className="calc-actions">
                        <button type="button" className="calc-save" onClick={() => dcSaveSection(s)} disabled={dcBusy}>Save</button>
                        <button type="button" className="calc-del" onClick={() => dcDelSection(s)} disabled={dcBusy}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="calc-bottom">
                <button type="button" className="calc-add" disabled={dcBusy} onClick={dcAddSection}>+ Section</button>
                <button type="button" className="calc-reload" disabled={dcBusy} onClick={() => loadDayCard(1)}>Reload</button>
              </div>
            </>
          ) : (
            <>
              <h3>СМЕТКИ</h3>
              {!!billsErr && <div className="calc-err">{billsErr}</div>}

              <div className="calc-list">
                <div className="calc-head"><div>СМЕТКА</div><div>КОДОВЕ</div></div>

                {(bills || []).map(b => {
                  const name = (b.name || "").toString().trim(); const isShifts = /^shifts$/i.test(name); const isTotal = /^total$/i.test(name); const isDP = /^dp$/i.test(name); return (
                    <div key={b.id} className="calc-row">
                      <div className="calc-sec"><div className="bill-name">{b.name}</div></div>

                      <div className="calc-codes">
                        <div className="calc-chips">
                          {isShifts && Array.isArray(shiftHours) && shiftHours.some(h => (shiftAutoByHours?.[h] || []).length) ? (
                            <div className="calc-group hx bill-auto">
                              <div className="bill-auto-hours">
                                {shiftHours.filter(h => (shiftAutoByHours?.[h] || []).length).map(h => (
                                  <div key={h} className="bill-auto-hour">
                                    <div className="bill-auto-hour-title">{h}h</div>
                                    <div className="bill-auto-row">
                                      {(shiftAutoByHours?.[h] || []).map(sec => (
                                        <div key={sec.id} className="bill-auto-sec">
                                          <div className="bill-auto-codes">
                                            {(sec.groups || []).map(g => (g.codes || []).map(code => (
                                              <span key={sec.id + "-" + g.base + "-" + code} className="calc-chip bill-chip-auto">{prettyCode(code)}</span>
                                            )))}
                                          </div>
                                          <span className="bill-auto-src"><sup>{sec.name}</sup></span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}


                          {isDP && (
                            <div className="dp-boxwrap">
                              <div className="dp-days">
                                {[...Array.from({ length: 15 }, (_, i) => i + 1), 31, ...Array.from({ length: 15 }, (_, i) => i + 16)]
                                  .map(d => {
                                    const off = d > dpDim, has = ((dpCfg || {})[String(d)] || []).length; return (
                                      <button
                                        key={d}
                                        type="button"
                                        disabled={off}
                                        className={
                                          "dp-day"
                                          + (d === 31 ? " dp-day--31" : "")
                                          + (off ? " off" : "")
                                          + (has ? " has" : "")
                                          + (d === dpDay ? " sel" : "")
                                        }
                                        onClick={() => !off && setDpDay(d)}
                                      >
                                        {d}
                                      </button>
                                    )
                                  })}
                              </div>
                              <div className="dp-picked">
                                <div>Дата: <b>{String(dpDay).padStart(2, "0")}.{String(dpMonth || 0).padStart(2, "0")}.{dpYear || ""}</b></div>
                                <button type="button" className="dp-clear" onClick={dpClear}>Clear</button>
                              </div>
                              <div className="dp-picklists">
                                {Object.entries(dpOpts).map(([h, list]) => (
                                  <div key={h} className="dp-hour">
                                    <div className="dp-hour-title">{h}h</div>
                                    <div className="dp-chips">
                                      {list.map(code => {
                                        const on = dpSel.has(norm(code)); return (
                                          <button key={code} type="button" className={"dp-chip" + (on ? " on" : "")} onClick={() => dpToggle(code)}>{prettyCode(code)}</button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {isTotal && (
                            <div className="calc-group hx">
                              <div className="calc-group-list bill-total-toggles">
                                {(["Shifts", "SICK", "PH", "Bonus", "DP"]).map(k => {
                                  const on = totalCfg?.[k] !== false; return (
                                    <button key={k} type="button" className={"bill-toggle " + (on ? "on" : "off")} onClick={() => setTotalCfg?.(c => ({ ...c, [k]: !on }))}>{k}</button>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {(!isShifts && !isTotal && !isDP) && (
                            <div className="calc-group hx">
                              <div className="calc-group-list">
                                {(b.codes || []).filter(c => c && c.isActive !== false).length
                                  ? (() => {
                                    const active = (b.codes || []).filter(c => c && c.isActive !== false);
                                    const isSick = /^sick$/i.test(name);
                                    const isPH = /^ph$/i.test(name);
                                    const isNights = /^nights$/i.test(name);
                                    const editable = isSick || isPH || isNights;
                                    const list = editable ? sortBillCodesByNumber(active) : active;
                                    return list.map(c => editable ? (
                                      <button key={c.id} type="button" className={"calc-chip bill-chip-edit"+(isPH?" bill-chip-ph":"")} onClick={()=>billOpenEdit(b,c)} disabled={billsBusy} title="Edit">{prettyCode(c.code)}{isPH?<span className="bill-mult">×{Number(c.multiplier||1)}</span>:null}</button>
                                    ) : (
                                      <button key={c.id} type="button" className="calc-chip bill-chip-del" onClick={() => billDelCode(b.id, c.id)} disabled={billsBusy} title="Del">
                                        {prettyCode(c.code)}<i>×</i>
                                      </button>
                                    ));
                                  })()
                                  : <div className="calc-empty">—</div>}
                              </div>
                            </div>
                          )}
                        </div>

                        {(!isShifts && !isTotal && !isDP) && (
                          <div className="calc-addline">
                            <input className="calc-code-inp" value={b._code || ""}
                              onChange={e => setBills(a => a.map(x => x.id === b.id ? { ...x, _code: e.target.value } : x))}
                              placeholder="код + Enter" autoComplete="off" disabled={billsBusy}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); billAddCode(b) } }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="calc-bottom">
                <button type="button" className="calc-reload" disabled={billsBusy} onClick={() => loadBills?.(1)}>Reload</button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </>);
}
