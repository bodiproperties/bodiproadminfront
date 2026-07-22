// app/admin/news/[id]/edit/page.tsx (хэсэгчилсэн)
"use client";

import { useState } from "react";
import { useEditor } from "@tiptap/react";
import type {
  AIAction,
  AIAssistResult,
  TranslateResult,
  SummarizeResult,
  SeoResult,
  ImproveResult,
} from "@/types/ai-assist.types";

export default function NewsEditPage() {
  const [titleMn, setTitleMn] = useState<string>("");
  const [titleEn, setTitleEn] = useState<string>("");
  const [summaryMn, setSummaryMn] = useState<string>("");
  const [summaryEn, setSummaryEn] = useState<string>("");
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");

  const editorMn = useEditor({ /* таны одоогийн Tiptap config */ });
  const editorEn = useEditor({ /* EN editor instance */ });

  function handleAIResult(action: AIAction, data: AIAssistResult): void {
    switch (action) {
      case "translate": {
        const r = data as TranslateResult;
        setTitleEn(r.title_en);
        editorEn?.commands.setContent(r.content_en);
        break;
      }
      case "improve": {
        const r = data as ImproveResult;
        editorMn?.commands.setContent(r.improved_content);
        break;
      }
      case "summarize": {
        const r = data as SummarizeResult;
        setSummaryMn(r.summary_mn);
        setSummaryEn(r.summary_en);
        break;
      }
      case "seo": {
        const r = data as SeoResult;
        setMetaTitle(r.meta_title);
        setMetaDescription(r.meta_description);
        break;
      }
    }
  }
}