// Set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:4000) — /api-гүй

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

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
export const getProjectsAdmin = () => request("/api/projects", {}, true);
export const getProject = (id: string) => request(`/api/projects/${id}`);
export const createProject = (b: ProjectPayload) =>
  request("/api/projects", { method: "POST", body: JSON.stringify(b) }, true);
export const updateProject = (id: string, b: Partial<ProjectPayload>) =>
  request(
    `/api/projects/${id}`,
    { method: "PUT", body: JSON.stringify(b) },
    true,
  );
export const deleteProject = (id: string) =>
  request(`/api/projects/${id}`, { method: "DELETE" }, true);
export const restoreProject = (id: string) =>
  request(`/api/projects/${id}/restore`, { method: "POST" }, true);

/* single image upload (cover / gallery items) */

/**
 * Upload хийхээс өмнө зургийг browser дээр шахна.
 * Утасны 4000px, 8MB зураг → 2400px, ~400KB JPEG.
 * Вэб дээр зураг хурдан ачаалагдаж, Azure storage хэмнэгдэнэ.
 */
async function compressForUpload(
  file: File,
  maxSize = 2400,
  quality = 0.85,
): Promise<Blob> {
  // GIF/SVG-г хөндөхгүй (animation, вектор алдагдана)
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#fff"; // PNG-ийн тунгалаг хэсэг хар болохгүй
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, "image/jpeg", quality),
  );
  // Шахсан нь том болчихвол эх файлаа үлдээнэ
  return blob && blob.size < file.size ? blob : file;
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await compressForUpload(file);
  const name =
    blob === file ? file.name : file.name.replace(/\.[^.]+$/, "") + ".jpg";

  const fd = new FormData();
  fd.append("file", blob, name);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error("Зураг upload хийхэд алдаа гарлаа");
  const data = await res.json();
  return data.url as string;
}

/* news (admin list includes drafts via token) */
export async function getNewsAdmin(): Promise<NewsItem[]> {
  return request("/api/news", {}, true); // admin token optionalAuth-аар draft-ууд ч ирнэ
}

export async function getNewsById(idOrSlug: string): Promise<NewsItem> {
  return request(`/api/news/${idOrSlug}`, {}, true);
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

// detail нь backend дээр jsonb — шинэ талбар нэмэхэд DB өөрчлөх шаардлагагүй
export type ProjectDetail = {
  client: string;
  area: string;
  status: string;
  services: string[];
  category?: string; // Interior | Apartment | Office | Garden | Construction
  gallery?: string[]; // зургийн URL-ууд
  lang?: "en" | "mn"; // web дээр аль хэлээр харагдах
};

export type Project = {
  id: string;
  title: string;
  type: string;
  location: string;
  year: string;
  image: string;
  description: { en: string; mn: string };
  detail: ProjectDetail;
  sortOrder?: number;
  status: "draft" | "published" | "hidden";
  publishedAt: string | null;
};

export interface ProjectPayload {
  title: string;
  type: string;
  location: string;
  year: string;
  image: string;
  descriptionEn?: string;
  descriptionMn?: string;
  detail?: ProjectDetail;
  sortOrder?: number;
  status?: "draft" | "published" | "hidden";
  publishedAt?: string | null;
}

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