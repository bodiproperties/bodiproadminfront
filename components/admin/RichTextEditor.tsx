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
import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Minus,
  ImagePlus,
  Youtube as YoutubeIcon,
  X,
  GripVertical,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

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
      className={`group relative my-4 w-full  overflow-hidden rounded-lg ${
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
        {/* editor дотор дарахад play биш, node сонгогдоно */}
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

/* Зургийг canvas-аар шахаж base64 болгоно */
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

export default function RichTextEditor({ value, onChange }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      CustomImage,
      CustomYoutube.configure({
        nocookie: true,
        controls: true,
        HTMLAttributes: { class: "rounded-lg" },
      }),
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
      try {
        const dataUrl = await compressImage(file);
        editor.chain().focus().setImage({ src: dataUrl }).run();
      } catch {
        /* нэг зураг унавал үлдсэнийг үргэлжлүүлнэ */
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
          label="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough className="h-4 w-4" />
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

        <Btn label="Зураг оруулах" onClick={() => imgInputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </Btn>
        <Btn label="YouTube видео" onClick={addYoutube}>
          <YoutubeIcon className="h-4 w-4" />
        </Btn>

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
