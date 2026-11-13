/**
 * Base URL of the API (absolute).
 *
 * The API is served by this very Next.js app, so the browser always talks to
 * its own origin — see `apiUrl()`. This value is only needed for server-side
 * rendering and for the build, where a relative URL cannot be fetched.
 */
export const BACKEND_API_URL = (
    process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ||
    "http://localhost:3000/api"
);

/**
 * URL untuk memanggil API.
 *
 * - Di browser → same-origin (`/api/...`), jadi tidak butuh CORS dan jalan
 *   di domain manapun (domain sendiri, preview URL, .vercel.app).
 * - Di server (SSR/build) → absolute, karena `fetch` tidak menerima URL relatif.
 */
export function apiUrl(path: string): string {
    if (typeof window !== "undefined") {
        return `/api${path}`;
    }
    return `${BACKEND_API_URL}${path}`;
}

/** Prefix untuk URL aset yang relatif (dipakai untuk path storage lama). */
export function apiBase(): string {
    return typeof window === "undefined" ? BACKEND_API_URL.replace(/\/api\/?$/, "") : "";
}
const AUTH_TOKEN_KEY = "deva_auth_token";
const ADMIN_LOGGED_KEY = "deva_admin_logged";
export const ADMIN_SESSION_COOKIE = "deva_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface BackendUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface BackendInquiry {
    id: number | string;
    name: string;
    email: string;
    subject: string;
    message?: string;
    category?: string;
    is_read: boolean;
    is_replied?: boolean;
    created_at: string;
}

export interface GitHubActivityEvent {
    id: string | null;
    type: string;
    repo: string | null;
    createdAt: string | null;
    summary: string;
    url: string;
}

export interface GitHubActivityResponse {
    enabled: boolean;
    username: string | null;
    events: GitHubActivityEvent[];
}

export {
    type ApiAnalyticsOverview,
    type ApiCertificate,
    type ApiContactResult,
    type ApiExperience,
    type ApiProject,
    type ApiProjectImage,
    type ApiReply,
    type ApiSessionsResponse,
    type ApiSession,
    type ApiSettings,
    type ApiSkill,
} from "@/services/apiTypes";

