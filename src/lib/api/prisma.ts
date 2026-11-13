import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Lazily instantiated Prisma client.
 *
 * The client is only created on the first query so that `next build` does not
 * require a reachable database (and so the connection pool is opened at most
 * once per serverless instance).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    const instance = globalForPrisma.prisma;
    const value = instance[property as keyof PrismaClient];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
