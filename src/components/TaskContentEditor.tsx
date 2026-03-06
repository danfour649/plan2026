"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";

type TaskContentEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

export function TaskContentEditor({
  name,
  defaultValue = "",
  placeholder = "Add a description, notes, or links (optional)…",
}: TaskContentEditorProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] w-full resize-y rounded-b-xl border border-t-0 border-blue-100 bg-white px-3 py-2 text-sm outline-none ring-blue-200/70 focus:ring-4 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline",
      },
    },
  });

  const setHiddenInput = useCallback(() => {
    const el = hiddenInputRef.current;
    if (el && editor) {
      const html = editor.getHTML();
      el.value = html === "<p></p>" ? "" : html;
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", setHiddenInput);
    setHiddenInput();
    return () => {
      editor.off("update", setHiddenInput);
    };
  }, [editor, setHiddenInput]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-white/90 focus-within:ring-4 focus-within:ring-blue-200/70">
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={defaultValue} />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-blue-100 bg-blue-50/70 px-3 py-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded-md px-2.5 py-1 text-sm font-semibold transition ${
            editor.isActive("bold")
              ? "bg-blue-600 text-white"
              : "bg-white text-blue-700 hover:bg-blue-100"
          }`}
          aria-pressed={editor.isActive("bold")}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded-md px-2.5 py-1 text-sm font-semibold transition ${
            editor.isActive("underline")
              ? "bg-blue-600 text-white"
              : "bg-white text-blue-700 hover:bg-blue-100"
          }`}
          aria-pressed={editor.isActive("underline")}
        >
          U
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
