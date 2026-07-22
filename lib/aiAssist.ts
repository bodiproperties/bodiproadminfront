import type { AIAction, AIAssistResponse } from "@/types/ai-assist.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function callAIAssist(
  action: AIAction,
  title: string,
  content: string,
): Promise<AIAssistResponse> {
  const token =
  typeof window !== "undefined"
    ? localStorage.getItem("bp_admin_token")
    : null;

  if (!token) {
    return { success: false, error: "Нэвтрэх шаардлагатай" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/news/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, title, content }),
    });

    const json: AIAssistResponse = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error ?? `Алдаа: ${res.status}` };
    }

    return json;
  } catch {
    return { success: false, error: "Сервертэй холбогдож чадсангүй" };
  }
}