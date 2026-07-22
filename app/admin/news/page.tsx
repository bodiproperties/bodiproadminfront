"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageOff, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  getNewsAdmin,
  deleteNews,
  setNewsStatus,
  type NewsItem,
} from "@/lib/api";
import NewsDialog from "@/components/admin/NewsDialog";
import ConfirmDialog from "../ConfirmDialog";

type Status = "draft" | "published" | "hidden";

// desc HTML доторх эхний зураг
function firstImage(html: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
// desc HTML доторх эхний YouTube thumbnail (зураг байхгүй үед)
function firstYoutubeThumb(html: string): string | null {
  if (!html) return null;
  const m = html.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|v=|shorts\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}
function thumbFor(n: NewsItem): string | null {
  const en = n.desc?.en || "";
  const mn = n.desc?.mn || "";
  return (
    firstImage(mn) ||
    firstImage(en) ||
    firstYoutubeThumb(mn) ||
    firstYoutubeThumb(en)
  );
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-CA") : "—";

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NewsItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getNewsAdmin());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Устгах товч → баталгаажуулах modal нээнэ
  const askRemove = (n: NewsItem) => setConfirmDelete(n);

  // Modal баталгаажуулбал бодит устгал
  const doRemove = async (n: NewsItem) => {
    try {
      await deleteNews(n.id);
      toast.success("Мэдээ устгагдлаа");
      load();
    } catch (e: any) {
      toast.error(e.message || "Устгахад алдаа гарлаа");
    }
  };

  // Идэвхтэй (published) ⇄ идэвхгүй (hidden) шууд сэлгэнэ (optimistic)
  const toggleActive = async (n: NewsItem) => {
    const next: Status = n.status === "published" ? "hidden" : "published";
    setBusyId(n.id);
    const prev = items;
    setItems((list) =>
      list.map((it) => (it.id === n.id ? { ...it, status: next } : it)),
    );
    try {
      const updated = await setNewsStatus(n.id, next);
      setItems((list) => list.map((it) => (it.id === n.id ? updated : it)));
      toast.success(
        next === "published" ? "Идэвхтэй боллоо" : "Идэвхгүй боллоо",
      );
    } catch (e: any) {
      setItems(prev);
      toast.error(e.message || "Төлөв солиход алдаа гарлаа");
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();

  const statusMeta = (n: NewsItem) => {
    if (n.status === "draft") return { label: "Ноорог", dot: "bg-neutral-300" };
    if (n.status === "hidden")
      return { label: "Нуусан", dot: "bg-neutral-900" };
    const scheduled = n.publishedAt && new Date(n.publishedAt).getTime() > now;
    return scheduled
      ? { label: "Хуваарьт", dot: "bg-amber-400" }
      : { label: "Нийтэлсэн", dot: "bg-[#F58220]" };
  };

  const langBadges = (n: NewsItem) => ({
    hasEn: !!(n.title?.en || n.desc?.en),
    hasMn: !!(n.title?.mn || n.desc?.mn),
  });

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            Manage
          </p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-neutral-900">
            News
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex cursor-pointer items-center gap-2 bg-neutral-900 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> Шинэ мэдээ
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/60">
              <th className="w-24 px-5 py-3.5"></th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Гарчиг
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Хэл
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Төлөв
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Огноо
              </th>
              <th className="w-32 px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-neutral-400"
                >
                  Ачааллаж байна…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-neutral-400"
                >
                  Мэдээ алга. Эхний мэдээгээ бичнэ үү.
                </td>
              </tr>
            ) : (
              items.map((n) => {
                const thumb = thumbFor(n);
                const meta = statusMeta(n);
                const { hasEn, hasMn } = langBadges(n);
                return (
                  <tr
                    key={n.id}
                    className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
                  >
                    {/* Thumbnail — эхний зураг */}
                    <td className="px-5 py-3">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-11 w-16 rounded-sm bg-neutral-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-16 items-center justify-center rounded-sm bg-neutral-100 text-neutral-300">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </td>

                    {/* Гарчиг */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">
                        {n.title?.mn || n.title?.en || "—"}
                      </p>
                      {n.title?.mn && n.title?.en && (
                        <p className="text-xs text-neutral-400">{n.title.en}</p>
                      )}
                    </td>

                    {/* Хэл */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${
                            hasMn
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-100 text-neutral-300"
                          }`}
                        >
                          MN
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${
                            hasEn
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-100 text-neutral-300"
                          }`}
                        >
                          EN
                        </span>
                      </div>
                    </td>

                    {/* Төлөв */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                        />
                        {meta.label}
                      </span>
                    </td>

                    {/* Огноо */}
                    <td className="px-4 py-3 text-neutral-500">
                      {fmtDate(n.publishedAt)}
                    </td>

                    {/* Үйлдэл */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Идэвхтэй/идэвхгүй toggle */}
                        <button
                          onClick={() => toggleActive(n)}
                          disabled={busyId === n.id || n.status === "draft"}
                          aria-label={
                            n.status === "published"
                              ? "Идэвхгүй болгох"
                              : "Идэвхтэй болгох"
                          }
                          title={
                            n.status === "draft"
                              ? "Ноорог — эхлээд нийтэлнэ үү"
                              : n.status === "published"
                                ? "Идэвхтэй (дарж нуух)"
                                : "Идэвхгүй (дарж идэвхжүүлэх)"
                          }
                          className="cursor-pointer p-2 text-neutral-400 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {n.status === "published" ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setEditing(n);
                            setOpen(true);
                          }}
                          aria-label="Засах"
                          className="cursor-pointer p-2 text-neutral-400 transition-colors hover:text-neutral-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => askRemove(n)}
                          aria-label="Устгах"
                          className="cursor-pointer p-2 text-neutral-400 transition-colors hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <NewsDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title="Мэдээ устгах"
        message={`"${
          confirmDelete?.title?.mn || confirmDelete?.title?.en || "—"
        }" мэдээг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`}
        confirmText="Устгах"
        danger
        onConfirm={() => {
          if (confirmDelete) doRemove(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
