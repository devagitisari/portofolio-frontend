import type { NextRequest } from "next/server";
import type { AuthToken, AuthUser } from "./auth";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Ctx {
  /** The incoming request. */
  req: NextRequest;
  /** Effective HTTP method (honours Laravel-style `_method` spoofing). */
  method: Method;
  /** Path segments below `/api`, e.g. ["admin", "projects", "12"]. */
  segments: string[];
  /** Named path parameters, e.g. { id: "12" }. */
  params: Record<string, string>;
  /** Parsed request body (JSON object or flattened FormData). */
  body: Record<string, unknown>;
  /** The raw FormData when the request was multipart/form-data. */
  form: FormData | null;
  /** The authenticated user, when a valid bearer token was supplied. */
  user: AuthUser | null;
  /** The API token that authenticated the request. */
  token: AuthToken | null;
}

export type Handler = (ctx: Ctx) => Promise<Response> | Response;
