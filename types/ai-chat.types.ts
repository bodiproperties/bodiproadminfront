export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}