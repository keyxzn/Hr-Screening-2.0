const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const u = localStorage.getItem("hr_user");
    if (!u) return "";
    const parsed = JSON.parse(u);
    return parsed.token ?? parsed.access_token ?? "";
  } catch { return ""; }
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (res.status === 401) {
    localStorage.removeItem("hr_user");
    window.location.href = "/login";
    throw new Error("Sesi berakhir, silakan login ulang.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

async function reqForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (res.status === 401) {
    localStorage.removeItem("hr_user");
    window.location.href = "/login";
    throw new Error("Sesi berakhir, silakan login ulang.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export interface CandidateCreate {
  full_name: string; email: string; phone?: string;
  linkedin_url?: string; instagram_url?: string;
  twitter_url?: string; facebook_url?: string;
  consent_given: boolean;
}
export interface Candidate {
  id: string; full_name: string; email: string; phone?: string;
  linkedin_url?: string; instagram_url?: string;
  twitter_url?: string; facebook_url?: string; created_at: string;
}
export interface ScreeningReport {
  id: string; candidate_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  overall_risk?: "low" | "medium" | "high" | "critical";
  risk_scores?: Record<string, number>;
  found_profiles?: Record<string, string>;
  flagged_content?: Array<{
    platform: string; content_snippet: string;
    category: string; severity: string; source_url?: string;
  }>;
  ai_summary?: string; error_message?: string;
  created_at: string; completed_at?: string;
  // Assessment fields
  assessment_status?: "appropriate" | "inappropriate";
  assessed_by?: string;
  assessed_by_name?: string;
  assessed_at?: string;
  assessment_locked?: boolean;  // ← NEW
}

export const api = {
  createCandidate: (data: CandidateCreate) =>
    req<Candidate>("/candidates/", { method: "POST", body: JSON.stringify(data) }),
  listCandidates: () => req<Candidate[]>("/candidates/"),
  getCandidate:   (id: string) => req<Candidate>(`/candidates/${id}`),
  deleteCandidate:(id: string) => req<{ message: string }>(`/candidates/${id}`, { method: "DELETE" }),
  getReport:      (candidateId: string) => req<ScreeningReport>(`/reports/${candidateId}`),
};

// ── Assessment ────────────────────────────────────────────
export interface AssessmentUpdate {
  assessment_status: "appropriate" | "inappropriate";
}
export const assessReport = (reportId: string, data: AssessmentUpdate) =>
  req<ScreeningReport>(`/reports/${reportId}/assess`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ── User Management ───────────────────────────────────────
export interface HRUser {
  id: string; email: string; full_name: string;
  role: string; is_active: boolean; created_at: string;
}
export interface UserCreate {
  email: string; full_name: string; password: string; role?: string;
}
export interface UserUpdate {
  full_name?: string; email?: string; password?: string;
  role?: string; is_active?: boolean;
}
export const userApi = {
  list:   ()                          => req<HRUser[]>("/users/"),
  create: (d: UserCreate)             => req<HRUser>("/users/", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: UserUpdate) => req<HRUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  delete: (id: string)                => req<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
};

// ── Blacklist ─────────────────────────────────────────────
export interface BlacklistResult {
  matched: number;
  not_found: string[];
}
export const uploadBlacklist = (file: File): Promise<BlacklistResult> => {
  const fd = new FormData();
  fd.append("file", file);
  return reqForm<BlacklistResult>("/candidates/blacklist/upload", fd);
};

// ── HR Settings ───────────────────────────────────────────
export interface HRSetting {
  key: string;
  value: string;
}
export const settingsApi = {
  getAll: () => req<HRSetting[]>("/candidates/settings/all"),
  update: (key: string, value: string) =>
    req<HRSetting>(`/candidates/settings/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    }),
};