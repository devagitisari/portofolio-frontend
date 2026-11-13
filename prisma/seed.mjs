/**
 * Seeds the admin user.
 *
 * Plain JavaScript on purpose: the seed must run without any devDependency
 * (tsx), so `prisma db seed` also works on a production install.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node prisma/seed.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROUNDS = 10;

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@devagitisari.my.id").trim().toLowerCase();
  const name = process.env.ADMIN_NAME ?? "Deva Gitisari";
  const password = process.env.ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`• User ${email} already exists (id=${existing.id}).`);

    if (password) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: await bcrypt.hash(password, ROUNDS) },
      });
      console.log("• Password updated.");
    } else {
      console.log("• Set ADMIN_PASSWORD to rotate the password.");
    }

    return;
  }

  if (!password) {
    console.error("✕ ADMIN_PASSWORD is required to create the admin user.");
    process.exitCode = 1;
    return;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, ROUNDS),
      role: "admin",
    },
  });

  console.log(`✓ Admin user ${email} created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
