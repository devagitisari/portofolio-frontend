import { prisma } from "../prisma";
import { json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { createApiToken, describeUserAgent, hashPassword, verifyPassword } from "../auth";
import { rateLimit, clientIp } from "../rate-limit";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

const CREDENTIALS_ERROR = "The provided credentials are incorrect.";

async function login(ctx: Ctx): Promise<Response> {
  await rateLimit(`login:${clientIp(ctx.req.headers)}`, 5, 60);

  const validated = await new Validator(ctx.body)
    .required("email")
    .email("email")
    .required("password")
    .string("password")
    .validate();

  const email = String(validated.email);
  const password = String(validated.password);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.validation(CREDENTIALS_ERROR, { email: [CREDENTIALS_ERROR] });
  }

  if (!(await verifyPassword(password, user.password))) {
    throw ApiError.validation(CREDENTIALS_ERROR, { email: [CREDENTIALS_ERROR] });
  }

  // Opportunistically upgrade plain-text passwords that were inserted manually.
  if (!/^\$2[ayb]\$/.test(user.password)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    });
  }

  const userAgent = ctx.req.headers.get("user-agent") ?? "admin-session";
  const { plain } = await createApiToken(user.id, userAgent);

  return json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: plain,
  });
}

async function logout(ctx: Ctx): Promise<Response> {
  if (ctx.token) {
    await prisma.apiToken.deleteMany({ where: { id: ctx.token.id, userId: ctx.user!.id } });
  }

  return json({ message: "Logout successful" });
}

async function sessions(ctx: Ctx): Promise<Response> {
  const tokens = await prisma.apiToken.findMany({
    where: { userId: ctx.user!.id },
    orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
  });

  const currentTokenId = ctx.token?.id ?? null;

  const list = tokens.map((token) => ({
    id: token.id,
    device_type: describeUserAgent(token.name),
    ip_address: token.id === currentTokenId ? clientIp(ctx.req.headers) : "Active Session",
    last_used_at: (token.lastUsedAt ?? token.createdAt).toISOString(),
    created_at: token.createdAt.toISOString(),
  }));

  return json({
    data: {
      currentTokenId,
      sessions: list,
      twoFactorEnabled: ctx.user!.twoFactorEnabled,
    },
  });
}

async function revokeSession(ctx: Ctx): Promise<Response> {
  const tokenId = Number.parseInt(ctx.params.token ?? "", 10);

  if (!Number.isInteger(tokenId)) {
    return json({ message: "Session not found" }, 404);
  }

  const token = await prisma.apiToken.findFirst({ where: { id: tokenId, userId: ctx.user!.id } });

  if (!token) {
    return json({ message: "Session not found" }, 404);
  }

  if (ctx.token?.id === token.id) {
    return json({ message: "Cannot revoke current active session from this device" }, 400);
  }

  await prisma.apiToken.delete({ where: { id: token.id } });

  return json({ message: "Session revoked successfully" });
}

async function logoutOtherDevices(ctx: Ctx): Promise<Response> {
  await prisma.apiToken.deleteMany({
    where: {
      userId: ctx.user!.id,
      ...(ctx.token ? { id: { not: ctx.token.id } } : {}),
    },
  });

  return json({ message: "All other sessions have been signed out successfully" });
}

async function updatePassword(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body)
    .required("current_password")
    .string("current_password")
    .required("password")
    .string("password", { min: 8 })
    .string("password_confirmation", { nullable: true })
    .validate();

  if (String(validated.password) !== String(validated.password_confirmation ?? "")) {
    throw ApiError.validation("The password field confirmation does not match.", {
      password: ["The password field confirmation does not match."],
    });
  }

  const user = await prisma.user.findUnique({ where: { id: ctx.user!.id } });
  if (!user || !(await verifyPassword(String(validated.current_password), user.password))) {
    throw ApiError.validation("The current password is incorrect.", {
      current_password: ["The current password is incorrect."],
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(String(validated.password)) },
  });

  return json({ message: "Password updated successfully" });
}

async function toggleTwoFactor(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body).required("enabled").boolean("enabled").validate();

  const enabled = Boolean(validated.enabled);

  await prisma.user.update({
    where: { id: ctx.user!.id },
    data: { twoFactorEnabled: enabled },
  });

  return json({
    message: enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
    twoFactorEnabled: enabled,
  });
}

export const authRoutes: RouteDefinition[] = [
  { method: "POST", pattern: "login", handler: login },
  { method: "POST", pattern: "logout", handler: logout, auth: true },
  { method: "GET", pattern: "admin/sessions", handler: sessions, auth: true },
  { method: "DELETE", pattern: "admin/sessions/:token", handler: revokeSession, auth: true },
  { method: "POST", pattern: "admin/revoke-sessions", handler: logoutOtherDevices, auth: true },
  { method: "POST", pattern: "admin/password", handler: updatePassword, auth: true },
  { method: "POST", pattern: "admin/two-factor", handler: toggleTwoFactor, auth: true },
];
