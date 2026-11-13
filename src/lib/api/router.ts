import type { NextRequest } from "next/server";
import { ApiError } from "./errors";
import { resolveApiToken } from "./auth";
import { formToObject, json } from "./http";
import type { Ctx, Handler, Method } from "./types";
import { authRoutes } from "./handlers/auth";
import { projectRoutes } from "./handlers/projects";
import { skillRoutes } from "./handlers/skills";
import { experienceRoutes } from "./handlers/experiences";
import { certificateRoutes } from "./handlers/certificates";
import { settingRoutes } from "./handlers/settings";
import { inquiryRoutes } from "./handlers/inquiries";
import { analyticsRoutes } from "./handlers/analytics";
import { githubRoutes } from "./handlers/github";
import { backupRoutes } from "./handlers/backup";

export interface RouteDefinition {
  method: Method;
  /** Path pattern relative to /api, e.g. "admin/projects/:id". */
  pattern: string;
  handler: Handler;
  /** When true the request must carry a valid bearer token. */
  auth?: boolean;
}

async function parseBody(req: NextRequest): Promise<{ body: Record<string, unknown>; form: FormData | null }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const form = await req.formData();
      return { body: formToObject(form), form };
    } catch {
      return { body: {}, form: null };
    }
  }

  if (contentType.includes("application/json")) {
    try {
      const parsed = await req.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { body: parsed as Record<string, unknown>, form: null };
      }
    } catch {
      // Empty or malformed body — treated as an empty payload.
    }
  }

  return { body: {}, form: null };
}

function matchPattern(pattern: string, segments: string[]): Record<string, string> | null {
  const parts = pattern.split("/").filter(Boolean);

  // A trailing `*` swallows the remaining segments (e.g. "storage/*").
  if (parts[parts.length - 1] === "*") {
    const head = parts.slice(0, -1);
    if (segments.length < head.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < head.length; i += 1) {
      const part = head[i]!;
      const segment = segments[i]!;

      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(segment);
        continue;
      }

      if (part !== segment) return null;
    }

    params["*"] = segments.slice(head.length).map(decodeURIComponent).join("/");
    return params;
  }

  if (parts.length !== segments.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]!;
    const segment = segments[i]!;

    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(segment);
      continue;
    }

    if (part !== segment) return null;
  }

  return params;
}

/** Resolves the effective method, honouring Laravel's `_method` spoofing. */
function resolveMethod(req: NextRequest, body: Record<string, unknown>): Method {
  const method = req.method.toUpperCase() as Method;
  if (method !== "POST") return method;

  const spoofed = body?._method;
  if (typeof spoofed === "string") {
    const upper = spoofed.toUpperCase();
    if (upper === "PUT" || upper === "PATCH" || upper === "DELETE") {
      return upper;
    }
  }

  return method;
}

const routes: RouteDefinition[] = [
  ...authRoutes,
  ...projectRoutes,
  ...skillRoutes,
  ...experienceRoutes,
  ...certificateRoutes,
  ...settingRoutes,
  ...inquiryRoutes,
  ...analyticsRoutes,
  ...githubRoutes,
  ...backupRoutes,
];

/**
 * Runs a request through the API route table.
 *
 * Everything is served by a single catch-all route handler so the deployment
 * stays well below Vercel's serverless function limit.
 */
export async function dispatch(req: NextRequest, segments: string[]): Promise<Response> {
  try {
    const { body, form } = await parseBody(req);
    const method = resolveMethod(req, body);

    const authorization = req.headers.get("authorization") ?? "";
    const bearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";

    let user = null;
    let token = null;

    if (bearer) {
      const resolved = await resolveApiToken(bearer);
      if (resolved) {
        user = resolved.user;
        token = resolved.token;
      }
    }

    const ctx: Ctx = {
      req,
      method,
      segments,
      params: {},
      body,
      form,
      user,
      token,
    };

    const candidates = routes.filter((route) => route.method === method);
    let methodMismatch = false;

    for (const route of candidates) {
      const params = matchPattern(route.pattern, segments);
      if (!params) continue;

      ctx.params = params;

      if (route.auth && !ctx.user) {
        throw ApiError.unauthorized();
      }

      return await route.handler(ctx);
    }

    // The path exists but the method does not → 405, otherwise 404.
    for (const route of routes) {
      if (matchPattern(route.pattern, segments)) {
        methodMismatch = true;
        break;
      }
    }

    if (methodMismatch) {
      throw new ApiError(405, `The ${method} method is not supported for this route.`);
    }

    throw ApiError.notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return json(
      {
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      },
      error.status,
    );
  }

  console.error("Unhandled API error:", error);

  return json({ message: "Server Error" }, 500);
}
