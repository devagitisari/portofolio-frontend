import { prisma } from "../prisma";
import { json } from "../http";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Optional personal access token. Unauthenticated GitHub API calls are limited
 * to 60 requests per hour *per IP*, and Vercel egress IPs are shared — so a
 * token is recommended for production. Without one the API still works, it is
 * just more prone to rate limiting.
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();

function githubHeaders(accept = "application/vnd.github+json"): Record<string, string> {
  return {
    Accept: accept,
    "User-Agent": "DevaPortfolio/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
}

async function remember<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  const now = Date.now();

  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await producer();
  cache.set(key, { value, expiresAt: now + ttlMs });

  if (cache.size > 500) {
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key);
    }
  }

  return value;
}

/** Port of Laravel's `Str::startsWith` + `parse_url` based username parser. */
export function extractUsername(github: string): string | null {
  const value = github.trim();

  if (value.startsWith("@")) {
    return value.replace(/^@/, "") || null;
  }

  let candidate = value;
  try {
    const path = new URL(value.startsWith("http") ? value : `https://${value}`).pathname;
    candidate = path.replace(/^\/+|\/+$/g, "");
  } catch {
    candidate = value;
  }

  const segments = candidate.split("/");
  return segments[0] ? segments[0] : null;
}

function summarize(event: { type?: string; repo?: { name?: string }; payload?: Record<string, unknown> }): string {
  const repo = event.repo?.name ?? "a repository";
  const type = event.type ?? "";

  switch (type) {
    case "PushEvent":
      return `Pushed commits to ${repo}`;
    case "PullRequestEvent":
      return `${capitalize(String(event.payload?.action ?? "updated"))} a pull request in ${repo}`;
    case "IssuesEvent":
      return `${capitalize(String(event.payload?.action ?? "updated"))} an issue in ${repo}`;
    case "CreateEvent":
      return `Created ${String(event.payload?.ref_type ?? "something")} in ${repo}`;
    case "ForkEvent":
      return `Forked ${repo}`;
    case "WatchEvent":
      return `Starred ${repo}`;
    case "IssueCommentEvent":
      return `Commented on an issue in ${repo}`;
    default:
      return `${headline(type.replace(/Event$/, ""))} in ${repo}`;
  }
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const headline = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

export interface ActivityEvent {
  id: string | null;
  type: string;
  repo: string | null;
  createdAt: string | null;
  summary: string;
  url: string;
}

/** Public activity feed (`/users/:user/events/public`). */
async function fetchPublicEvents(username: string): Promise<ActivityEvent[]> {
  const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=12`, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(payload)) return [];

  return payload.map((event) => {
    const repo = (event.repo as { name?: string } | undefined)?.name;

    return {
      id: (event.id as string | undefined) ?? null,
      type: (event.type as string | undefined) ?? "GitHubEvent",
      repo: repo ?? null,
      createdAt: (event.created_at as string | undefined) ?? null,
      summary: summarize(event as never),
      url: repo ? `https://github.com/${repo}` : `https://github.com/${username}`,
    };
  });
}

/**
 * Fallback source: the public activity feed is empty for accounts that hide
 * their activity (`Settings → Public profile → hide activity`), which is a
 * per-account privacy switch we cannot change from here. The commit search
 * API always lists the latest commits, so it keeps the section populated.
 */
async function fetchRecentCommits(username: string): Promise<ActivityEvent[]> {
  const query = encodeURIComponent(`author:${username}`);

  const response = await fetch(
    `https://api.github.com/search/commits?q=${query}&sort=author-date&order=desc&per_page=10`,
    {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    },
  );

  if (!response.ok) return [];

  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
  const items = Array.isArray(payload?.items) ? payload.items : [];

  return items.map((item) => {
    const repository = item.repository as { full_name?: string } | undefined;
    const commit = item.commit as { message?: string; author?: { date?: string } } | undefined;
    const repo = repository?.full_name ?? null;
    const message = (commit?.message ?? "").split("\n")[0]?.trim() || "Pushed commits";

    return {
      id: (item.sha as string | undefined) ?? null,
      type: "PushEvent",
      repo,
      createdAt: commit?.author?.date ?? null,
      summary: message,
      url:
        (item.html_url as string | undefined) ??
        (repo ? `https://github.com/${repo}` : `https://github.com/${username}`),
    };
  });
}

async function activity(): Promise<Response> {
  const settings = await prisma.setting.findFirst({ orderBy: { id: "asc" } });

  if (!settings?.showGithubActivity || !settings?.github) {
    return json({ data: { enabled: false, username: null, events: [] } });
  }

  const username = extractUsername(settings.github);

  if (!username) {
    return json({ data: { enabled: true, username: null, events: [] } });
  }

  const events = await remember(`github_activity_${username}`, 15 * 60 * 1000, async () => {
    const publicEvents = await fetchPublicEvents(username);
    if (publicEvents.length > 0) return publicEvents.slice(0, 8);

    const commits = await fetchRecentCommits(username);
    return commits.slice(0, 8);
  });

  return json({ data: { enabled: true, username, events } });
}

