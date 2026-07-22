"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/aiChat";
import type { ChatMessage } from "@/types/ai-chat.types";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(): Promise<void> {
    const text = input.trim();
    if (!text || loading) return;

    // Чухал: бүх түүхийг (өмнөх messages + шинэ) илгээнэ — context window логик
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const result = await sendChatMessage(newMessages);

    if (!result.success || !result.reply) {
      setError(result.error ?? "Алдаа гарлаа");
      setLoading(false);
      return;
    }

    setMessages([...newMessages, { role: "assistant", content: result.reply }]);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Нээх товч — доод баруун буланд floating */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-neutral-900 px-5 py-3 text-sm text-white shadow-lg transition-colors hover:bg-neutral-800"
        >
          💬 AI Chat
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[380px] flex-col rounded-lg border border-neutral-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <p className="text-sm font-medium text-neutral-900">AI Туслах</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-neutral-400 hover:text-neutral-900"
            >
              ✕
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-xs text-neutral-400">
                Асуулт бичээд эхлүүлээрэй...
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
                Бичиж байна...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="border-t border-red-100 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-neutral-200 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Асуулт бичих..."
              rows={1}
              className="flex-1 resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              Илгээх
            </button>
          </div>
        </div>
      )}
    </>
  );
}