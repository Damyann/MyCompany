// app/api/Admin/Calendar/cache.js
import "server-only";
import prisma from "@/lib/prisma";

import {
  toInt,
  normTotalCfg,
  normDpCfg,
  normBonusCfg,
  DEF_TOTAL,
  DEFAULT_BONUS_THRESHOLD,
  ensureBills,
  buildBillTokToKey,
  buildCellLookups,
} from "./Math/Calculations";

const TTL_MS = 10 * 60 * 1000; // 10 min
const _c = new Map(); // key -> { v, exp }
const _now = () => Date.now();

const _get = async (key, load, ttl = TTL_MS) => {
  const e = _c.get(key);
  if (e && e.exp > _now()) return e.v;
  const v = await load();
  _c.set(key, { v, exp: _now() + ttl });
  return v;
};

const _delPrefix = (prefix) => {
  for (const k of _c.keys()) if (k.startsWith(prefix)) _c.delete(k);
};

const rk = (role) => `r:${role}:`;

export const invalidateRole = (role) => _delPrefix(rk(role));
export const invalidateDayCard = (role) => {_c.delete(`${rk(role)}daycard`);_c.delete(`${rk(role)}cellLookups`);};
export const invalidateBills = (role) => {
  _c.delete(`${rk(role)}bills`);
  _c.delete(`${rk(role)}billTokToKey`);
  _c.delete(`${rk(role)}cellLookups`);
};
export const invalidateTotal = (role) => _c.delete(`${rk(role)}total`);
export const invalidateDp = (role, year, month) =>
  _c.delete(`${rk(role)}dp:${toInt(year)}:${toInt(month)}`);
export const invalidateBonus = (role, year, month) =>
  _c.delete(`${rk(role)}bonus:${toInt(year)}:${toInt(month)}`);

export const getTotalCfg = (role) =>
  _get(`${rk(role)}total`, async () => {
    let row = await prisma.calendarTotal.findUnique({
      where: { role },
      select: { totalCfg: 1 },
    });
    if (!row) {
      row = await prisma.calendarTotal.create({
        data: { role, totalCfg: DEF_TOTAL },
        select: { totalCfg: 1 },
      });
    }
    return normTotalCfg(row?.totalCfg);
  });

export const getDpCfg = (role, year, month) =>
  _get(`${rk(role)}dp:${toInt(year)}:${toInt(month)}`, async () => {
    const y = toInt(year), m = toInt(month);
    let row = await prisma.calendarDP.findUnique({
      where: { role_year_month: { role, year: y, month: m } },
      select: { dpCfg: 1 },
    });
    if (!row) {
      row = await prisma.calendarDP.create({
        data: { role, year: y, month: m, dpCfg: {} },
        select: { dpCfg: 1 },
      });
    }
    return normDpCfg(row?.dpCfg);
  });

export const getBonusCfg = (role, year, month) =>
  _get(`${rk(role)}bonus:${toInt(year)}:${toInt(month)}`, async () => {
    const y = toInt(year), m = toInt(month);
    let row = await prisma.calendarBonus.findUnique({
      where: { role_year_month: { role, year: y, month: m } },
      select: { threshold: 1 },
    });
    if (!row) {
      row = await prisma.calendarBonus.create({
        data: { role, year: y, month: m, threshold: DEFAULT_BONUS_THRESHOLD },
        select: { threshold: 1 },
      });
    }
    return normBonusCfg(row);
  });

export const getDayCard = (role) =>
  _get(`${rk(role)}daycard`, async () =>
    prisma.shiftSection.findMany({
      where: { role },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: 1,
        role: 1,
        name: 1,
        sortOrder: 1,
        isActive: 1,
        codes: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: {
            id: 1,
            role: 1,
            code: 1,
            hours: 1,
            sortOrder: 1,
            isActive: 1,
          },
        },
      },
    })
  );

// ✅ вече е PURE READ (без write при read)
export const getBills = (role) =>
  _get(`${rk(role)}bills`, async () =>
    prisma.bill.findMany({
      where: { role },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: 1,
        role: 1,
        name: 1,
        sortOrder: 1,
        isActive: 1,
        codes: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: {
            id: 1,
            role: 1,
            code: 1,
            multiplier: 1,
            sortOrder: 1,
            isActive: 1,
          },
        },
      },
    })
  );

export const getCellLookups = (role) =>
  _get(`${rk(role)}cellLookups`, async () =>
    buildCellLookups(await getDayCard(role), await getBills(role))
  );

export const getBillTokToKey = (role) =>
  _get(`${rk(role)}billTokToKey`, async () => {
    await ensureBills(role);
    const bills = await prisma.bill.findMany({
      where: { role },
      select: {
        name: 1,
        codes: { where: { isActive: true }, select: { code: 1, multiplier: 1 } },
      },
    });
    return buildBillTokToKey(bills);
  });
