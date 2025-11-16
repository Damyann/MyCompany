import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Хешваме паролите
  const adminPasswordHash = await bcrypt.hash("12345", 10);
  const croupierPasswordHash = await bcrypt.hash("123456", 10);

  // Създаваме админ Kai
  await prisma.admin.create({
    data: {
      name: "Kai",
      passwordHash: adminPasswordHash,
    },
  });

  // Създаваме крупие Kali
  await prisma.croupier.create({
    data: {
      firstName: "Kali",
      // middleName и lastName при нас са optional, може да ги пропуснем
      nickname: "Kali",
      gender: "FEMALE", // или MALE, както решиш по-късно
      email: "kali@example.com",
      startDate: new Date(), // днешна дата като старт
      promotions: 0,
      passwordHash: croupierPasswordHash,
    },
  });

  console.log("✅ Seed готов: добавени са админ Kai и крупие Kali");
}

main()
  .catch((e) => {
    console.error("❌ Грешка при seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
