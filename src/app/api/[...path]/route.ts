import type { NextRequest } from "next/server";
import { dispatch } from "@/lib/api/router";

/**
 * Every API endpoint is served by this single catch-all route so the
 * deployment stays within Vercel's serverless function budget.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const { path } = await ctx.params;
  return dispatch(req, path ?? []);
}

export async function GET(req: NextRequest, ctx: RouteContext): Promise<Response> {
  return handle(req, ctx);
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<Response> {
  return handle(req, ctx);
}

export async function PUT(req: NextRequest, ctx: RouteContext): Promise<Response> {
  return handle(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<Response> {
  return handle(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: RouteContext): Promise<Response> {
  return handle(req, ctx);
}