import type {
    ApiAnalyticsOverview,
    ApiCertificate,
    ApiContactResult,
    ApiExperience,
    ApiProject,
    ApiReply,
    ApiSessionsResponse,
    ApiSettings,
    ApiSkill,
} from "@/services/apiTypes";

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAdminSessionCookie() {
    if (typeof document === "undefined") return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ADMIN_SESSION_COOKIE}=1; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearAdminSessionCookie() {
    if (typeof document === "undefined") return;
    document.cookie = `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setAuthToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_LOGGED_KEY, "true");
    setAdminSessionCookie();
}

export function clearAuthStorage() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_LOGGED_KEY);
    clearAdminSessionCookie();
}

function handleUnauthorized() {
    clearAuthStorage();
    if (typeof window !== "undefined" && window.location.pathname !== "/admin-login") {
        window.location.href = "/admin-login";
    }
}

async function toErrorMessage(response: Response): Promise<string> {
    const text = await response.text();

    try {
        const data = JSON.parse(text);

        if (data && typeof data === "object") {
            if (typeof data.message === "string" && data.message.trim()) {
                return data.message;
            }
            if (data.errors && typeof data.errors === "object") {
                const first = Object.values(data.errors).find(
                    (value) => Array.isArray(value) && value.length > 0
                );
                if (first) return String(first);
            }
        }
    } catch {
        // Body is not JSON — never surface raw HTML/stack traces to the UI.
    }

    return `Request failed (HTTP ${response.status})`;
}

function buildHeaders(headers?: HeadersInit): HeadersInit {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function fetchForm<T>(path: string, form: FormData, method = "POST"): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // PHP/Laravel cannot parse multipart FormData on PUT/PATCH requests.
    // Use POST with _method spoofing instead.
    const actualMethod = method.toUpperCase();
    if (actualMethod !== "POST") {
        form.append("_method", actualMethod);
    }

    const response = await fetch(apiUrl(path), {
        method: "POST",
        body: form,
        headers,
    });

    if (response.status === 401) {
        handleUnauthorized();
    }

    if (!response.ok) {
        throw new Error(await toErrorMessage(response));
    }

    const text = await response.text();
    return text ? JSON.parse(text) as T : (null as unknown as T);
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(apiUrl(path), {
        ...init,
        headers: buildHeaders(init.headers),
    });

    if (response.status === 401) {
        handleUnauthorized();
    }

    if (!response.ok) {
        throw new Error(await toErrorMessage(response));
    }

    const text = await response.text();
    return text ? JSON.parse(text) as T : (null as unknown as T);
}

/**
 * Laravel wraps collections in a `data` key while single resources are
 * returned as-is — this normalises both shapes.
 */
function unwrapData<T>(payload: unknown): T {
    if (payload && typeof payload === "object" && "data" in payload) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}

export async function login(email: string, password: string) {
    return fetchJson<{ message: string; user: BackendUser; token: string }>(
        "/login",
        {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }
    );
}

export async function logout() {
    return fetchJson<{ message: string }>(
        "/logout",
        {
            method: "POST",
        }
    );
}

export async function getProjects(): Promise<ApiProject[]> {
    return unwrapData<ApiProject[]>(await fetchJson(`/projects`));
}

export async function getProjectBySlug(slug: string): Promise<ApiProject> {
    return unwrapData<ApiProject>(await fetchJson(`/projects/${slug}`));
}

export async function getExperiences(): Promise<ApiExperience[]> {
    return unwrapData<ApiExperience[]>(await fetchJson(`/experiences`));
}

export async function getSkills(): Promise<ApiSkill[]> {
    return unwrapData<ApiSkill[]>(await fetchJson(`/skills`));
}

export async function getSettings(): Promise<ApiSettings> {
    return unwrapData<ApiSettings>(await fetchJson(`/settings`));
}

export async function getGitHubActivity() {
    return unwrapData<GitHubActivityResponse>(await fetchJson(`/github-activity`));
}

export async function getInquiries() {
    return unwrapData<BackendInquiry[]>(await fetchJson(`/admin/inquiries`));
}

export async function createProject(project: object): Promise<ApiProject> {
    return unwrapData<ApiProject>(await fetchJson(`/admin/projects`, {
        method: "POST",
        body: JSON.stringify(project),
    }));
}

export async function createProjectFormData(form: FormData): Promise<ApiProject> {
    return unwrapData<ApiProject>(await fetchForm(`/admin/projects`, form, "POST"));
}

export async function updateProject(id: string | number, project: object): Promise<ApiProject> {
    return unwrapData<ApiProject>(await fetchJson(`/admin/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(project),
    }));
}

export async function updateProjectFormData(id: string | number, form: FormData): Promise<ApiProject> {
    return unwrapData<ApiProject>(await fetchForm(`/admin/projects/${id}`, form, "PUT"));
}

export async function deleteProject(id: string | number) {
    return await fetchJson(`/admin/projects/${id}`, {
        method: "DELETE",
    });
}

export async function createSkill(skill: object): Promise<ApiSkill> {
    return unwrapData<ApiSkill>(await fetchJson(`/admin/skills`, {
        method: "POST",
        body: JSON.stringify(skill),
    }));
}

export async function updateSkill(id: string | number, skill: object): Promise<ApiSkill> {
    return unwrapData<ApiSkill>(await fetchJson(`/admin/skills/${id}`, {
        method: "PUT",
        body: JSON.stringify(skill),
    }));
}

export async function deleteSkill(id: string | number) {
    return await fetchJson(`/admin/skills/${id}`, {
        method: "DELETE",
    });
}

export async function createExperience(experience: object): Promise<ApiExperience> {
    return unwrapData<ApiExperience>(await fetchJson(`/admin/experiences`, {
        method: "POST",
        body: JSON.stringify(experience),
    }));
}

export async function createExperienceFormData(form: FormData): Promise<ApiExperience> {
    return unwrapData<ApiExperience>(await fetchForm(`/admin/experiences`, form, "POST"));
}

export async function updateExperience(id: string | number, experience: object): Promise<ApiExperience> {
    return unwrapData<ApiExperience>(await fetchJson(`/admin/experiences/${id}`, {
        method: "PUT",
        body: JSON.stringify(experience),
    }));
}

export async function updateExperienceFormData(id: string | number, form: FormData): Promise<ApiExperience> {
    return unwrapData<ApiExperience>(await fetchForm(`/admin/experiences/${id}`, form, "PUT"));
}

export async function deleteExperience(id: string | number) {
    return await fetchJson(`/admin/experiences/${id}`, {
        method: "DELETE",
    });
}

