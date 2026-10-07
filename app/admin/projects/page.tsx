"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  getProjectsAdmin,
  deleteProject,
  updateProject,
  type Project,
} from "@/lib/api";
import ProjectDialog from "@/components/admin/ProjectDialog";
import ConfirmDialog from "../ConfirmDialog";

type PublishStatus = "draft" | "published" | "hidden";

const TH =
  "px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400";

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-CA") : "—";

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getProjectsAdmin());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const askRemove = (p: Project) => setConfirmDelete(p);

  const doRemove = async (p: Project) => {
    try {
      await deleteProject(p.id);
      toast.success("Төсөл устгагдлаа");
      load();
    } catch (e: any) {
      toast.error(e.message || "Устгахад алдаа гарлаа");
    }
  };

  // Ноорог үед — шууд нийтэлнэ. Бусад үед published ⇄ hidden сэлгэнэ.
  const toggleActive = async (p: Project) => {
    const next: PublishStatus =
      p.status === "draft"
        ? "published"
        : p.status === "published"
          ? "hidden"
          : "published";

    setBusyId(p.id);
    const prev = items;
    setItems((list) =>
      list.map((it) => (it.id === p.id ? { ...it, status: next } : it)),
    );
    try {
      const updated = await updateProject(p.id, { status: next });
      setItems((list) => list.map((it) => (it.id === p.id ? updated : it)));
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
  const statusMeta = (p: Project) => {
    if (p.status === "draft") return { label: "Ноорог", dot: "bg-neutral-300" };
    if (p.status === "hidden")
      return { label: "Идэвхгүй", dot: "bg-neutral-900" };
    const scheduled = p.publishedAt && new Date(p.publishedAt).getTime() > now;
    return scheduled
      ? { label: "Хуваарьт", dot: "bg-amber-400" }
      : { label: "Нийтэлсэн", dot: "bg-[#F58220]" };
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#F58220]">
            Төсөл
          </p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-neutral-900">
            Төслүүд
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 bg-neutral-900 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#F17B2C]"
        >
          <Plus className="h-4 w-4" /> Шинэ төсөл
        </button>
      </div>

      {/* TABLE — table-fixed: урт текст баганын өргөнийг эвдэхгүй */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[860px] table-fixed text-sm">
          <colgroup>
            <col className="w-[88px]" />
            <col />
            <col className="w-[140px]" />
            <col className="w-[160px]" />
            <col className="w-[130px]" />
            <col className="w-[120px]" />
            <col className="w-[128px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/60">
              <th className="px-5 py-3.5" />
              <th className={TH}>Гарчиг</th>
              <th className={TH}>Төрөл</th>
              <th className={TH}>Байршил</th>
              <th className={TH}>Төлөв</th>
              <th className={TH}>Огноо</th>
              <th className={`${TH} text-right`}>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-sm text-neutral-400"
                >
                  Ачааллаж байна…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-sm text-neutral-400"
                >
                  Төсөл алга. Эхний төслөө нэмнэ үү.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const meta = statusMeta(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
                  >
                    {/* Thumbnail */}
                    <td className="px-5 py-3">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt=""
                          className="h-11 w-16 rounded-sm bg-neutral-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-16 items-center justify-center rounded-sm bg-neutral-100 text-neutral-300">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </td>

                    {/* Гарчиг — урт бол "..." болж, hover дээр бүтнээрээ */}
                    <td className="px-4 py-3">
                      <p
                        className="truncate font-medium text-neutral-900"
                        title={p.title}
                      >
                        {p.title || "—"}
                      </p>
                    </td>

                    {/* Төрөл */}
                    <td className="px-4 py-3">
                      <p className="truncate text-neutral-500" title={p.type}>
                        {p.type || "—"}
                      </p>
                    </td>

                    {/* Байршил */}
                    <td className="px-4 py-3">
                      <p
                        className="truncate text-neutral-500"
                        title={p.location}
                      >
                        {p.location || "—"}
                      </p>
                    </td>

                    {/* Төлөв */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                        />
                        {meta.label}
                      </span>
                    </td>

                    {/* Огноо */}
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                      {fmtDate(p.publishedAt)}
                    </td>

                    {/* Үйлдэл */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={busyId === p.id}
                          aria-label={
                            p.status === "published"
                              ? "Идэвхгүй болгох"
                              : "Идэвхтэй болгох"
                          }
                          title={
                            p.status === "draft"
                              ? "Дарж нийтлэх"
                              : p.status === "published"
                                ? "Идэвхтэй (дарж нуух)"
                                : "Идэвхгүй (дарж идэвхжүүлэх)"
                          }
                          className="cursor-pointer p-2 text-neutral-400 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {p.status === "published" ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(p);
                            setOpen(true);
                          }}
                          aria-label="Засах"
                          title="Засах"
                          className="cursor-pointer p-2 text-neutral-400 transition-colors hover:text-neutral-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => askRemove(p)}
                          aria-label="Устгах"
                          title="Устгах"
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

      <ProjectDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title="Төсөл устгах"
        message={`"${confirmDelete?.title || "—"}" төслийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`}
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