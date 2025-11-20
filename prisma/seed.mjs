import "dotenv/config";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs/umd";

const prisma = new PrismaClient();

async function main() {
  const kaiPassword = await bcrypt.hash("12345", 10);
  const kainPassword = await bcrypt.hash("123", 10);

  await prisma.admin.create({
    data: {
      name: "Kai",
      passwordHash: kaiPassword,
    },
  });

  await prisma.admin.create({
    data: {
      name: "Kain",
      passwordHash: kainPassword,
    },
  });

  console.log("✅ Seed готов: Kai и Kain са създадени успешно");
}

main()
  .catch((e) => {
    console.error("❌ Грешка при seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
