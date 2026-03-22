require("dotenv").config();
const { PrismaClient, Gender, GameGender, StaffRole, AccountRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_USER = "Kai";
const ADMIN_PASS = "12345";
const STAFF_PASS = "123";
const START_DATE = new Date(process.env.SEED_START_DATE || "2026-01-01T00:00:00.000Z");
const SEED_YEAR = 2026;
const SEED_MONTH = 1;

const GAMES = [
  { name: "Black Jack", abbr: "BJ", gender: GameGender.ALL },
  { name: "Baccarat", abbr: "Bacc", gender: GameGender.FEMALE },
  { name: "Teen Patti", abbr: "TP", gender: GameGender.ALL },
  { name: "Andar Bahar", abbr: "AB", gender: GameGender.ALL },
  { name: "Roulette", abbr: "RL", gender: GameGender.ALL },
  { name: "Three Cards Poker", abbr: "3CP", gender: GameGender.ALL },
  { name: "Lucky 7", abbr: "L7", gender: GameGender.ALL },
];

const F = [
  { n: "Sissy", fn: "Виктория", mn: "Каменова", ln: "Стоянова" },
  { n: "Katy", fn: "Никол", mn: "Димитрова", ln: "Христова" },
  { n: "Eli", fn: "Симона", mn: "Петкова", ln: "Георгиева" },
  { n: "Rosie", fn: "Деница", mn: "Иванова", ln: "Тодорова" },
  { n: "Claire", fn: "Кристина", mn: "Руменова", ln: "Николова" },
  { n: "Lara", fn: "Мирела", mn: "Асенова", ln: "Попова" },
  { n: "Tara", fn: "Гергана", mn: "Пламенова", ln: "Маринова" },
  { n: "Sara", fn: "Йоелина", mn: "Василева", ln: "Стефанова" },
  { n: "Jess", fn: "Преслава", mn: "Борисова", ln: "Ангелова" },
  { n: "Mell", fn: "Ралица", mn: "Златева", ln: "Костова" },
  { n: "Julia", fn: "Теодора", mn: "Миленова", ln: "Донева" },
  { n: "Remi", fn: "Елица", mn: "Кирилова", ln: "Лазарова" },
  { n: "Gabi", fn: "Яница", mn: "Тихомирова", ln: "Михайлова" },
  { n: "Dana", fn: "Магдалена", mn: "Стоилова", ln: "Пенева" },
  { n: "Abi", fn: "Ивелина", mn: "Николаева", ln: "Господинова" },
  { n: "Nana", fn: "Биляна", mn: "Атанасова", ln: "Радева" },
  { n: "Dea", fn: "Славея", mn: "Йорданова", ln: "Велева" },
  { n: "Tessa", fn: "Лилия", mn: "Григорова", ln: "Цветкова" },
].map((p) => ({ nickname: p.n, firstName: p.fn, middleName: p.mn, lastName: p.ln, gender: Gender.FEMALE }));

const M = [
  { n: "Stan", fn: "Калоян", mn: "Желязков", ln: "Минчев" },
  { n: "Marten", fn: "Божидар", mn: "Трифонов", ln: "Райков" },
  { n: "Travis", fn: "Радослав", mn: "Илиев", ln: "Ганчев" },
  { n: "Niko", fn: "Любомир", mn: "Павлов", ln: "Григоров" },
  { n: "Dima", fn: "Теодор", mn: "Симеонов", ln: "Вълчев" },
  { n: "Don", fn: "Кристиян", mn: "Добрев", ln: "Начев" },
  { n: "Zane", fn: "Валентин", mn: "Мартинов", ln: "Русев" },
].map((p) => ({ nickname: p.n, firstName: p.fn, middleName: p.mn, lastName: p.ln, gender: Gender.MALE }));

const DEALERS = [...F, ...M];

const PITBOSSES = [
  { n: "Hawk", fn: "Иван", mn: "Петров", ln: "Стоянов", g: Gender.MALE },
  { n: "Rex", fn: "Георги", mn: "Николов", ln: "Костов", g: Gender.MALE },
  { n: "Vito", fn: "Кирил", mn: "Димитров", ln: "Колев", g: Gender.MALE },
  { n: "Orion", fn: "Мирослав", mn: "Стефанов", ln: "Георгиев", g: Gender.MALE },
  { n: "Blade", fn: "Валентин", mn: "Александров", ln: "Тодоров", g: Gender.MALE },
  { n: "Nox", fn: "Николай", mn: "Иванов", ln: "Петков", g: Gender.MALE },
  { n: "Vera", fn: "Вера", mn: "Пламенова", ln: "Маринова", g: Gender.FEMALE },
  { n: "Maya", fn: "Мария", mn: "Георгиева", ln: "Димитрова", g: Gender.FEMALE },
].map((p) => ({ nickname: p.n, firstName: p.fn, middleName: p.mn, lastName: p.ln, gender: p.g }));

const makeEmail = (nickname) => `${String(nickname).toLowerCase()}@gmail.com`;
const normCode = (x) => String(x ?? "").trim().replace(/\s+/g, "").toUpperCase();
const hoursRank = (h) => (h === 4 ? 0 : h === 8 ? 1 : h === 12 ? 2 : h === 16 ? 3 : 9);

async function upsertGame(g) {
  return prisma.game.upsert({
    where: { name: g.name },
    update: { abbr: g.abbr, gender: g.gender },
    create: { name: g.name, abbr: g.abbr, gender: g.gender },
    select: { id: true, name: true, abbr: true, gender: true },
  });
}

async function upsertStaff(role, p) {
  const email = makeEmail(p.nickname);
  return prisma.staffMember.upsert({
    where: { nickname: p.nickname },
    update: {
      role,
      firstName: p.firstName,
      middleName: p.middleName || null,
      lastName: p.lastName,
      gender: p.gender,
      startDate: START_DATE,
      promotions: 0,
      email,
      isActive: true,
    },
    create: {
      role,
      firstName: p.firstName,
      middleName: p.middleName || null,
      lastName: p.lastName,
      gender: p.gender,
      startDate: START_DATE,
      promotions: 0,
      nickname: p.nickname,
      email,
      isActive: true,
    },
    select: { id: true, nickname: true, email: true, gender: true },
  });
}

async function upsertAccount(staff, passwordHash) {
  return prisma.userAccount.upsert({
    where: { staffId: staff.id },
    update: {
      role: AccountRole.STAFF,
      username: staff.nickname,
      email: staff.email,
      passwordHash,
      isActive: true,
    },
    create: {
      role: AccountRole.STAFF,
      staffId: staff.id,
      username: staff.nickname,
      email: staff.email,
      passwordHash,
      isActive: true,
    },
  });
}

async function setGamesForStaff(staffId, gameIds) {
  await prisma.staffGame.deleteMany({ where: { staffId } });
  if (gameIds.length) {
    await prisma.staffGame.createMany({
      data: gameIds.map((gameId) => ({ staffId, gameId })),
      skipDuplicates: true,
    });
  }
}

function allowedGameIdsForGender(games, gender) {
  return games
    .filter((g) => g.gender === GameGender.ALL || (g.gender === GameGender.FEMALE && gender === Gender.FEMALE) || (g.gender === GameGender.MALE && gender === Gender.MALE))
    .map((g) => g.id);
}

async function ensureBills(role) {
  const BILL_NAMES = ["Shifts", "SICK", "PH", "Nights", "TOTAL", "Bonus", "DP"];
  for (let i = 0; i < BILL_NAMES.length; i++) {
    const name = BILL_NAMES[i];
    await prisma.bill.upsert({
      where: { role_name: { role, name } },
      update: { sortOrder: i * 10, isActive: true },
      create: { role, name, sortOrder: i * 10, isActive: true },
      select: { id: true },
    });
  }
}

async function upsertShiftSections(role, sections) {
  for (let si = 0; si < sections.length; si++) {
    const s = sections[si];
    const section = await prisma.shiftSection.upsert({
      where: { role_name: { role, name: s.name } },
      update: { sortOrder: si * 10, isActive: true },
      create: { role, name: s.name, sortOrder: si * 10, isActive: true },
      select: { id: true },
    });

    const seen = new Set();
    const flat = [];
    for (const g of s.groups) {
      for (const code of g.codes) {
        const c = String(code).trim();
        if (!c || seen.has(c)) continue;
        seen.add(c);
        flat.push({ code: c, hours: g.hours });
      }
    }

    for (let i = 0; i < flat.length; i++) {
      const item = flat[i];
      await prisma.shiftCode.upsert({
        where: { sectionId_code: { sectionId: section.id, code: item.code } },
        update: { hours: item.hours, sortOrder: i * 10, isActive: true, role, sectionId: section.id },
        create: { role, sectionId: section.id, code: item.code, hours: item.hours, sortOrder: i * 10, isActive: true },
        select: { id: true },
      });
    }
  }
}

async function syncShiftBillCodes(role) {
  await ensureBills(role);

  const shiftsBill = await prisma.bill.findFirst({
    where: { role, name: "Shifts" },
    select: { id: true },
  });
  if (!shiftsBill) return;

  const sc = await prisma.shiftCode.findMany({
    where: { role, isActive: true },
    select: { code: true, hours: true },
  });

  const desired = [];
  const seen = new Set();
  for (const c of sc) {
    const code = String(c.code || "").trim();
    const k = normCode(code);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    desired.push({ k, code, hours: Number(c.hours) || 0 });
  }

  desired.sort((a, b) => {
    const ra = hoursRank(a.hours);
    const rb = hoursRank(b.hours);
    if (ra !== rb) return ra - rb;
    return a.code.localeCompare(b.code);
  });

  const existing = await prisma.billCode.findMany({
    where: { billId: shiftsBill.id },
    select: { id: true, code: true, isActive: true },
  });

  const exByK = new Map();
  for (const e of existing) {
    const k = normCode(e.code);
    if (k && !exByK.has(k)) exByK.set(k, e);
  }

  const wantedK = new Set(desired.map((d) => d.k));
  const toDeactivate = existing
    .filter((e) => {
      const k = normCode(e.code);
      return k && !wantedK.has(k) && e.isActive !== false;
    })
    .map((e) => e.id);

  const tx = [];
  if (toDeactivate.length) tx.push(prisma.billCode.updateMany({ where: { id: { in: toDeactivate } }, data: { isActive: false } }));

  const toCreate = [];
  for (let i = 0; i < desired.length; i++) {
    const d = desired[i];
    if (!exByK.has(d.k)) toCreate.push({ role, billId: shiftsBill.id, code: d.code, sortOrder: i * 10, isActive: true });
  }
  if (toCreate.length) tx.push(prisma.billCode.createMany({ data: toCreate, skipDuplicates: true }));

  for (let i = 0; i < desired.length; i++) {
    const d = desired[i];
    const ex = exByK.get(d.k);
    if (!ex) continue;
    tx.push(prisma.billCode.update({ where: { id: ex.id }, data: { code: d.code, sortOrder: i * 10, isActive: true } }));
  }

  if (tx.length) await prisma.$transaction(tx);
}

async function ensureEmptyScheduleMonth(role, year, month) {
  await prisma.scheduleMonth.upsert({
    where: { role_year_month: { role, year, month } },
    update: {},
    create: { role, year, month, isLocked: false },
    select: { id: true },
  });
}

const DEALER_SECTIONS = [
  {
    name: "07-15",
    groups: [
      { hours: 4, codes: ["71", "72", "71A", "72A", "71G", "72G"] },
      { hours: 8, codes: ["7", "7A", "7G"] },
      { hours: 12, codes: ["1", "1A", "1G"] },
      { hours: 16, codes: ["7+15", "7+23"] },
    ],
  },
  {
    name: "15-19",
    groups: [
      { hours: 4, codes: ["151", "151A", "151G"] },
      { hours: 8, codes: ["15", "15A", "15G"] },
      { hours: 12, codes: ["1", "1A", "1G"] },
      { hours: 16, codes: ["7+15", "15+23"] },
    ],
  },
  {
    name: "19-23",
    groups: [
      { hours: 4, codes: ["152", "152A", "152G"] },
      { hours: 8, codes: ["15", "15A", "15G"] },
      { hours: 12, codes: ["2", "2A", "2G"] },
      { hours: 16, codes: ["7+15", "15+23"] },
    ],
  },
  {
    name: "23-07",
    groups: [
      { hours: 4, codes: ["231", "231A", "231G", "232A", "232G"] },
      { hours: 8, codes: ["23", "23A", "23G"] },
      { hours: 12, codes: ["2", "2A", "2G"] },
      { hours: 16, codes: ["7+23", "15+23"] },
    ],
  },
];

const PITBOSS_SECTIONS = [
  {
    name: "07-19",
    groups: [
      { hours: 4, codes: ["71"] },
      { hours: 8, codes: ["7"] },
      { hours: 12, codes: ["1"] },
      { hours: 16, codes: ["7+15"] },
    ],
  },
  {
    name: "19-07",
    groups: [
      { hours: 4, codes: ["231"] },
      { hours: 8, codes: ["23"] },
      { hours: 12, codes: ["2"] },
      { hours: 16, codes: ["15+23"] },
    ],
  },
];

async function main() {
  const adminHash = await bcrypt.hash(ADMIN_PASS, 10);
  const staffHash = await bcrypt.hash(STAFF_PASS, 10);

  await prisma.userAccount.upsert({
    where: { username: ADMIN_USER },
    update: { role: AccountRole.ADMIN, passwordHash: adminHash, isActive: true },
    create: { role: AccountRole.ADMIN, username: ADMIN_USER, passwordHash: adminHash, isActive: true },
  });

  const seededGames = [];
  for (const g of GAMES) seededGames.push(await upsertGame(g));

  for (const p of DEALERS) {
    const staff = await upsertStaff(StaffRole.DEALER, p);
    await upsertAccount(staff, staffHash);
    await setGamesForStaff(staff.id, allowedGameIdsForGender(seededGames, staff.gender));
  }

  for (const p of PITBOSSES) {
    const staff = await upsertStaff(StaffRole.PITBOSS, p);
    await upsertAccount(staff, staffHash);
    await setGamesForStaff(staff.id, []);
  }

  await upsertShiftSections(StaffRole.DEALER, DEALER_SECTIONS);
  await upsertShiftSections(StaffRole.PITBOSS, PITBOSS_SECTIONS);
  await ensureBills(StaffRole.DEALER);
  await ensureBills(StaffRole.PITBOSS);
  await syncShiftBillCodes(StaffRole.DEALER);
  await syncShiftBillCodes(StaffRole.PITBOSS);
  await ensureEmptyScheduleMonth(StaffRole.DEALER, SEED_YEAR, SEED_MONTH);
  await ensureEmptyScheduleMonth(StaffRole.PITBOSS, SEED_YEAR, SEED_MONTH);

  console.log("✅ Seed OK");
}

main().catch(() => process.exit(1)).finally(async () => {
  await prisma.$disconnect();
});