"use client";

import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getToken } from "@/lib/api";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Minus,
  ImagePlus,
  Youtube as YoutubeIcon,
  X,
  GripVertical,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Code,
  Table as TableIcon,
  Trash2,
  Rows,
  Columns,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

/* Зургийн node view: hover устгах + чирэх бариул */
function ImageNodeView({ node, deleteNode, selected }: any) {
  return (
    <NodeViewWrapper
      className={`group relative my-4 block w-fit max-w-full rounded-md ${
        selected ? "ring-2 ring-neutral-900 ring-offset-2" : ""
      }`}
    >
      <span
        data-drag-handle
        contentEditable={false}
        className="absolute left-2 top-2 z-10 flex cursor-grab items-center rounded bg-black/55 px-1.5 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <button
        type="button"
        onClick={() => deleteNode()}
        aria-label="Зураг устгах"
        contentEditable={false}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        className="block max-w-full rounded-md"
      />
    </NodeViewWrapper>
  );
}

const CustomImage = Image.extend({
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
}).configure({ inline: false, allowBase64: true });

/* watch/youtu.be/embed аль ч хэлбэрийг embed URL болгоно */
function toEmbedUrl(src: string): string {
  const m = src?.match(
    /(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/,
  );
  const id = m?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : src;
}

/* YouTube node view: hover устгах товч */
function YoutubeNodeView({ node, deleteNode, selected }: any) {
  const embed = toEmbedUrl(node.attrs.src || "");
  return (
    <NodeViewWrapper
      className={`group relative my-4 w-full overflow-hidden rounded-lg ${
        selected ? "ring-2 ring-neutral-900 ring-offset-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => deleteNode()}
        aria-label="Видео устгах"
        contentEditable={false}
        className="absolute right-2 top-2 z-20 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={embed}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div
          className="absolute inset-0 z-10"
          contentEditable={false}
          onClick={(e) => e.preventDefault()}
        />
      </div>
    </NodeViewWrapper>
  );
}

const CustomYoutube = Youtube.extend({
  addNodeView() {
    return ReactNodeViewRenderer(YoutubeNodeView);
  },
});

/* Зургийг canvas-аар шахаж base64 болгоно (upload хийхийн өмнөх завсрын алхам) */
function compressImage(
  file: File,
  maxW = 1600,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Base64 → Blob хөрвүүлээд backend-рvv upload хийж, URL буцаана */
async function uploadDataUrl(
  dataUrl: string,
  filename: string,
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const fd = new FormData();
  fd.append("file", blob, filename);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });

  if (!res.ok) throw new Error("Upload амжилтгvй боллоо");
  const data = await res.json();
  return data.url;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);
  const uploadingCount = useRef(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      CustomImage,
      CustomYoutube.configure({
        nocookie: true,
        controls: true,
        HTMLAttributes: { class: "rounded-lg" },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-[#F58220] underline underline-offset-2",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({ multicolor: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[320px] px-5 py-4 focus:outline-none text-[15px] leading-relaxed text-neutral-800",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      lastEmitted.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const insertImages = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      uploadingCount.current += 1;
      try {
        const dataUrl = await compressImage(file);
        const url = await uploadDataUrl(dataUrl, file.name);
        editor
          .chain()
          .focus()
          .setImage({ src: url })
          .createParagraphNear()
          .run();
      } catch (e: any) {
        toast.error(e.message || "Зураг upload хийхэд алдаа гарлаа");
      } finally {
        uploadingCount.current -= 1;
      }
    }
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const addYoutube = () => {
    const raw = window.prompt("YouTube URL оруулна уу:");
    if (!raw) return;

    const m = raw.match(
      /(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/,
    );
    const id = m?.[1];
    if (!id) {
      window.alert(
        "YouTube URL танигдсангүй. Жишээ: https://youtu.be/XXXXXXXXXXX",
      );
      return;
    }

    editor
      .chain()
      .focus()
      .setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${id}` })
      .run();
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Холбоосын URL:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const inTable = editor.isActive("table");

  const Btn = ({
    onClick,
    active,
    disabled,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
        active
          ? "bg-neutral-900 text-white shadow-sm"
          : "text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );

  const Sep = () => <span className="mx-1 h-5 w-px bg-neutral-200" />;

  return (
    <div className="rounded-lg border border-neutral-300 bg-white transition-colors focus-within:border-neutral-900">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-neutral-200 bg-neutral-50/95 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/80">
        <Btn
          label="Гарчиг 1"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </Btn>
        <Btn
          label="Гарчиг 2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn
          label="Гарчиг 3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </Btn>

        <Sep />

        <Btn
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Btn>
        <Btn
          label="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough className="h-4 w-4" />
        </Btn>
        <Btn
          label="Тэмдэглэгээ будаг"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
        >
          <Highlighter className="h-4 w-4" />
        </Btn>
        <Btn
          label="Код"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
        >
          <Code className="h-4 w-4" />
        </Btn>

        <Sep />

        <Btn
          label="Зүүн тийш"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        >
          <AlignLeft className="h-4 w-4" />
        </Btn>
        <Btn
          label="Төвд"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        >
          <AlignCenter className="h-4 w-4" />
        </Btn>
        <Btn
          label="Баруун тийш"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        >
          <AlignRight className="h-4 w-4" />
        </Btn>

        <Sep />

        <Btn
          label="Жагсаалт"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </Btn>
        <Btn
          label="Дугаартай жагсаалт"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn
          label="Иш"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="h-4 w-4" />
        </Btn>
        <Btn
          label="Зураас"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Btn>

        <Sep />

        <Btn label="Холбоос" onClick={setLink} active={editor.isActive("link")}>
          <LinkIcon className="h-4 w-4" />
        </Btn>
        <Btn
          label="Холбоос устгах"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
        >
          <Unlink className="h-4 w-4" />
        </Btn>

        <Sep />

        <Btn label="Зураг оруулах" onClick={() => imgInputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </Btn>
        <Btn label="YouTube видео" onClick={addYoutube}>
          <YoutubeIcon className="h-4 w-4" />
        </Btn>
        {inTable && (
          <>
            <Sep />
            <Btn
              label="Мөр нэмэх"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <Rows className="h-4 w-4" />
            </Btn>
            <Btn
              label="Багана нэмэх"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <Columns className="h-4 w-4" />
            </Btn>
            <Btn
              label="Хүснэгт устгах"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash2 className="h-4 w-4" />
            </Btn>
          </>
        )}

        <Sep />

        <Btn
          label="Буцаах"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Btn>
        <Btn
          label="Дахин"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Btn>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => insertImages(e.target.files)}
      />
    </div>
  );
}