export async function updateSettings(id: string | number, settings: object): Promise<ApiSettings> {
    return unwrapData<ApiSettings>(await fetchJson(`/admin/settings/${id}`, {
        method: "PUT",
        body: JSON.stringify(settings),
    }));
}

export async function updateSettingsFormData(id: string | number, form: FormData): Promise<ApiSettings> {
    return unwrapData<ApiSettings>(await fetchForm(`/admin/settings/${id}`, form, "PUT"));
}

export async function updatePassword(currentPassword: string, password: string, passwordConfirmation: string) {
    return fetchJson<{ message: string }>(
        "/admin/password",
        {
            method: "POST",
            body: JSON.stringify({
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            }),
        }
    );
}

export async function revokeSessions() {
    return fetchJson<{ message: string }>(
        "/admin/revoke-sessions",
        {
            method: "POST",
        }
    );
}

export async function getActiveSessions(): Promise<ApiSessionsResponse> {
    return unwrapData<ApiSessionsResponse>(await fetchJson(`/admin/sessions`));
}

export async function revokeSession(tokenId: string) {
    return fetchJson<{ message: string }>(
        `/admin/sessions/${tokenId}`,
        {
            method: "DELETE",
        }
    );
}

export async function toggleTwoFactor(enabled: boolean) {
    return fetchJson<{ message: string; twoFactorEnabled: boolean }>(
        "/admin/two-factor",
        {
            method: "POST",
            body: JSON.stringify({ enabled }),
        }
    );
}

export async function setInquiryRead(id: string | number, isRead: boolean): Promise<BackendInquiry> {
    return unwrapData<BackendInquiry>(await fetchJson(`/admin/inquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_read: isRead }),
    }));
}

export async function getAnalyticsOverview(): Promise<ApiAnalyticsOverview> {
    return unwrapData<ApiAnalyticsOverview>(await fetchJson(`/admin/analytics/overview`));
}

export async function trackPageView(page: string, path: string) {
    return fetchJson(`/analytics/track`, {
        method: "POST",
        body: JSON.stringify({ page, path }),
    });
}

export async function setInquiryReplied(id: string | number, isReplied: boolean): Promise<BackendInquiry> {
    return unwrapData<BackendInquiry>(await fetchJson(`/admin/inquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_replied: isReplied }),
    }));
}

export async function sendReply(inquiryId: string | number, message: string): Promise<ApiReply> {
    return unwrapData<ApiReply>(await fetchJson(`/admin/inquiries/${inquiryId}/replies`, {
        method: "POST",
        body: JSON.stringify({ message }),
    }));
}

export async function deleteInquiry(id: string | number) {
    return await fetchJson(`/admin/inquiries/${id}`, {
        method: "DELETE",
    });
}

export async function postContact(payload: { name: string; email: string; subject: string; category: string; message: string }): Promise<ApiContactResult> {
    return fetchJson<ApiContactResult>(
        "/contact",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

// ── Certificates ────────────────────────────────────────────────────

export async function getCertificates(): Promise<ApiCertificate[]> {
    return unwrapData<ApiCertificate[]>(await fetchJson(`/certificates`));
}

export async function getCertificate(id: string | number): Promise<ApiCertificate> {
    return unwrapData<ApiCertificate>(await fetchJson(`/certificates/${id}`));
}

export async function createCertificateFormData(form: FormData): Promise<ApiCertificate> {
    return unwrapData<ApiCertificate>(await fetchForm(`/admin/certificates`, form, "POST"));
}

export async function updateCertificateFormData(id: string | number, form: FormData): Promise<ApiCertificate> {
    return unwrapData<ApiCertificate>(await fetchForm(`/admin/certificates/${id}`, form, "PUT"));
}

export async function deleteCertificate(id: string | number) {
    return await fetchJson(`/admin/certificates/${id}`, {
        method: "DELETE",
    });
}

export function isAdminLogged() {
    if (typeof window === "undefined") return false;
    const token = getAuthToken();
    return token !== null && token !== "";
}

export async function exportBackup() {
    const response = await fetch(apiUrl("/admin/backup/export"), {
        method: "GET",
        headers: buildHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to export backup");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

export async function importBackup(file: File): Promise<{ message?: string }> {
    const formData = new FormData();
    formData.append('backup', file);

    const response = await fetch(apiUrl("/admin/backup/import"), {
        method: "POST",
        headers: {
            "Accept": "application/json",
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(await toErrorMessage(response));
    }

    return await response.json() as { message?: string };
}
