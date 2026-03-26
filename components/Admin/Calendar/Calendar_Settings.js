"use client";
import { useState } from "react";
import { prettyCode, norm } from "./Calendar_Math";
import Calculations_Panel from "../../Design/Calculations_Panel.jsx";

export default function Calendar_Settings({
  dcEdit, dcCloseCodeEdit, dcEditCode, setDcEditCode, dcEditHours, setDcEditHours, dcEditDel, setDcEditDel, dcEditConfirm, setDcEditConfirm, dcEditBusy, dcSaveCodeEdit, dcDeleteCodeEdit,
  calcOpen, closeCalc, calcTab, setCalcTab,
  dcErr, billsErr, dc, dcBusy, dcMoveSection, setDc, dcOpenCodeEdit, dcAddCode, dcSaveSection, dcDelSection, dcAddSection, loadDayCard,
  bills, billsBusy, billDelCode, billDelCodeDirect, billUpdateCode, shiftHours, shiftAutoByHours, setBills, billAddCode, loadBills,
  totalCfg, setTotalCfg, dpMonth, dpYear, dpCfg, setDpCfg, bonusCfg, setBonusCfg
}) {
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

    <Calculations_Panel calcOpen={calcOpen} closeCalc={closeCalc} calcTab={calcTab} setCalcTab={setCalcTab} dcErr={dcErr} billsErr={billsErr} dc={dc} dcBusy={dcBusy} dcMoveSection={dcMoveSection} setDc={setDc} dcOpenCodeEdit={dcOpenCodeEdit} dcAddCode={dcAddCode} dcSaveSection={dcSaveSection} dcDelSection={dcDelSection} dcAddSection={dcAddSection} loadDayCard={loadDayCard} bills={bills} billsBusy={billsBusy} billDelCode={billDelCode} billOpenEdit={billOpenEdit} shiftHours={shiftHours} shiftAutoByHours={shiftAutoByHours} setBills={setBills} billAddCode={billAddCode} loadBills={loadBills} totalCfg={totalCfg} setTotalCfg={setTotalCfg} dpMonth={dpMonth} dpYear={dpYear} dpCfg={dpCfg} setDpCfg={setDpCfg} bonusCfg={bonusCfg} setBonusCfg={setBonusCfg} />
  </>);
}
