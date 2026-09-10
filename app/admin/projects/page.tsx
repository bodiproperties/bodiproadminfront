"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
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

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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
      toast.success("Project устгагдлаа");
      load();
    } catch (e: any) {
      toast.error(e.message || "Устгахад алдаа гарлаа");
    }
  };

  // Ноорог vед — шууд нийтэлнэ. Бусад vед published ⇄ hidden сэлгэнэ.
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
        next === "published" ? "Идэвхтэй боллоо" : "Идэвхгvй боллоо",
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
      return { label: "Идэвхгvй", dot: "bg-neutral-900" };
    const scheduled = p.publishedAt && new Date(p.publishedAt).getTime() > now;
    return scheduled
      ? { label: "Хуваарьт", dot: "bg-amber-400" }
      : { label: "Нийтэлсэн", dot: "bg-[#F58220]" };
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            Төслийн
          </p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-neutral-900">
            Мэдээ
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-neutral-900 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-600 cursor-pointer hover:shadow-md hover:shadow-neutral-900/30"
        >
          <Plus className="h-4 w-4" /> Шинэ төслийн мэдээ
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/60">
              <th className="w-20 px-5 py-3.5"></th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Гарчиг
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Төрөл
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Байршил
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Төлөв
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Нийтлэсэн огноо
              </th>
              <th className="w-32 px-5 py-3.5">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-neutral-400"
                >
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-neutral-400"
                >
                  Одоогоор төслийн мэдээлэл байхгvй байна.
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
                    <td className="px-5 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt=""
                        className="h-10 w-14 rounded-sm bg-neutral-100 object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{p.type}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.location}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                        />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {p.publishedAt
                        ? new Date(p.publishedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={busyId === p.id}
                          aria-label={
                            p.status === "published"
                              ? "Идэвхгvй болгох"
                              : "Идэвхтэй болгох"
                          }
                          title={
                            p.status === "draft"
                              ? "Дарж нийтлэх"
                              : p.status === "published"
                                ? "Идэвхтэй (дарж нуух)"
                                : "Идэвхгvй (дарж идэвхжvvлэх)"
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
                          aria-label="Edit"
                          className="p-2 text-neutral-400 transition-colors hover:text-blue-500 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => askRemove(p)}
                          aria-label="Delete"
                          className="p-2 text-neutral-400 transition-colors hover:text-red-600 cursor-pointer"
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
        title="Төслийн мэдээ устгах"
        message={`"${confirmDelete?.title || "—"}" project-ийг устгах уу? Энэ vйлдлийг буцаах боломжгvй.`}
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