import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { json } from "../http";
import { clientIp, rateLimit } from "../rate-limit";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

async function track(ctx: Ctx): Promise<Response> {
  await rateLimit(`analytics:${clientIp(ctx.req.headers)}`, 30, 60);

  await prisma.analytics.create({
    data: {
      page: typeof ctx.body.page === "string" ? ctx.body.page : null,
      path: typeof ctx.body.path === "string" ? ctx.body.path : null,
      ipAddress: clientIp(ctx.req.headers),
      userAgent: ctx.req.headers.get("user-agent"),
      referrer: ctx.req.headers.get("referer"),
    },
  });

  return json({ message: "Page tracked successfully" }, 201);
}

async function overview(): Promise<Response> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [uniqueVisitors, totalPageViews, pageViewsLast7Days, pageViewsLast30Days, topPages] = await Promise.all([
    prisma.analytics.findMany({ distinct: ["ipAddress"], select: { ipAddress: true } }),
    prisma.analytics.count(),
    prisma.analytics.count({ where: { visitedAt: { gte: sevenDaysAgo } } }),
    prisma.analytics.count({ where: { visitedAt: { gte: thirtyDaysAgo } } }),
    prisma.analytics.groupBy({
      by: ["page"],
      _count: { _all: true },
      orderBy: { _count: { page: "desc" } },
      take: 10,
    }),
  ]);

  const dailyViews = await prisma.$queryRaw<
    Array<{ date: string | Date; views: bigint | number }>
  >(Prisma.sql`
    SELECT DATE(visited_at) AS date, COUNT(*) AS views
    FROM analytics
    WHERE visited_at >= ${sevenDaysAgo}
    GROUP BY date
    ORDER BY date ASC
  `);

  return json({
    data: {
      uniqueVisitors: uniqueVisitors.length,
      totalPageViews,
      pageViewsLast7Days,
      pageViewsLast30Days,
      topPages: topPages.map((row) => ({
        page: row.page,
        views: row._count._all,
      })),
      dailyViews: dailyViews.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
        views: Number(row.views),
      })),
    },
  });
}

export const analyticsRoutes: RouteDefinition[] = [
  { method: "POST", pattern: "analytics/track", handler: track },
  { method: "GET", pattern: "admin/analytics/overview", handler: overview, auth: true },
];
