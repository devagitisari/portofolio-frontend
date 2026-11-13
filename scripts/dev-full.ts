/**
 * One-command local development stack:
 *   1. starts an embedded Postgres (PGlite) over the real Postgres wire protocol
 *   2. applies the migrations + seeds the admin user
 *   3. starts the Next.js dev server (frontend + API in one app)
 *
 * Usage:
 *   npm run dev:full
 *
 * The API is then available at http://localhost:3000/api
 */
import { spawn } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.LOCAL_PG_PORT ?? 55432);
const DATA_DIR = process.env.LOCAL_PG_DATA ?? "./.local-pgdata";
const DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable&pgbouncer=true`;

function run(command: string, args: string[], extraEnv: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...(process.env as Record<string, string>),
        NODE_ENV: process.env.NODE_ENV ?? "development",
        ...extraEnv,
      },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

async function main() {
  console.log("▸ starting embedded Postgres (PGlite)…");
  const db = await PGlite.create({ dataDir: DATA_DIR });

  // The socket server has to be up before Prisma can connect. The migration
  // runs in a child process, so the event loop stays free to serve it.
  const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1", maxConnections: 25 });
  await server.start();
  console.log(`▸ Postgres ready on 127.0.0.1:${PORT}`);

  console.log("▸ applying migrations…");
  await run("npx", ["prisma", "migrate", "deploy"], { DATABASE_URL });

  console.log("▸ seeding admin user…");
  await run("npx", ["prisma", "db", "seed"], {
    DATABASE_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@example.com",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "password123",
    ADMIN_NAME: process.env.ADMIN_NAME ?? "Deva Gitisari",
  });

  console.log("▸ starting Next.js dev server on http://localhost:3000 …\n");
  await run("npx", ["next", "dev"], { DATABASE_URL });

  await server.stop();
  await db.close();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
