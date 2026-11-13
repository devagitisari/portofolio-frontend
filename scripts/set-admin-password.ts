/**
 * Mengganti password admin di database Neon (produksi).
 *
 *   npm run admin:password
 *   npm run admin:password -- --email devagitisari96@gmail.com --revoke-tokens
 *
 * Password-nya dibaca dengan hidden input (tidak muncul di layar dan tidak
 * masuk ke riwayat shell), di-hash bcrypt, lalu ditulis ke tabel `users`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(process.cwd());
const BCRYPT_ROUNDS = 10;
const MIN_LENGTH = 8;

/** Ambil variabel dari file .env tanpa dependency tambahan. */
function readEnvFile(file: string): Record<string, string> {
  const full = path.join(ROOT, file);
  const result: Record<string, string> = {};

  try {
    for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      result[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // File tidak ada — dipakai untuk cek env dari parent process.
  }

  return result;
}

/**
 * Database produksi. `DATABASE_URL_UNPOOLED` ( koneksi langsung Neon )
 * dipilih karena lebih bisa diakses dari mesin lokal.
 */
function resolveDatabaseUrl(): string {
  const prod = readEnvFile(".env.production.local");
  const local = readEnvFile(".env.local");

  const url =
    prod.DATABASE_URL_UNPOOLED ??
    prod.DATABASE_URL ??
    local.DATABASE_URL_UNPOOLED ??
    local.DATABASE_URL ??
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL tidak ditemukan di .env.production.local / .env.local.");
  }

  return url;
}

/** Sisa input dari chunk sebelumnya (dipakai kalau input di-pipe, bukan TTY). */
let carry = "";

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = carry;
    carry = "";
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      if (stdin.isTTY) stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdin.removeListener("end", finish);
      process.stdout.write("\n");
      resolve(value);
    };

    const onData = (chunk: string) => {
      const chars = carry + chunk;
      carry = "";

      for (let i = 0; i < chars.length; i += 1) {
        const char = chars[i];

        if (char === "\r" || char === "\n") {
          // Sisanya disimpan untuk prompt berikutnya (kalau input di-pipe).
          carry = chars.slice(i + 1).replace(/^\r?\n/, "").replace(/\r?\n$/, "");
          finish();
          return;
        }
        if (char === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };

    stdin.on("data", onData);
    // Input ditutup (mis. piping dari file) — pakai apa yang sudah dibaca.
    stdin.on("end", finish);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const revokeTokens = args.includes("--revoke-tokens");
  const emailArg = args[args.indexOf("--email") + 1];

  // User admin hasil migrasi Laravel — email ini yang dipakai di produksi.
  const defaultEmail = "devagitisari96@gmail.com";

  const email = (emailArg && !emailArg.startsWith("--") ? emailArg : defaultEmail).trim();
  const password = await ask(`Password baru untuk ${email}: `);
  const confirmation = await ask("Ulangi password: ");

  if (password !== confirmation) {
    console.error("❌ Password tidak sama.");
    process.exit(1);
  }

  if (password.length < MIN_LENGTH) {
    console.error(`❌ Password minimal ${MIN_LENGTH} karakter.`);
    process.exit(1);
  }

  process.env.DATABASE_URL = resolveDatabaseUrl();
  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ User "${email}" tidak ada di database.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });

  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  const ok = updated ? await bcrypt.compare(password, updated.password) : false;

  console.log(`✅ Password ${email} di-update (bcrypt, ${BCRYPT_ROUNDS} rounds). Verifikasi: ${ok ? "OK" : "GAGAL"}`);

  if (revokeTokens) {
    const deleted = await prisma.apiToken.deleteMany({ where: { userId: user.id } });
    console.log(`🔒 ${deleted.count} sesi aktif dicabut (semua device harus login ulang).`);
  } else {
    console.log("ℹ️  Sesi lama tidak dicabut. Tambahkan --revoke-tokens kalau mau memaksa logout di semua device.");
  }

  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error("❌", error instanceof Error ? error.message : error);
  process.exit(1);
});
