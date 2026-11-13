import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BackupFormatError, importBackupData, parseBackupPayload, resetSequences } from "../src/lib/api/backup-import";
import { prisma } from "../src/lib/api/prisma";

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.error("Usage: npx tsx scripts/import-backup.ts <backup.json>");
    process.exitCode = 1;
    return;
  }

  const path = resolve(process.cwd(), target);

  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    console.error(`✕ Cannot read ${path}`);
    process.exitCode = 1;
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = parseBackupPayload(JSON.parse(raw));
  } catch (error) {
    if (error instanceof BackupFormatError) {
      console.error(`✕ ${error.message}`);
      process.exitCode = 1;
      return;
    }
    console.error("✕ The file is not valid JSON.");
    process.exitCode = 1;
    return;
  }

  console.log("• Importing backup into Postgres…");
  await importBackupData(payload);

  // Explicit ids do not advance the serial sequences — fix them so the next
  // insert does not collide with an existing id.
  await resetSequences();
  console.log("• Sequences reset.");

  const [projects, skills, experiences, certificates, settings, inquiries] = await Promise.all([
    prisma.project.count(),
    prisma.skill.count(),
    prisma.experience.count(),
    prisma.certificate.count(),
    prisma.setting.count(),
    prisma.inquiry.count(),
  ]);

  console.log(
    `✓ Done. projects=${projects} skills=${skills} experiences=${experiences} certificates=${certificates} settings=${settings} inquiries=${inquiries}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
