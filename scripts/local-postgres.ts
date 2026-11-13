/**
 * Local Postgres (PGlite) over the wire protocol, so Prisma can connect to it
 * exactly like a real Postgres server. Used for end-to-end testing without
 * installing Postgres.
 *
 * Usage:
 *   npx tsx scripts/local-postgres.ts          # start the server
 *   npx tsx scripts/local-postgres.ts --migrate # start + run migrations + seed
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.LOCAL_PG_PORT ?? 55432);
const DATA_DIR = process.env.LOCAL_PG_DATA ?? "./.local-pgdata";

async function main() {
  const db = await PGlite.create({ dataDir: DATA_DIR });

  const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1", maxConnections: 25 });
  await server.start();

  console.log(`Postgres (PGlite) listening on 127.0.0.1:${PORT}`);
  console.log(`DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable"`);

  if (process.argv.includes("--migrate")) {
    const { exec } = await import("node:child_process");
    const url = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable&pgbouncer=true`;

    const run = (command: string, extraEnv: Record<string, string> = {}) =>
      new Promise<void>((resolve, reject) => {
        const env = {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV ?? "development",
          ...extraEnv,
        } as NodeJS.ProcessEnv;

        // exec() is asynchronous, so the socket server keeps serving.
        exec(command, { env }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

    await run(`npx prisma migrate deploy`, { DATABASE_URL: url });
    await run(`npx prisma db seed`, {
      DATABASE_URL: url,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@example.com",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "password123",
    });

    console.log("Migrations + seed applied.");
  }

  const shutdown = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
