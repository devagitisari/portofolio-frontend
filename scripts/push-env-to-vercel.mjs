/**
 * Adds the missing app environment variables to Vercel (production + preview).
 * Values are read from .env.local and piped into the CLI, so they never end up
 * in the shell history.
 *
 * Usage: node scripts/push-env-to-vercel.mjs
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const SENSITIVE = [
  "CLOUDINARY_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "MAIL_FROM_ADDRESS",
  "MAIL_FROM_NAME",
];

// Plain (non-secret) vars that Vercel does not manage yet.
const PLAIN = {
  NEXT_PUBLIC_BACKEND_API_URL: "https://devagitisari.my.id/api",
};

const local = readFileSync(".env.local", "utf8");

function readLocal(name) {
  const match = local.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
  if (!match) return undefined;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function addVar(name, value, sensitive) {
  return new Promise((resolve, reject) => {
    const args = ["env", "add", name, "-e", "production,preview"];
    if (sensitive) args.push("--sensitive");

    const child = spawn("vercel", args, { stdio: ["pipe", "inherit", "inherit"], shell: true });

    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${name} gagal (exit ${code})`))));

    child.stdin.write(`${value}\n`);
    child.stdin.end();
  });
}

async function main() {
  const todo = Object.entries(PLAIN).map(([name, value]) => [name, value, false]);

  for (const name of SENSITIVE) {
    const value = readLocal(name);
    if (!value) {
      console.log(`⚠ ${name} tidak ada di .env.local — dilewati`);
      continue;
    }
    todo.push([name, value, true]);
  }

  for (const [name, value, sensitive] of todo) {
    process.stdout.write(`▸ ${name} … `);
    try {
      await addVar(name, value, sensitive);
      console.log("✓");
    } catch (error) {
      console.log(`✕ ${error.message}`);
    }
  }

  console.log("\nSelesai. Verifikasi dengan: vercel env ls");
}

main();
