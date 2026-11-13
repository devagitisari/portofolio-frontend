/**
 * Shapes returned by the portfolio API.
 *
 * They mirror the Laravel resources the frontend used before, so both the
 * legacy PHP backend and the Next.js route handlers stay compatible.
 */

export interface ApiProjectImage {
    id?: number | string;
    image: string | null;
    created_at?: string | null;
}

export interface ApiProject {
    id: number | string;
    title: string;
    slug?: string | null;
    description: string;
    longDescription?: string | null;
    projectRole?: string | null;
    problem?: string | null;
    solution?: string | null;
    keyFeatures?: string[] | null;
    impact?: string | null;
    category?: string | null;
    status?: string | null;
    image?: string | null;
    skillIds?: string[];
    skillNames?: string[];
    demoUrl?: string | null;
    githubUrl?: string | null;
    featured?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    images?: ApiProjectImage[];
    created_at?: string | null;
    updated_at?: string | null;

    // The admin panel also reads the snake_case aliases of the raw model.
    long_description?: string | null;
    project_role?: string | null;
    key_features?: string[] | null;
    github_url?: string | null;
    demo_url?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    thumbnail?: string | null;
}

export interface ApiSkill {
    id: number | string;
    name: string;
    category: string;
    percentage: number;
    calculated_percentage?: number | null;
    project_count?: number | null;
    show_on_home?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ApiExperience {
    id: number | string;
    company: string;
    position: string;
    description: string;
    start_date?: string | null;
    end_date?: string | null;
    is_current?: boolean;
    certificate?: string | null;
    deleted_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ApiCertificate {
    id: number | string;
    title: string;
    issuer: string;
    description?: string | null;
    date?: string | null;
    expires_date?: string | null;
    credential_url?: string | null;
    image?: string | null;
    created_at?: string | null;
    updated_at?: string | null;

    // Aliases used by the public certificate page.
    date_issue?: string | null;
    expiresDate?: string | null;
    credentialUrl?: string | null;
}

export interface ApiSettings {
    id?: number | string | null;
    name?: string | null;
    title?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    github?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    bio?: string | null;
    aboutMe?: string | null;
    gpa?: string | null;
    completedProjects?: number | null;
    techStackCount?: number | null;
    autoUpdateSkillBadges?: boolean | null;
    showLearningCurve?: boolean | null;
    showGitHubActivity?: boolean | null;
    profileImage?: string | null;
    resumeUrl?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;

    // The admin panel also reads the snake_case aliases of the raw model.
    site_name?: string | null;
    tagline?: string | null;
    about_me?: string | null;
    completed_projects?: number | null;
    tech_stack_count?: number | null;
    auto_update_skill_badges?: boolean | null;
    show_learning_curve?: boolean | null;
    show_github_activity?: boolean | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
}

export interface ApiReply {
    id: number | string;
    inquiry_id: number | string;
    message: string;
    sent_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ApiSession {
    id: number | string;
    device_type: string;
    ip_address: string;
    last_used_at: string | null;
    created_at: string | null;
}

export interface ApiSessionsResponse {
    currentTokenId: number | string | null;
    sessions: ApiSession[];
    twoFactorEnabled: boolean;
}

export interface ApiAnalyticsOverview {
    uniqueVisitors: number;
    totalPageViews: number;
    pageViewsLast7Days: number;
    pageViewsLast30Days: number;
    topPages: Array<{ page: string | null; views: number }>;
    dailyViews: Array<{ date: string; views: number }>;
}

export interface ApiContactResult {
    message: string;
    data?: {
        id?: number | string;
        name?: string;
        email?: string;
        subject?: string;
        category?: string;
        message?: string;
        created_at?: string | null;
    };
}
