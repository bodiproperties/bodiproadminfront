"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  createNews,
  updateNews,
  type NewsItem,
  type NewsPayload,
} from "@/lib/api";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

type FieldErrors = {
  title?: string;
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
const inputErrorCls =
  "w-full border-0 border-b-2 border-red-500 bg-red-50/40 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 transition-colors focus:border-red-600 focus:outline-none";
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
  const [errors, setErrors] = useState<FieldErrors>({});

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
    setBaseline(JSON.stringify(next));
    setErrors({});
  }, [open, initial]);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    // Гарчиг талбар дахин бичиж эхлэхэд алдааг шууд арилгана
    if ((k === "titleEn" || k === "titleMn") && errors.title) {
      setErrors((e) => ({ ...e, title: undefined }));
    }
  };

  const isDirty = () => JSON.stringify(f) !== baseline;

  const requestClose = () => {
    if (isDirty()) {
      setConfirmClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!f.titleEn.trim() && !f.titleMn.trim()) {
      next.title = "Дор хаяж нэг хэлээр гарчиг заавал бөглөнө үү";
    }
    return next;
  };

  const save = async () => {
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // Алдаатай хэлний tab руу шилжvvлж, юу дутуу байгааг шууд харуулна
      if (!f.titleMn.trim() && !f.titleEn.trim()) setLang("mn");
      toast.error(found.title || "Талбаруудыг шалгана уу");
      return;
    }

    setErrors({});
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
              Нийтлэл
            </p>
            <DialogTitle className="mt-3 text-3xl font-extralight tracking-tight text-neutral-900">
              {initial ? "Мэдээ засах" : "Шинэ мэдээ"}
            </DialogTitle>
            <p className="mt-2 text-sm text-neutral-500">
              Гарчиг болон агуулгыг сонгосон хэл дээр бөглөнө.
            </p>
          </div>

          {/* Ерөнхий алдааны мэдэгдэл — save дараад алдаатай бол дээд талд харагдана */}
          {errors.title && (
            <div className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.title}
            </div>
          )}

          {/* Language tabs */}
          <div className="mt-2 flex gap-8 border-b border-neutral-200">
            {(["en", "mn"] as const).map((l) => {
              const tabHasError =
                errors.title &&
                ((l === "en" && !f.titleEn.trim()) ||
                  (l === "mn" && !f.titleMn.trim()));
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`relative flex items-center gap-1.5 pb-3 text-xs uppercase tracking-[0.2em] transition-colors ${
                    lang === l
                      ? "text-neutral-900"
                      : "text-neutral-400 hover:text-neutral-900"
                  }`}
                >
                  {l === "en" ? "English" : "Монгол"}
                  {tabHasError && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                  {lang === l && (
                    <span
                      className={`absolute bottom-0 left-0 h-px w-full ${
                        tabHasError ? "bg-red-500" : "bg-[#F58220]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* EN */}
          <div className={lang === "en" ? "block pt-6" : "hidden"}>
            <div className="mb-6">
              <label className={labelCls}>
                Title (EN)
                {!f.titleMn.trim() && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>
              <input
                value={f.titleEn}
                onChange={(e) => set("titleEn", e.target.value)}
                className={errors.title ? inputErrorCls : inputCls}
                placeholder="News title in English"
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
              <label className={labelCls}>
                Гарчиг (MN)
                {!f.titleEn.trim() && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>
              <input
                value={f.titleMn}
                onChange={(e) => set("titleMn", e.target.value)}
                className={errors.title ? inputErrorCls : inputCls}
                placeholder="Мэдээний гарчиг"
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
                      className={`flex-1 px-3 py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors cursor-pointer ${
                        i > 0 ? "border-l border-neutral-300" : ""
                      } ${
                        activeSel
                          ? "bg-neutral-900 text-white"
                          : "bg-white text-neutral-500 hover:bg-[#F17B2C] hover:text-white"
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
              className="px-6 py-3.5 text-[11px] uppercase tracking-[0.25em] text-neutral-500 transition-colors hover:text-[#F17B2C] cursor-pointer"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-neutral-900 px-8 py-3.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#F17B2C] disabled:opacity-50 cursor-pointer"
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