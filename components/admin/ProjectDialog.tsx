"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  X,
  ImagePlus,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
type Lang = "mn" | "en";

const PUBLISH_OPTIONS: { value: PublishStatus; label: string; hint: string }[] =
  [
    { value: "draft", label: "Ноорог", hint: "Нийтэд харагдахгүй" },
    { value: "published", label: "Нийтлэх", hint: "Нийтэд ил" },
    { value: "hidden", label: "Идэвхгүй болгох", hint: "Түр буулгасан" },
  ];

// Web-ийн tab-уудтай яг ижил утгууд (value-г өөрчилж болохгүй)
const CATEGORY_OPTIONS = [
  { value: "", label: "Ангилалгүй" },
  { value: "Interior", label: "Дотор засал" },
  { value: "Apartment", label: "Орон сууц" },
  { value: "Office", label: "Оффис" },
  { value: "Garden", label: "Ландшафт" },
  { value: "Construction", label: "Барилга" },
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
  category: "",
  gallery: [] as string[],
  publishStatus: "draft" as PublishStatus,
  publishedAt: "",
};

type FieldErrors = {
  title?: string;
  type?: string;
  location?: string;
  year?: string;
  image?: string;
};

const inputCls =
  "w-full border-0 border-b border-neutral-300 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-300 transition-colors focus:border-neutral-900 focus:outline-none";
const inputErrorCls =
  "w-full border-0 border-b-2 border-red-500 bg-red-50/40 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 transition-colors focus:border-red-600 focus:outline-none";
const labelCls =
  "block text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2";
