import type { ChatMessage, ChatResponse } from "@/types/ai-chat.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("bp_admin_token") : null;

  if (!token) {
    return { success: false, error: "Нэвтрэх шаардлагатай" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });

    const json: ChatResponse = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error ?? `Алдаа: ${res.status}` };
    }

    return json;
  } catch {
    return { success: false, error: "Сервертэй холбогдож чадсангүй" };
  }
}