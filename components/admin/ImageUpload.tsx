"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, GripVertical, Star } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: any; // string (single) эсвэл string[] (multiple)
  onChange: (v: any) => void;
  multiple?: boolean;
}

// Mock: файлыг base64 data URL болгоно. Дараа нь энэ функцийг жинхэнэ upload-аар сольж болно.
const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ImageUpload({ value, onChange, multiple = false }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const urls: string[] = multiple ? value || [] : value ? [value] : [];

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const dataUrls = await Promise.all(Array.from(files).map(toDataUrl));
      if (multiple) onChange([...(value || []), ...dataUrls]);
      else onChange(dataUrls[0]);
    } catch {
      toast.error("Зураг уншихад алдаа гарлаа");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (i: number) => {
    if (multiple) onChange((value as string[]).filter((_, idx) => idx !== i));
    else onChange("");
  };

  const reorder = (from: number, to: number) => {
    if (!multiple || from === to) return;
    const next = [...(value as string[])];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const makeCover = (i: number) => {
    if (!multiple || i === 0) return;
    const next = [...(value as string[])];
    const [moved] = next.splice(i, 1);
    next.unshift(moved);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((url, i) => (
          <div
            key={i}
            draggable={multiple}
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(i);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom.current !== null) reorder(dragFrom.current, i);
              dragFrom.current = null;
              setDragOver(null);
            }}
            onDragEnd={() => {
              dragFrom.current = null;
              setDragOver(null);
            }}
            className={`group relative aspect-square overflow-hidden rounded-md border bg-neutral-100 ${
              multiple ? "cursor-grab active:cursor-grabbing" : ""
            } ${
              dragOver === i
                ? "border-neutral-900 ring-2 ring-neutral-900/20"
                : "border-neutral-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="pointer-events-none h-full w-full object-cover"
            />

            {multiple && i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-neutral-900/85 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-white">
                Cover
              </span>
            )}

            {multiple && i !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(i)}
                aria-label="Set as cover"
                title="Cover болгох"
                className="absolute left-1 top-1 rounded bg-black/55 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}

            {multiple && (
              <span className="absolute bottom-1 left-1 rounded bg-black/45 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-3.5 w-3.5" />
              </span>
            )}

            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {(multiple || urls.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
            <span className="text-[10px] uppercase tracking-[0.15em]">
              {busy ? "Reading" : "Add"}
            </span>
          </button>
        )}
      </div>

      {multiple && urls.length > 1 && (
        <p className="mt-2 text-[11px] text-neutral-400">
          ★ дарж эсвэл чирж cover (эхэнд харагдах зураг)-оо сонгоно.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}