import prisma from "@/lib/prisma";

export async function updateTimestamp() {
  const now = new Date(); // ← важно: ДА НЕ Е toISOString()

  const existing = await prisma.settings.findFirst();

  if (!existing) {
    await prisma.settings.create({
      data: { lastUpdate: now }
    });
  } else {
    await prisma.settings.update({
      where: { id: existing.id },
      data: { lastUpdate: now }
    });
  }
}
