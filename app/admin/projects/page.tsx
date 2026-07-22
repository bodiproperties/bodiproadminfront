"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getProjects, deleteProject, type Project } from "@/lib/api";
import ProjectDialog from "@/components/admin/ProjectDialog";

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getProjects());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (p: Project) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteProject(p.id);
      toast.success("Project deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            Manage
          </p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-neutral-900">
            Projects
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-neutral-900 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/60">
              <th className="w-20 px-5 py-3.5"></th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Title
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Type
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Location
              </th>
              <th className="px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-neutral-400">
                Year
              </th>
              <th className="w-24 px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                  No projects yet. Create your first one.
                </td>
              </tr>
            ) : (
              items.map((p) => (
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
                  <td className="px-4 py-3 font-medium text-neutral-900">{p.title}</td>
                  <td className="px-4 py-3 text-neutral-500">{p.type}</td>
                  <td className="px-4 py-3 text-neutral-500">{p.location}</td>
                  <td className="px-4 py-3 text-neutral-500">{p.year}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setOpen(true);
                        }}
                        aria-label="Edit"
                        className="p-2 text-neutral-400 transition-colors hover:text-neutral-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        aria-label="Delete"
                        className="p-2 text-neutral-400 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProjectDialog open={open} onOpenChange={setOpen} initial={editing} onSaved={load} />
    </div>
  );
}