"use client";

import { useState } from "react";
import { callAIAssist } from "@/lib/aiAssist";
import type { AIAction, AIAssistResult } from "@/types/ai-assist.types";

interface AIAssistPanelProps {
  title: string;
  content: string;
  onApply: (action: AIAction, data: AIAssistResult) => void;
  hideTranslate?: boolean;
}

interface ActionConfig {
  key: AIAction;
  label: string;
}

const ALL_ACTIONS: ActionConfig[] = [
  { key: "translate", label: "🌐 EN орчуулга" },
  { key: "improve", label: "✏️ Найруулга сайжруулах" },
  { key: "summarize", label: "📝 Хураангуй" },
  { key: "seo", label: "🔍 SEO meta" },
];

export default function AIAssistPanel({
  title,
  content,
  onApply,
  hideTranslate,
}: AIAssistPanelProps) {
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = hideTranslate
    ? ALL_ACTIONS.filter((a) => a.key !== "translate")
    : ALL_ACTIONS;

  async function runAction(action: AIAction): Promise<void> {
    const plainText = content.replace(/<[^>]*>/g, "").trim();

    if (plainText.length < 10) {
      setError("Эхлээд контент бичнэ үү (доод тал нь 10 тэмдэгт)");
      return;
    }

    setLoading(action);
    setError(null);

    const result = await callAIAssist(action, title, content);

    if (!result.success || !result.data) {
      setError(result.error ?? "Тодорхойгүй алдаа гарлаа");
      setLoading(null);
      return;
    }

    onApply(action, result.data);
    setLoading(null);
  }

  return (
    <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-neutral-400">
        AI Туслах
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => runAction(a.key)}
            disabled={loading !== null}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
          >
            {loading === a.key ? "Уншиж байна…" : a.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}