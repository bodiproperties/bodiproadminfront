"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, ImagePlus, Loader2 } from "lucide-react";
import {
  createProject,
  updateProject,
  uploadImage,
  type Project,
  type ProjectPayload,
} from "@/lib/api";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/app/admin/ConfirmDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Project | null;
  onSaved: () => void;
}

type PublishStatus = "draft" | "published" | "hidden";

const PUBLISH_OPTIONS: { value: PublishStatus; label: string; hint: string }[] =
  [
    { value: "draft", label: "Ноорог", hint: "Нийтэд харагдахгүй" },
    { value: "published", label: "Нийтлэх", hint: "Нийтэд ил" },
    { value: "hidden", label: "Идэвхгүй болгох", hint: "Түр буулгасан" },
  ];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const empty = {
  title: "",
  type: "",
  location: "",
  year: "",
  image: "",
  descriptionEn: "",
  descriptionMn: "",
  client: "",
  area: "",
  status: "",
  services: [] as string[],
  publishStatus: "draft" as PublishStatus,
  publishedAt: "",
};

const inputCls =
  "w-full border-0 border-b border-neutral-300 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-300 transition-colors focus:border-neutral-900 focus:outline-none";
const labelCls =
  "block text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2";

export default function ProjectDialog({
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
  const [serviceInput, setServiceInput] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLang("mn");
    setServiceInput("");

    const next = initial
      ? {
          title: initial.title || "",
          type: initial.type || "",
          location: initial.location || "",
          year: initial.year || "",
          image: initial.image || "",
          descriptionEn: initial.description?.en || "",
          descriptionMn: initial.description?.mn || "",
          client: initial.detail?.client || "",
          area: initial.detail?.area || "",
          status: initial.detail?.status || "",
          services: initial.detail?.services || [],
          publishStatus: (initial.status as PublishStatus) || "draft",
          publishedAt: toLocalInput(initial.publishedAt),
        }
      : empty;

    setF(next);
    setBaseline(JSON.stringify(next));
  }, [open, initial]);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const isDirty = () => JSON.stringify(f) !== baseline;

  const requestClose = () => {
    if (isDirty()) setConfirmClose(true);
    else onOpenChange(false);
  };

  const handleCoverUpload = async (file?: File) => {
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      set("image", url);
    } catch (e: any) {
      toast.error(e.message || "Cover зураг upload хийхэд алдаа гарлаа");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const addService = () => {
    const v = serviceInput.trim();
    if (!v) return;
    if (!f.services.includes(v)) set("services", [...f.services, v]);
    setServiceInput("");
  };
  const removeService = (v: string) =>
    set(
      "services",
      f.services.filter((s) => s !== v),
    );

  const save = async () => {
    if (!f.title.trim()) {
      toast.error("Гарчиг оруулна уу");
      return;
    }
    if (!f.type.trim() || !f.location.trim() || !f.year.trim()) {
      toast.error("Type, байршил, он бөглөнө үү");
      return;
    }
    if (!f.image) {
      toast.error("Нүүр зураг upload хийнэ үү");
      return;
    }

    setSaving(true);
    const payload: ProjectPayload = {
      title: f.title.trim(),
      type: f.type.trim(),
      location: f.location.trim(),
      year: f.year.trim(),
      image: f.image,
      descriptionEn: f.descriptionEn,
      descriptionMn: f.descriptionMn,
      detail: {
        client: f.client.trim(),
        area: f.area.trim(),
        status: f.status.trim(),
        services: f.services,
      },
      status: f.publishStatus,
      publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
    };

    try {
      if (initial?.id) await updateProject(initial.id, payload);
      else await createProject(payload);
      toast.success(initial ? "Project шинэчлэгдлээ" : "Project үүсгэгдлээ");
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
      <Dialog open={open} onOpenChange={(v) => !v && requestClose()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none border-0 bg-white p-8 shadow-2xl sm:max-w-5xl sm:p-12">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#F58220]">
              Projects
            </p>
            <DialogTitle className="mt-3 text-3xl font-extralight tracking-tight text-neutral-900">
              {initial ? "Project засах" : "Шинэ project"}
            </DialogTitle>
          </div>

          {/* Хэл сонгох — хамгийн эхэнд */}
          <div className="mb-2">
            <label className={labelCls}>
              Ямар хэл дээр мэдээлэл оруулах вэ?
            </label>
            <div className="flex overflow-hidden rounded-md border border-neutral-300 sm:w-64">
              {(["mn", "en"] as const).map((l, i) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`flex-1 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                    i > 0 ? "border-l border-neutral-300" : ""
                  } ${
                    lang === l
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  {l === "mn" ? "Монгол" : "English"}
                </button>
              ))}
            </div>
          </div>

          {/* Basic fields */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Гарчиг</label>
              <input
                value={f.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Төрөл (Type)</label>
              <input
                value={f.type}
                onChange={(e) => set("type", e.target.value)}
                className={inputCls}
                placeholder="Residential / Commercial..."
              />
            </div>
            <div>
              <label className={labelCls}>Байршил</label>
              <input
                value={f.location}
                onChange={(e) => set("location", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Он</label>
              <input
                value={f.year}
                onChange={(e) => set("year", e.target.value)}
                className={inputCls}
                placeholder="2026"
              />
            </div>
          </div>

          {/* Cover image */}
          <div className="mt-8">
            <label className={labelCls}>Нүүр зураг</label>
            <div className="flex items-center gap-4">
              {f.image ? (
                <div className="relative h-24 w-36 overflow-hidden rounded-md border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => set("image", "")}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-36 items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-300">
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
              <button
                type="button"
                disabled={coverUploading}
                onClick={() => coverInputRef.current?.click()}
                className="inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
              >
                {coverUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {f.image ? "Солих" : "Upload"}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCoverUpload(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Description — сонгосон хэлээр */}
          <div className="mt-8 border-t border-neutral-200 pt-8">
            <label className={labelCls}>
              Тайлбар ({lang === "mn" ? "Монгол" : "English"})
            </label>
            {lang === "mn" ? (
              <RichTextEditor
                value={f.descriptionMn}
                onChange={(html) => set("descriptionMn", html)}
              />
            ) : (
              <RichTextEditor
                value={f.descriptionEn}
                onChange={(html) => set("descriptionEn", html)}
              />
            )}
          </div>

          {/* Detail block */}
          <div className="mt-10 grid gap-6 border-t border-neutral-200 pt-8 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Захиалагч (Client)</label>
              <input
                value={f.client}
                onChange={(e) => set("client", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Талбай (Area)</label>
              <input
                value={f.area}
                onChange={(e) => set("area", e.target.value)}
                className={inputCls}
                placeholder="1,200 m²"
              />
            </div>
            <div>
              <label className={labelCls}>Төлөв (Status)</label>
              <input
                value={f.status}
                onChange={(e) => set("status", e.target.value)}
                className={inputCls}
                placeholder="Дуусгасан / Барилгалж байгаа"
              />
            </div>
          </div>

          {/* Services tags */}
          <div className="mt-8">
            <label className={labelCls}>Үйлчилгээ (Services)</label>
            <div className="mb-3 flex flex-wrap gap-2">
              {f.services.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeService(s)}
                    className="text-neutral-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addService();
                  }
                }}
                placeholder="Жишээ: Architecture, Interior Design..."
                className={inputCls}
              />
              <button
                type="button"
                onClick={addService}
                className="shrink-0 border border-neutral-300 px-4 text-[11px] uppercase tracking-[0.2em] text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                Нэмэх
              </button>
            </div>
          </div>

          {/* Publish settings */}
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
                {PUBLISH_OPTIONS.map((opt, i) => {
                  const active = f.publishStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("publishStatus", opt.value)}
                      className={`flex-1 px-3 py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                        i > 0 ? "border-l border-neutral-300" : ""
                      } ${
                        active
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
                {PUBLISH_OPTIONS.find((o) => o.value === f.publishStatus)?.hint}
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
        title="Project хадгалагдаагүй"
        message="Бөглөсөн мэдээлэл хадгалагдаагүй байна. Хаавал бичсэн зүйл устах болно. Үнэхээр хаах уу?"
        confirmText="Тийм, хаах"
        cancelText="Үргэлжлүүлэх"
        danger
        onConfirm={() => onOpenChange(false)}
      />
    </>
  );
}
