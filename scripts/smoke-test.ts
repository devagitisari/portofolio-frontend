/**
 * Smoke test for the API router — runs without a database.
 *
 * Usage: npx tsx scripts/smoke-test.ts
 */
import { NextRequest } from "next/server";
import { dispatch } from "../src/lib/api/router";

interface Case {
  name: string;
  method: string;
  path: string;
  body?: unknown;
  expected: number;
}

const cases: Case[] = [
  { name: "unknown route → 404", method: "GET", path: "does-not-exist", expected: 404 },
  { name: "wrong method → 405", method: "PUT", path: "projects", expected: 405 },
  { name: "login without credentials → 422", method: "POST", path: "login", body: {}, expected: 422 },
  {
    name: "login with a malformed email → 422",
    method: "POST",
    path: "login",
    body: { email: "not-an-email", password: "secret123" },
    expected: 422,
  },
  { name: "admin route without a token → 401", method: "GET", path: "admin/skills", expected: 401 },
  { name: "admin route with a bogus token → 401", method: "GET", path: "admin/settings/1", expected: 401 },
  {
    name: "admin projects index does not exist → 405",
    method: "GET",
    path: "admin/projects",
    expected: 405,
  },
];

let failures = 0;

async function main() {
  for (const testCase of cases) {
    const url = `http://localhost:3000/api/${testCase.path}`;
    const request = new NextRequest(url, {
      method: testCase.method,
      headers: testCase.body ? { "content-type": "application/json" } : undefined,
      body: testCase.body ? JSON.stringify(testCase.body) : undefined,
    });

    const response = await dispatch(request, testCase.path.split("/").filter(Boolean));
    const status = response.status;
    const body = await response.text();

    const ok = status === testCase.expected;
    if (!ok) failures += 1;

    console.log(
      `${ok ? "✓" : "✕"} ${testCase.name} — got ${status}${ok ? "" : ` (expected ${testCase.expected})`}`,
    );
    if (!ok) {
      console.log(`   ${body.slice(0, 300)}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} smoke test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${cases.length} smoke tests passed.`);
  }
}

main();
