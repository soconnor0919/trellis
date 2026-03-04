"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import { useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Heading2,
  Heading3,
  Unlink,
} from "lucide-react";
import { cn } from "~/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

function Divider() {
  return <div className="mx-1 h-4 w-px bg-border shrink-0" />;
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent editor from losing focus when clicking toolbar buttons
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, className }: Props) {
  // Suppress onChange during external value sync to prevent auto-save loops
  const suppressRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false, // required by TipTap 3 in SSR (Next.js) to avoid hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // no h1 in body copy
        codeBlock: false,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      if (suppressRef.current) return;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[120px] outline-none",
      },
    },
  });

  // Sync external value (page switch, draft load) without triggering onUpdate loops.
  // TipTap 3 fires onUpdate synchronously so the ref guard is reliable here.
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    suppressRef.current = true;
    editor.commands.setContent(value ?? "");
    suppressRef.current = false;
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Add link">
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
          >
            <Unlink className="h-4 w-4" />
          </ToolbarBtn>
        )}
      </div>

      {/* Edit area */}
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-sm prose prose-sm prose-neutral max-w-none [&_.tiptap]:outline-none"
      />
    </div>
  );
}