const errorTextCls = "mt-1.5 text-xs text-red-600";
const ghostBtnCls =
  "inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-neutral-600 transition-colors hover:border-[#F17B2C] hover:text-white hover:bg-[#F17B2C] disabled:opacity-50 cursor-pointer";

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
  const [lang, setLang] = useState<Lang>("mn");
  const [serviceInput, setServiceInput] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setServiceInput("");
    setErrors({});

    // Хэл: хадгалсан detail.lang → эс бол бөглөгдсөн тайлбараар → default MN
    if (initial) {
      const saved = initial.detail?.lang;
      const hasMn = !!initial.description?.mn;
      const hasEn = !!initial.description?.en;
      if (saved === "en" || saved === "mn") setLang(saved);
      else if (hasEn && !hasMn) setLang("en");
      else setLang("mn");
    } else {
      setLang("mn");
    }

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
          category: initial.detail?.category || "",
          gallery: initial.detail?.gallery || [],
          publishStatus: (initial.status as PublishStatus) || "draft",
          publishedAt: toLocalInput(initial.publishedAt),
        }
      : empty;

    setF(next);
    setBaseline(JSON.stringify({ ...next, lang: initial?.detail?.lang }));
  }, [open, initial]);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    if (k in errors && (errors as any)[k]) {
      setErrors((e) => ({ ...e, [k]: undefined }));
    }
  };

  const isDirty = () =>
    JSON.stringify({ ...f, lang: initial?.detail?.lang }) !== baseline ||
    (initial ? (initial.detail?.lang ?? lang) !== lang : false);

  const requestClose = () => {
    if (isDirty()) setConfirmClose(true);
    else onOpenChange(false);
  };

  // ---------- Cover ----------
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

  // ---------- Gallery ----------
  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setGalleryUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await uploadImage(file);
        setF((p) => ({ ...p, gallery: [...p.gallery, url] }));
      } catch (e: any) {
        toast.error(e.message || `${file.name} upload хийхэд алдаа гарлаа`);
      } finally {
        setGalleryUploading((n) => n - 1);
      }
    }
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGallery = (i: number) =>
    set(
      "gallery",
      f.gallery.filter((_, idx) => idx !== i),
    );

  const moveGallery = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= f.gallery.length) return;
    const next = [...f.gallery];
    [next[i], next[j]] = [next[j], next[i]];
    set("gallery", next);
  };

  // ---------- Services ----------
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

  // ---------- Save ----------
  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!f.title.trim()) next.title = "Гарчиг заавал бөглөнө үү";
    if (!f.type.trim()) next.type = "Төрөл заавал бөглөнө үү";
    if (!f.location.trim()) next.location = "Байршил заавал бөглөнө үү";
    if (!f.year.trim()) next.year = "Он заавал бөглөнө үү";
    if (!f.image) next.image = "Нүүр зураг upload хийнэ үү";
    return next;
  };

  const save = async () => {
    if (coverUploading || galleryUploading > 0) {
      toast.error("Зураг upload хийгдэж дуусахыг хүлээнэ үү");
      return;
    }

    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      toast.error(Object.values(found)[0] || "Талбаруудыг шалгана уу");
      return;
    }

    setErrors({});
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
        category: f.category,
        gallery: f.gallery,
        // Web дээр зөвхөн энэ хэлээр сонгосон үед харагдана
        lang,
      },
      status: f.publishStatus,
      publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
    };

    try {
      if (initial?.id) await updateProject(initial.id, payload);
      else await createProject(payload);
      toast.success(initial ? "Төсөл шинэчлэгдлээ" : "Төсөл үүсгэгдлээ");
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
              Төсөл
            </p>
            <DialogTitle className="mt-3 text-3xl font-extralight tracking-tight text-neutral-900">
              {initial ? "Төслийн мэдээллийг засах" : "Шинэ төсөл"}
            </DialogTitle>
          </div>

          {/* Ерөнхий алдааны мэдэгдэл */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Доор улаанаар тэмдэглэгдсэн талбаруудыг бөглөнө үү
            </div>
          )}

          {/* Хэл сонгох */}
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
                  className={`flex-1 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors cursor-pointer ${
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
            <p className="mt-2 text-[11px] text-neutral-400">
              Энэ төсөл вэб дээр зөвхөн{" "}
              <span className="font-medium text-neutral-600">
                {lang === "mn" ? "MN" : "EN"}
              </span>{" "}
              хэл сонгосон үед харагдана. Нөгөө хэлээр харуулах бол тусад нь
              шинэ төсөл үүсгэнэ үү.
            </p>
          </div>

          {/* Basic fields */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Гарчиг
                {!f.title.trim() && <span className="ml-1 text-red-500">*</span>}
              </label>
              <input
                value={f.title}
                onChange={(e) => set("title", e.target.value)}
                className={errors.title ? inputErrorCls : inputCls}
              />
              {errors.title && <p className={errorTextCls}>{errors.title}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Төрөл (Type)
                {!f.type.trim() && <span className="ml-1 text-red-500">*</span>}
              </label>
              <input
                value={f.type}
                onChange={(e) => set("type", e.target.value)}
                className={errors.type ? inputErrorCls : inputCls}
                placeholder="Residential / Commercial..."
              />
              {errors.type && <p className={errorTextCls}>{errors.type}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Байршил
                {!f.location.trim() && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>
              <input
                value={f.location}
                onChange={(e) => set("location", e.target.value)}
                className={errors.location ? inputErrorCls : inputCls}
              />
              {errors.location && (
                <p className={errorTextCls}>{errors.location}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Он
                {!f.year.trim() && <span className="ml-1 text-red-500">*</span>}
              </label>
              <input
                value={f.year}
                onChange={(e) => set("year", e.target.value)}
                className={errors.year ? inputErrorCls : inputCls}
                placeholder="2026"
              />
              {errors.year && <p className={errorTextCls}>{errors.year}</p>}
            </div>
            <div>
              <label className={labelCls}>Ангилал (вэбийн tab)</label>
              <select
                value={f.category}
                onChange={(e) => set("category", e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover image */}
          <div className="mt-8">
            <label className={labelCls}>
              Нүүр зураг
              {!f.image && <span className="ml-1 text-red-500">*</span>}
            </label>
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
                    aria-label="Нүүр зураг устгах"
                    className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  className={`flex h-24 w-36 items-center justify-center rounded-md border border-dashed text-neutral-300 ${
                    errors.image
                      ? "border-red-400 bg-red-50/40"
                      : "border-neutral-300"
                  }`}
                >
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
              <button
                type="button"
                disabled={coverUploading}
                onClick={() => coverInputRef.current?.click()}
                className={ghostBtnCls}
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
            {errors.image && <p className={errorTextCls}>{errors.image}</p>}
          </div>

          {/* Gallery */}
          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <label className={`${labelCls} mb-1`}>Gallery зургууд</label>
                <p className="text-[11px] text-neutral-400">
                  Төслийн дэлгэрэнгүй хуудсанд нүүр зургийн дараа харагдана.
                  Сумаар дарааллыг өөрчилнө.
                </p>
              </div>
              <button
                type="button"
                disabled={galleryUploading > 0}
                onClick={() => galleryInputRef.current?.click()}
                className={`${ghostBtnCls} shrink-0`}
              >
                {galleryUploading > 0 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {galleryUploading > 0
                  ? `Upload (${galleryUploading})`
                  : "Зураг нэмэх"}
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleGalleryUpload(e.target.files)}
              />
            </div>

            {f.gallery.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-neutral-300 text-[11px] uppercase tracking-[0.2em] text-neutral-300">
                Gallery хоосон
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {f.gallery.map((url, i) => (
                  <div
                    key={url}
                    className="group relative aspect-[4/3] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGallery(i)}
                      aria-label="Зураг устгах"
                      className="absolute right-1.5 top-1.5 cursor-pointer rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveGallery(i, -1)}
                        disabled={i === 0}
                        aria-label="Өмнө нь"
                        className="cursor-pointer rounded bg-black/60 p-1 text-white hover:bg-neutral-900 disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGallery(i, 1)}
                        disabled={i === f.gallery.length - 1}
                        aria-label="Дараа нь"
                        className="cursor-pointer rounded bg-black/60 p-1 text-white hover:bg-neutral-900 disabled:opacity-30"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description — хоёр editor-ыг хамт mount хийж, CSS-ээр л нуух/харуулах */}
          <div className="mt-8 border-t border-neutral-200 pt-8">
            <div className={lang === "mn" ? "block" : "hidden"}>
              <label className={labelCls}>Тайлбар (Монгол)</label>
              <RichTextEditor
                value={f.descriptionMn}
                onChange={(html) => set("descriptionMn", html)}
              />
            </div>
            <div className={lang === "en" ? "block" : "hidden"}>
              <label className={labelCls}>Тайлбар (English)</label>
              <RichTextEditor
                value={f.descriptionEn}
                onChange={(html) => set("descriptionEn", html)}
              />
            </div>
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
                placeholder={lang === "mn" ? "Дууссан / Баригдаж байгаа" : "Completed / In progress"}
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
                    aria-label={`${s} устгах`}
                    className="cursor-pointer text-neutral-400 hover:text-red-600"
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
                placeholder={
                  lang === "mn"
                    ? "Жишээ: Архитектур, Дотор засал..."
                    : "e.g. Architecture, Interior Design..."
                }
                className={inputCls}
              />
              <button
                type="button"
                onClick={addService}
                className="shrink-0 cursor-pointer border border-neutral-300 px-4 text-[11px] uppercase tracking-[0.2em] text-neutral-600 transition-colors hover:border-[#F17B2C] hover:bg-[#F17B2C] hover:text-white"
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
                      className={`flex-1 cursor-pointer px-3 py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                        i > 0 ? "border-l border-neutral-300" : ""
                      } ${
                        active
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
                {PUBLISH_OPTIONS.find((o) => o.value === f.publishStatus)?.hint}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex justify-end gap-2 border-t border-neutral-200 pt-6">
            <button
              type="button"
              onClick={requestClose}
              className="cursor-pointer px-6 py-3.5 text-[11px] uppercase tracking-[0.25em] text-neutral-500 transition-colors hover:text-[#F17B2C]"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || coverUploading || galleryUploading > 0}
              className="cursor-pointer bg-neutral-900 px-8 py-3.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#F17B2C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Төсөл хадгалагдаагүй"
        message="Бөглөсөн мэдээлэл хадгалагдаагүй байна. Хаавал бичсэн зүйл устах болно. Үнэхээр хаах уу?"
        confirmText="Тийм, хаах"
        cancelText="Үргэлжлүүлэх"
        danger
        onConfirm={() => onOpenChange(false)}
      />
    </>
  );
}