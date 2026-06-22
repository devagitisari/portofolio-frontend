export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";
const AUTH_TOKEN_KEY = "deva_auth_token";
const ADMIN_LOGGED_KEY = "deva_admin_logged";

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
    message: string;
    is_read: boolean;
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

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_LOGGED_KEY, "true");
}

export function clearAuthStorage() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_LOGGED_KEY);
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

    const response = await fetch(`${BACKEND_API_URL}${path}`, {
        method: "POST",
        body: form,
        headers,
    });

    if (response.status === 401) {
        clearAuthStorage();
        if (typeof window !== "undefined") {
            window.location.href = "/admin-login";
        }
    }

    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || response.statusText || `HTTP ${response.status}`);
    }
    return text ? JSON.parse(text) as T : (null as unknown as T);
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
        ...init,
        headers: buildHeaders(init.headers),
    });

    if (response.status === 401) {
        clearAuthStorage();
        if (typeof window !== "undefined") {
            window.location.href = "/admin-login";
        }
    }

    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || response.statusText || `HTTP ${response.status}`);
    }

    return text ? JSON.parse(text) as T : (null as unknown as T);
}

function unwrapData<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
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

export async function getProjects() {
    return unwrapData<any>(await fetchJson(`/projects`)) as any;
}

export async function getProjectBySlug(slug: string) {
    return unwrapData<any>(await fetchJson(`/projects/${slug}`)) as any;
}

export async function getExperiences() {
    return unwrapData<any>(await fetchJson(`/experiences`)) as any;
}

export async function getSkills() {
    return unwrapData<any>(await fetchJson(`/skills`)) as any;
}

export async function getSettings() {
    return unwrapData<any>(await fetchJson(`/settings`)) as any;
}

export async function getGitHubActivity() {
    return unwrapData<GitHubActivityResponse>(await fetchJson(`/github-activity`));
}

export async function getInquiries() {
    return unwrapData<BackendInquiry[]>(await fetchJson(`/admin/inquiries`));
}

export async function createProject(project: any) {
    return unwrapData<any>(await fetchJson(`/admin/projects`, {
        method: "POST",
        body: JSON.stringify(project),
    }));
}

export async function createProjectFormData(form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/projects`, form, "POST"));
}

export async function updateProject(id: string | number, project: any) {
    return unwrapData<any>(await fetchJson(`/admin/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(project),
    }));
}

export async function updateProjectFormData(id: string | number, form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/projects/${id}`, form, "PUT"));
}

export async function deleteProject(id: string | number) {
    return await fetchJson(`/admin/projects/${id}`, {
        method: "DELETE",
    });
}

export async function createSkill(skill: any) {
    return unwrapData<any>(await fetchJson(`/admin/skills`, {
        method: "POST",
        body: JSON.stringify(skill),
    }));
}

export async function updateSkill(id: string | number, skill: any) {
    return unwrapData<any>(await fetchJson(`/admin/skills/${id}`, {
        method: "PUT",
        body: JSON.stringify(skill),
    }));
}

export async function deleteSkill(id: string | number) {
    return await fetchJson(`/admin/skills/${id}`, {
        method: "DELETE",
    });
}

export async function createExperience(experience: any) {
    return unwrapData<any>(await fetchJson(`/admin/experiences`, {
        method: "POST",
        body: JSON.stringify(experience),
    }));
}

export async function createExperienceFormData(form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/experiences`, form, "POST"));
}

export async function updateExperience(id: string | number, experience: any) {
    return unwrapData<any>(await fetchJson(`/admin/experiences/${id}`, {
        method: "PUT",
        body: JSON.stringify(experience),
    }));
}

export async function updateExperienceFormData(id: string | number, form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/experiences/${id}`, form, "PUT"));
}

export async function deleteExperience(id: string | number) {
    return await fetchJson(`/admin/experiences/${id}`, {
        method: "DELETE",
    });
}

export async function updateSettings(id: string | number, settings: any) {
    return unwrapData<any>(await fetchJson(`/admin/settings/${id}`, {
        method: "PUT",
        body: JSON.stringify(settings),
    }));
}

export async function updateSettingsFormData(id: string | number, form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/settings/${id}`, form, "PUT"));
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

export async function getActiveSessions() {
    return unwrapData<any>(await fetchJson(`/admin/sessions`));
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

export async function setInquiryRead(id: string | number, isRead: boolean) {
    return unwrapData<any>(await fetchJson(`/admin/inquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_read: isRead }),
    }));
}

export async function getAnalyticsOverview() {
    return unwrapData<any>(await fetchJson(`/admin/analytics/overview`));
}

export async function trackPageView(page: string, path: string) {
    return fetchJson(`/analytics/track`, {
        method: "POST",
        body: JSON.stringify({ page, path }),
    });
}

export async function setInquiryReplied(id: string | number, isReplied: boolean) {
    return unwrapData<any>(await fetchJson(`/admin/inquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_replied: isReplied }),
    }));
}

export async function sendReply(inquiryId: string | number, message: string) {
    return unwrapData<any>(await fetchJson(`/admin/inquiries/${inquiryId}/replies`, {
        method: "POST",
        body: JSON.stringify({ message }),
    }));
}

export async function deleteInquiry(id: string | number) {
    return await fetchJson(`/admin/inquiries/${id}`, {
        method: "DELETE",
    });
}

export async function postContact(payload: { name: string; email: string; subject: string; category: string; message: string }) {
    return fetchJson<any>(
        "/contact",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

// ── Certificates ────────────────────────────────────────────────────

export async function getCertificates() {
    return unwrapData<any>(await fetchJson(`/certificates`)) as any;
}

export async function getCertificate(id: string | number) {
    return unwrapData<any>(await fetchJson(`/certificates/${id}`)) as any;
}

export async function createCertificateFormData(form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/certificates`, form, "POST"));
}

export async function updateCertificateFormData(id: string | number, form: FormData) {
    return unwrapData<any>(await fetchForm(`/admin/certificates/${id}`, form, "PUT"));
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
    const response = await fetch(`${BACKEND_API_URL}/admin/backup/export`, {
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

export async function importBackup(file: File) {
    const formData = new FormData();
    formData.append('backup', file);

    const response = await fetch(`${BACKEND_API_URL}/admin/backup/import`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import backup");
    }

    return await response.json();
}
