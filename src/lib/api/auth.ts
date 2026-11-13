import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ApiError } from "./errors";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
}

export interface AuthToken {
  id: number;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a bcrypt hash. Laravel stores `$2y$` hashes which
 * bcryptjs is able to verify, so users migrated from the old backend keep
 * working without re-hashing.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;

  // Laravel's `Hash::make()` output — already a bcrypt hash.
  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  // Legacy: plain-text passwords inserted straight into the database.
  return password === hash;
}

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Creates an opaque bearer token, Sanctum style: `<id>|<secret>`. */
export async function createApiToken(userId: number, name: string): Promise<{ plain: string; token: AuthToken }> {
  const secret = crypto.randomBytes(32).toString("hex");
  const token = await prisma.apiToken.create({
    data: {
      userId,
      tokenHash: hashSecret(secret),
      name: name.slice(0, 255),
      abilities: JSON.stringify(["*"]),
    },
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
  });

  return { plain: `${token.id}|${secret}`, token };
}

/** Resolves a bearer token into its owner. Returns null when invalid. */
export async function resolveApiToken(plain: string): Promise<{ user: AuthUser; token: AuthToken } | null> {
  const separator = plain.indexOf("|");
  if (separator === -1) return null;

  const id = Number.parseInt(plain.slice(0, separator), 10);
  if (!Number.isInteger(id)) return null;

  const secret = plain.slice(separator + 1);
  if (!secret) return null;

  const record = await prisma.apiToken.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!record) return null;
  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null;
  if (!safeEquals(record.tokenHash, hashSecret(secret))) return null;

  // Touch at most once every 5 minutes to keep the write overhead low.
  const stale = !record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > 5 * 60 * 1000;
  if (stale) {
    await prisma.apiToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });
  }

  return {
    user: {
      id: record.user.id,
      name: record.user.name,
      email: record.user.email,
      role: record.user.role,
      twoFactorEnabled: record.user.twoFactorEnabled,
    },
    token: {
      id: record.id,
      name: record.name,
      lastUsedAt: stale ? new Date() : record.lastUsedAt,
      createdAt: record.createdAt,
    },
  };
}

export function requireUser(user: AuthUser | null): AuthUser {
  if (!user) {
    throw ApiError.unauthorized();
  }
  return user;
}

/** Best-effort device/browser label for the admin "Active sessions" screen. */
export function describeUserAgent(userAgent: string): string {
  let deviceType = "Unknown Device";

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = "Tablet";
  } else if (/(up\.browser|up\.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile|iphone|ipad)/i.test(userAgent)) {
    deviceType = "Mobile Device";
  } else if (/(macintosh|mac os x|windows|linux|crkey)/i.test(userAgent)) {
    if (/windows/i.test(userAgent)) {
      deviceType = "Windows PC";
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      deviceType = "Macintosh";
    } else if (/linux/i.test(userAgent)) {
      deviceType = "Linux PC";
    } else {
      deviceType = "Desktop PC";
    }
  }

  let browser = "";
  if (/chrome/i.test(userAgent)) {
    browser = "Chrome";
    if (/edg/i.test(userAgent)) {
      browser = "Edge";
    } else if (/opr/i.test(userAgent)) {
      browser = "Opera";
    }
  } else if (/firefox/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
  }

  return browser ? `${deviceType} (${browser})` : deviceType;
}
