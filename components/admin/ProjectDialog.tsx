"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createProject, updateProject, type Project } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Project | null;
  onSaved: () => void;
}

const empty = {
  title: "",
  type: "",
  location: "",
  year: "",
  image: "",
  gallery: "",
  description: "",
  longDescription: "",
  client: "",
  area: "",
  status: "",
  services: "",
  sortOrder: "0",
};

export default function ProjectDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(
      initial
        ? {
            title: initial.title,
            type: initial.type,
            location: initial.location,
            year: initial.year,
            image: initial.image,
            gallery: (initial.gallery || []).join("\n"),
            description: initial.description || "",
            longDescription: initial.longDescription || "",
            client: initial.detail?.client || "",
            area: initial.detail?.area || "",
            status: initial.detail?.status || "",
            services: (initial.detail?.services || []).join(", "),
            sortOrder: String(initial.sortOrder ?? 0),
          }
        : empty
    );
  }, [open, initial]);

  const set = (k: keyof typeof empty, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      title: f.title,
      type: f.type,
      location: f.location,
      year: f.year,
      image: f.image,
      gallery: f.gallery.split("\n").map((s) => s.trim()).filter(Boolean),
      description: f.description,
      longDescription: f.longDescription,
      detail: {
        client: f.client,
        area: f.area,
        status: f.status,
        services: f.services.split(",").map((s) => s.trim()).filter(Boolean),
      },
      sortOrder: Number(f.sortOrder) || 0,
    };
    try {
      if (initial?.id) await updateProject(initial.id, payload);
      else await createProject(payload);
      toast.success(initial ? "Project updated" : "Project created");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            These fields map directly to the public project page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Input value={f.type} onChange={(e) => set("type", e.target.value)} placeholder="RESIDENTIAL" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={f.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input value={f.year} onChange={(e) => set("year", e.target.value)} placeholder="2024" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Cover image URL</Label>
            <Input value={f.image} onChange={(e) => set("image", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Gallery URLs (one per line)</Label>
            <Textarea rows={3} value={f.gallery} onChange={(e) => set("gallery", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Short description</Label>
            <Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Long description</Label>
            <Textarea rows={5} value={f.longDescription} onChange={(e) => set("longDescription", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Input value={f.client} onChange={(e) => set("client", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Area</Label>
            <Input value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="420 m²" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={f.status} onChange={(e) => set("status", e.target.value)} placeholder="Completed" />
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Services (comma-separated)</Label>
            <Input value={f.services} onChange={(e) => set("services", e.target.value)} placeholder="Architecture, Interior, Landscape" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
