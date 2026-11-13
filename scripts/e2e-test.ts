/**
 * End-to-end API test against a real Postgres database.
 *
 * Usage:
 *   npx tsx scripts/local-postgres.ts                  # terminal 1 (PGlite server)
 *   $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable"
 *   npx tsx scripts/e2e-test.ts
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { dispatch } from "../src/lib/api/router";

const API = "http://localhost:3000/api";

let token = "";
let failures = 0;

async function call(
  method: string,
  path: string,
  options: { body?: unknown; auth?: boolean; form?: FormData } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  if (options.auth !== false && token) {
    headers.authorization = `Bearer ${token}`;
  }

  const request = new NextRequest(`${API}/${path}`, { method, headers, body });
  const response = await dispatch(request, path.split("/").filter(Boolean));
  const text = await response.text();

  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  return { status: response.status, body: parsed };
}

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failures += 1;
    console.log(`✕ ${name}`, detail === undefined ? "" : JSON.stringify(detail).slice(0, 400));
  }
}

async function main() {
  console.log("— Public endpoints —");

  const settings = await call("GET", "settings", { auth: false });
  check("GET /settings → 200", settings.status === 200, settings.body);
  check("GET /settings returns the site name", Boolean(settings.body?.data?.name), settings.body);

  const projects = await call("GET", "projects", { auth: false });
  check("GET /projects → 200", projects.status === 200, projects.body);
  check("GET /projects returns the data envelope", Array.isArray(projects.body?.data), projects.body);

  const skills = await call("GET", "skills", { auth: false });
  check("GET /skills → 200", skills.status === 200, skills.body);
  check("GET /skills returns grouped data", Array.isArray(skills.body?.data), skills.body);

  const experiences = await call("GET", "experiences", { auth: false });
  check("GET /experiences → 200", experiences.status === 200, experiences.body);

  const certificates = await call("GET", "certificates", { auth: false });
  check("GET /certificates → 200", certificates.status === 200, certificates.body);

  console.log("\n— Authentication —");

  const badLogin = await call("POST", "login", {
    auth: false,
    body: { email: "admin@example.com", password: "wrong-password" },
  });
  check("POST /login with a wrong password → 422", badLogin.status === 422, badLogin.body);

  const login = await call("POST", "login", {
    auth: false,
    body: { email: process.env.ADMIN_EMAIL ?? "admin@example.com", password: process.env.ADMIN_PASSWORD ?? "password123" },
  });
  check("POST /login → 200", login.status === 200, login.body);
  check("POST /login returns a token", typeof login.body?.token === "string", login.body);

  token = login.body?.token ?? "";

  const unauthorized = await call("GET", "admin/inquiries", { auth: false });
  check("GET /admin/inquiries without a token → 401", unauthorized.status === 401, unauthorized.body);

  console.log("\n— Admin CRUD —");

  const createdSkill = await call("POST", "admin/skills", {
    body: { name: "Playwright", category: "Testing", percentage: 80, show_on_home: true },
  });
  check("POST /admin/skills → 201", createdSkill.status === 201, createdSkill.body);
  const skillId = createdSkill.body?.data?.id;

  const updatedSkill = await call("PUT", `admin/skills/${skillId}`, {
    body: { name: "Playwright", category: "Testing", percentage: 95, show_on_home: false },
  });
  check("PUT /admin/skills/:id → 200", updatedSkill.status === 200, updatedSkill.body);
  check("PUT /admin/skills/:id persists the percentage", updatedSkill.body?.data?.percentage === 95, updatedSkill.body);

  const createdProject = await call("POST", "admin/projects", {
    body: {
      title: "E2E Test Project",
      description: "Dibuat oleh automated test",
      category: "Web Development",
      status: "published",
      featured: true,
      key_features: ["Satu", "Dua"],
      skill_ids: skillId ? [skillId] : [],
      image_urls: ["https://example.com/image.png"],
    },
  });
  check("POST /admin/projects → 201", createdProject.status === 201, createdProject.body);
  check("POST /admin/projects auto-generates the slug", createdProject.body?.data?.slug === "e2e-test-project", createdProject.body);
  check("POST /admin/projects stores the skills", createdProject.body?.data?.skillIds?.length === 1, createdProject.body);
  check("POST /admin/projects stores the gallery", createdProject.body?.data?.images?.length === 1, createdProject.body);
  const projectId = createdProject.body?.data?.id;

  const detail = await call("GET", `projects/e2e-test-project`, { auth: false });
  check("GET /projects/:slug → 200", detail.status === 200, detail.body);
  check("GET /projects/:slug returns the key features", detail.body?.data?.keyFeatures?.length === 2, detail.body);

  const updatedProject = await call("PUT", `admin/projects/${projectId}`, {
    body: { title: "E2E Test Project", description: "Diupdate", status: "draft", featured: false },
  });
  check("PUT /admin/projects/:id → 200", updatedProject.status === 200, updatedProject.body);
  check("PUT /admin/projects/:id updates the status", updatedProject.body?.data?.status === "draft", updatedProject.body);

  const deletedProject = await call("DELETE", `admin/projects/${projectId}`);
  check("DELETE /admin/projects/:id → 200", deletedProject.status === 200, deletedProject.body);

  console.log("\n— Contact form & inquiries —");

  const contact = await call("POST", "contact", {
    auth: false,
    body: { name: "Tester", email: "tester@example.com", subject: "Halo", message: "Ini pesan uji coba." },
  });
  check("POST /contact → 201", contact.status === 201, contact.body);

  const inquiries = await call("GET", "admin/inquiries");
  check("GET /admin/inquiries → 200", inquiries.status === 200, inquiries.body);
  check("GET /admin/inquiries contains the new inquiry", inquiries.body?.data?.length >= 1, inquiries.body);

  const inquiryId = inquiries.body?.data?.[0]?.id;
  const markRead = await call("PUT", `admin/inquiries/${inquiryId}`, { body: { is_read: true } });
  check("PUT /admin/inquiries/:id → 200", markRead.status === 200, markRead.body);

  console.log("\n— Sessions —");

  const sessions = await call("GET", "admin/sessions");
  check("GET /admin/sessions → 200", sessions.status === 200, sessions.body);
  check("GET /admin/sessions lists the current device", sessions.body?.data?.sessions?.length >= 1, sessions.body);

  const password = await call("POST", "admin/password", {
    body: { current_password: process.env.ADMIN_PASSWORD ?? "password123", password: "newpassword123", password_confirmation: "newpassword123" },
  });
  check("POST /admin/password → 200", password.status === 200, password.body);

  const wrongCurrent = await call("POST", "admin/password", {
    body: { current_password: "nope", password: "anotherpassword", password_confirmation: "anotherpassword" },
  });
  check("POST /admin/password with a wrong current password → 422", wrongCurrent.status === 422, wrongCurrent.body);

  // Restore the original password so the test is repeatable.
  await call("POST", "admin/password", {
    body: {
      current_password: "newpassword123",
      password: process.env.ADMIN_PASSWORD ?? "password123",
      password_confirmation: process.env.ADMIN_PASSWORD ?? "password123",
    },
  });

  console.log("\n— Analytics —");

  const track = await call("POST", "analytics/track", { auth: false, body: { page: "Home", path: "/" } });
  check("POST /analytics/track → 201", track.status === 201, track.body);

  const overview = await call("GET", "admin/analytics/overview");
  check("GET /admin/analytics/overview → 200", overview.status === 200, overview.body);
  check("overview counts the page view", overview.body?.data?.totalPageViews >= 1, overview.body);

  console.log("\n— Backup —");

  const backup = await call("GET", "admin/backup/export");
  check("GET /admin/backup/export → 200", backup.status === 200);
  check("backup contains every section", ["projects", "skills", "experiences", "certificates", "settings", "inquiries"].every((key) => Array.isArray(backup.body?.[key])), Object.keys(backup.body ?? {}));

  const form = new FormData();
  form.append("backup", new File([JSON.stringify(backup.body)], "backup.json", { type: "application/json" }));
  const imported = await call("POST", "admin/backup/import", { form });
  check("POST /admin/backup/import → 200", imported.status === 200, imported.body);

  console.log("\n— Multipart upload path (requires CLOUDINARY_URL) —");

  const uploadForm = new FormData();
  uploadForm.append("title", "Upload Test");
  uploadForm.append("issuer", "Tester");
  uploadForm.append("image", new File([new Uint8Array([1, 2, 3])], "cert.png", { type: "image/png" }));

  const upload = await call("POST", "admin/certificates", { form: uploadForm });
  const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_URL);
  if (cloudinaryConfigured) {
    check("POST /admin/certificates with a file → 201", upload.status === 201, upload.body);
  } else {
    check("POST /admin/certificates without Cloudinary → 500 (handled error)", upload.status === 500, upload.body);
  }

  console.log("\n— Logout —");

  const logout = await call("POST", "logout");
  check("POST /logout → 200", logout.status === 200, logout.body);

  const afterLogout = await call("GET", "admin/inquiries");
  check("the token is revoked after logout → 401", afterLogout.status === 401, afterLogout.body);

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll end-to-end checks passed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
