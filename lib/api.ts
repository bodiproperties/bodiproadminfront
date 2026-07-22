// Set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:4000)

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

const TOKEN_KEY = "bp_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
export function isAuthed(): boolean {
  return Boolean(getToken());
}

async function request(path: string, options: RequestInit = {}, auth = false) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (res.status === 401) clearToken();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/* auth */
export async function login(email: string, password: string) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

/* projects */
export const getProjects = () => request("/api/projects");
export const createProject = (b: any) =>
  request("/api/projects", { method: "POST", body: JSON.stringify(b) }, true);
export const updateProject = (id: number, b: any) =>
  request(
    `/api/projects/${id}`,
    { method: "PUT", body: JSON.stringify(b) },
    true,
  );
export const deleteProject = (id: number) =>
  request(`/api/projects/${id}`, { method: "DELETE" }, true);

/* news (admin list includes drafts via token) */
/* news (admin list includes drafts via token) */
export async function getNewsAdmin(): Promise<NewsItem[]> {
  return request("/api/news", {}, true); // admin token optionalAuth-аар draft-ууд ч ирнэ
}

export async function createNews(payload: NewsPayload): Promise<NewsItem> {
  return request(
    "/api/news",
    { method: "POST", body: JSON.stringify(payload) },
    true,
  );
}

export async function updateNews(
  id: string,
  payload: Partial<NewsPayload>,
): Promise<NewsItem> {
  return request(
    `/api/news/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    true,
  );
}

export async function deleteNews(id: string): Promise<{ ok: true }> {
  return request(`/api/news/${id}`, { method: "DELETE" }, true);
}

// Soft delete-ийг сэргээх (backend restoreNews-тэй хослоно)
export async function restoreNews(id: string): Promise<NewsItem> {
  return request(`/api/news/${id}/restore`, { method: "POST" }, true);
}

/* home images */
export const getHomeImages = () => request("/api/home-images");
export const upsertHomeImage = (b: any) =>
  request(
    "/api/home-images",
    { method: "POST", body: JSON.stringify(b) },
    true,
  );
export const updateHomeImage = (id: number, b: any) =>
  request(
    `/api/home-images/${id}`,
    { method: "PUT", body: JSON.stringify(b) },
    true,
  );
export const deleteHomeImage = (id: number) =>
  request(`/api/home-images/${id}`, { method: "DELETE" }, true);

/* types */
export type Project = {
  id: number;
  title: string;
  type: string;
  location: string;
  year: string;
  image: string;
  gallery: string[];
  description: string;
  longDescription: string;
  detail: { client: string; area: string; status: string; services: string[] };
  sortOrder?: number;
};

export interface NewsItem {
  id: string;
  slug: string;
  title: { en: string; mn: string };
  desc: { en: string; mn: string };
  youtubeUrl: string;
  status: "draft" | "published" | "hidden";
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPayload {
  titleEn: string;
  titleMn: string;
  descEn?: string;
  descMn?: string;
  youtubeUrl?: string;
  status?: "draft" | "published" | "hidden";
  publishedAt?: string | null;
}

export type HomeImage = {
  id: number;
  key: string;
  label: string;
  url: string;
  sortOrder: number;
};

export async function setNewsStatus(
  id: string,
  status: "draft" | "published" | "hidden",
): Promise<NewsItem> {
  return request(
    `/api/news/${id}`,
    { method: "PUT", body: JSON.stringify({ status }) },
    true,
  );
}
