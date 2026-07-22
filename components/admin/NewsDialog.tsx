"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createNews,
  updateNews,
  type NewsItem,
  type NewsPayload,
} from "@/lib/api";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type {
  AIAction,
  AIAssistResult,
  TranslateResult,
  SummarizeResult,
  SeoResult,
  ImproveResult,
} from "@/types/ai-assist.types";
import ConfirmDialog from "@/app/admin/ConfirmDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: NewsItem | null;
  onSaved: () => void;
}

type Status = "draft" | "published" | "hidden";

const empty = {
  titleEn: "",
  titleMn: "",
  descEn: "",
  descMn: "",
  status: "draft" as Status,
  publishedAt: "",
};

const STATUS_OPTIONS: { value: Status; label: string; hint: string }[] = [
  { value: "draft", label: "Ноорог", hint: "Нийтэд харагдахгүй" },
  { value: "published", label: "Нийтлэх", hint: "Нийтэд ил" },
  { value: "hidden", label: "Нуусан", hint: "Түр буулгасан" },
];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const inputCls =
  "w-full border-0 border-b border-neutral-300 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-300 transition-colors focus:border-neutral-900 focus:outline-none";
const labelCls =
  "block text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2";

export default function NewsDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const [f, setF] = useState(empty);
  const [baseline, setBaseline] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<"en" | "mn">("mn");

  useEffect(() => {
    if (!open) return;

    if (initial) {
      const hasMn = !!(initial.title?.mn || initial.desc?.mn);
      const hasEn = !!(initial.title?.en || initial.desc?.en);
      if (hasMn && !hasEn) setLang("mn");
      else if (hasEn && !hasMn) setLang("en");
      else setLang("mn");
    } else {
      setLang("mn");
    }

    const next = initial
      ? {
          titleEn: initial.title?.en || "",
          titleMn: initial.title?.mn || "",
          descEn: initial.desc?.en || "",
          descMn: initial.desc?.mn || "",
          status: (initial.status as Status) || "draft",
          publishedAt: toLocalInput(initial.publishedAt),
        }
      : empty;

    setF(next);
    setBaseline(JSON.stringify(next)); // цэвэр эхлэлийг тэмдэглэнэ
  }, [open, initial]);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const isDirty = () => JSON.stringify(f) !== baseline;

  // X / Esc / backdrop / Болих бүгд эндээс дамжина
  const requestClose = () => {
    if (isDirty()) {
      setConfirmClose(true);
    } else {
      onOpenChange(false);
    }
  };

  // AI-ийн үр дүнг зохих state рүү оруулна
  function handleAIResult(action: AIAction, data: AIAssistResult): void {
    switch (action) {
      case "translate": {
        const r = data as TranslateResult;
        set("titleEn", r.title_en);
        set("descEn", r.content_en);
        setLang("en");
        toast.success("Англи орчуулга бэлэн боллоо");
        break;
      }
      case "improve": {
        const r = data as ImproveResult;
        if (lang === "mn") set("descMn", r.improved_content);
        else set("descEn", r.improved_content);
        toast.success("Найруулга сайжирлаа");
        break;
      }
      case "summarize": {
        const r = data as SummarizeResult;
        toast.success("Хураангуй үүслээ", {
          description: lang === "mn" ? r.summary_mn : r.summary_en,
        });
        break;
      }
      case "seo": {
        const r = data as SeoResult;
        toast.success("SEO meta үүслээ", {
          description: r.meta_title,
        });
        break;
      }
    }
  }

  const save = async () => {
    if (!f.titleEn.trim() && !f.titleMn.trim()) {
      toast.error("Дор хаяж нэг хэлээр гарчиг оруулна уу");
      return;
    }
    setSaving(true);

    const payload: NewsPayload = {
      titleEn: f.titleEn.trim(),
      titleMn: f.titleMn.trim(),
      descEn: f.descEn,
      descMn: f.descMn,
      status: f.status,
      publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
    };

    try {
      if (initial?.id) await updateNews(initial.id, payload);
      else await createNews(payload);
      toast.success(initial ? "Мэдээ шинэчлэгдлээ" : "Мэдээ үүсгэгдлээ");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) requestClose();
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none border-0 bg-white p-8 shadow-2xl sm:max-w-5xl sm:p-12">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#F58220]">
              Journal
            </p>
            <DialogTitle className="mt-3 text-3xl font-extralight tracking-tight text-neutral-900">
              {initial ? "Мэдээ засах" : "Шинэ мэдээ"}
            </DialogTitle>
            <p className="mt-2 text-sm text-neutral-500">
              Гарчиг болон агуулгыг хоёр хэл дээр бөглөнө.
            </p>
          </div>

          {/* Language tabs */}
          <div className="mt-10 flex gap-8 border-b border-neutral-200">
            {(["en", "mn"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`relative pb-3 text-xs uppercase tracking-[0.2em] transition-colors ${
                  lang === l
                    ? "text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-900"
                }`}
              >
                {l === "en" ? "English" : "Монгол"}
                {lang === l && (
                  <span className="absolute bottom-0 left-0 h-px w-full bg-[#F58220]" />
                )}
              </button>
            ))}
          </div>

          {/* EN */}
          <div className={lang === "en" ? "block pt-6" : "hidden"}>
            <div className="mb-6">
              <label className={labelCls}>Title (EN)</label>
              <input
                value={f.titleEn}
                onChange={(e) => set("titleEn", e.target.value)}
                className={inputCls}
              />
            </div>
            <label className={labelCls}>Description (EN)</label>
            <RichTextEditor
              value={f.descEn}
              onChange={(html) => set("descEn", html)}
            />
          </div>

          {/* MN */}
          <div className={lang === "mn" ? "block pt-6" : "hidden"}>
            <div className="mb-6">
              <label className={labelCls}>Гарчиг (MN)</label>
              <input
                value={f.titleMn}
                onChange={(e) => set("titleMn", e.target.value)}
                className={inputCls}
              />
            </div>
            <label className={labelCls}>Агуулга (MN)</label>
            <RichTextEditor
              value={f.descMn}
              onChange={(html) => set("descMn", html)}
            />
          </div>

          {/* Settings */}
          <div className="mt-10 grid gap-8 border-t border-neutral-200 pt-8 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Нийтлэх огноо</label>
              <input
                type="datetime-local"
                value={f.publishedAt}
                onChange={(e) => set("publishedAt", e.target.value)}
                className={inputCls}
              />
              <p className="mt-2 text-[11px] text-neutral-400">
                Ирээдүйн огноо бол тэр цагт автоматаар нийтлэгдэнэ.
              </p>
            </div>

            <div>
              <label className={labelCls}>Төлөв</label>
              <div className="flex overflow-hidden rounded-md border border-neutral-300">
                {STATUS_OPTIONS.map((opt, i) => {
                  const activeSel = f.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("status", opt.value)}
                      className={`flex-1 px-3 py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                        i > 0 ? "border-l border-neutral-300" : ""
                      } ${
                        activeSel
                          ? "bg-neutral-900 text-white"
                          : "bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">
                {STATUS_OPTIONS.find((o) => o.value === f.status)?.hint}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex justify-end gap-2 border-t border-neutral-200 pt-6">
            <button
              type="button"
              onClick={requestClose}
              className="px-6 py-3.5 text-[11px] uppercase tracking-[0.25em] text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-neutral-900 px-8 py-3.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Мэдээ хадгалагдаагүй"
        message="Бөглөсөн мэдээлэл хадгалагдаагүй байна. Хаавал бичсэн зүйл устах болно. Үнэхээр хаах уу?"
        confirmText="Тийм, хаах"
        cancelText="Үргэлжлүүлэх"
        danger
        onConfirm={() => onOpenChange(false)}
      />
    </>
  );
}