async function contributions(ctx: Ctx): Promise<Response> {
  const settings = await prisma.setting.findFirst({ orderBy: { id: "asc" } });

  if (!settings?.showGithubActivity || !settings?.github) {
    return new Response(null, { status: 204 });
  }

  const username = extractUsername(settings.github);
  if (!username) {
    return new Response(null, { status: 204 });
  }

  const theme = ctx.req.nextUrl.searchParams.get("theme") ?? "dark";

  const html = await remember(`github_contributions_${username}_${theme}`, 30 * 60 * 1000, async () => {
    try {
      const response = await fetch(`https://github.com/users/${username}/contributions`, {
        headers: { Accept: "text/html", "User-Agent": "DevaPortfolio/1.0" },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });

      if (!response.ok) return "";
      return await response.text();
    } catch {
      return "";
    }
  });

  if (!html) {
    return new Response(null, { status: 204 });
  }

  return new Response(wrapContributionsHtml(html, username, theme), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}

/** Port of GitHubActivityController::wrapContributionsHtml. */
export function wrapContributionsHtml(html: string, username: string, theme = "dark"): string {
  const isLight = theme === "light";
  const colorScheme = isLight ? "light" : "dark";

  const bodyColor = isLight ? "#24292f" : "#c9d1d9";
  const linkColor = isLight ? "#0969da" : "#58a6ff";
  const headingColor = isLight ? "#24292f" : "#c9d1d9";
  const borderColor = isLight ? "#d0d7de" : "#30363d";
  const labelColor = isLight ? "#656d76" : "#8b949e";
  const outlineColor = isLight ? "rgba(27, 31, 36, 0.06)" : "rgba(240, 246, 252, 0.06)";
  const levels = isLight
    ? ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]
    : ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    :root { color-scheme: ${colorScheme}; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: transparent;
      color: ${bodyColor};
      font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow-x: auto;
      overflow-y: hidden;
    }
    a { color: ${linkColor}; text-decoration: none; }
    a[href^="#year-link"],
    a[href*="why-are-my-contributions-not-showing-up"] {
      display: none !important;
    }
    .contrib-column,
    .contribution-activity-listing,
    .js-yearly-contributions .contrib-footer,
    .js-yearly-contributions .sr-only,
    .js-calendar-graph > h2 {
      display: none !important;
    }
    .js-yearly-contributions h2 {
      margin: 0 0 14px;
      color: ${headingColor};
      font-size: 18px;
      font-weight: 400;
      line-height: 1.5;
    }
    .border {
      border: 1px solid ${borderColor};
      border-radius: 6px;
    }
    .py-2 {
      padding-top: 14px;
      padding-bottom: 14px;
    }
    .js-calendar-graph,
    .calendar-graph {
      overflow: visible !important;
      padding: 0 !important;
    }
    .ContributionCalendar-grid {
      width: max-content;
      border-collapse: separate;
      border-spacing: 5px !important;
    }
    .ContributionCalendar-label {
      color: ${labelColor};
      fill: ${labelColor};
      font-size: 12px;
      font-weight: 400;
      text-align: left;
      padding: 0 6px 0 0;
    }
    .ContributionCalendar-grid tr {
      height: 16px !important;
    }
    .ContributionCalendar-day {
      shape-rendering: geometricPrecision;
      width: 11px !important;
      height: 11px !important;
      padding: 0 !important;
      border-radius: 3px !important;
      border: 1px solid ${borderColor};
      /* GitHub colours the day cells with background-color. The fill
         property alone is SVG-only and leaves the cells transparent. */
      background-color: ${levels[0]};
      fill: ${levels[0]};
      outline: 1px solid ${outlineColor};
      outline-offset: -1px;
    }
    .ContributionCalendar-day[data-level="0"] { background-color: ${levels[0]}; fill: ${levels[0]}; }
    .ContributionCalendar-day[data-level="1"] { background-color: ${levels[1]}; fill: ${levels[1]}; }
    .ContributionCalendar-day[data-level="2"] { background-color: ${levels[2]}; fill: ${levels[2]}; }
    .ContributionCalendar-day[data-level="3"] { background-color: ${levels[3]}; fill: ${levels[3]}; }
    .ContributionCalendar-day[data-level="4"] { background-color: ${levels[4]}; fill: ${levels[4]}; }
    .width-full {
      width: 100%;
      color: ${labelColor};
      font-size: 13px;
    }
    .f6 {
      color: ${labelColor};
      font-size: 13px;
    }
    .float-left {
      float: left;
      margin-left: 40px;
      margin-top: 12px;
    }
    .float-right {
      float: right;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 12px;
      margin-right: 10px;
    }
    .float-right .ContributionCalendar-day {
      display: inline-block;
      width: 10px !important;
      height: 10px !important;
      margin: 0 1px;
      border-radius: 2px !important;
    }
    .js-yearly-contributions {
      min-width: 1010px;
      width: max-content;
      margin: 0 auto;
      padding-bottom: 28px;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

export const githubRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "github-activity", handler: activity },
  { method: "GET", pattern: "github-contributions", handler: contributions },
];
