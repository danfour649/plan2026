"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";

import { useTranslations } from "@/components/TranslationsProvider";

type TaskContentEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

export function TaskContentEditor({
  name,
  defaultValue = "",
  placeholder,
}: TaskContentEditorProps) {
  const t = useTranslations();
  const resolvedPlaceholder = placeholder ?? t.tasks.taskDescriptionPlaceholder;
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
      Placeholder.configure({ placeholder: resolvedPlaceholder }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] w-full resize-y rounded-b-xl border border-t-0 border-blue-100 bg-white px-3 py-2 text-sm text-black outline-none ring-blue-200/70 focus:ring-4 prose prose-sm max-w-none prose-p:text-black [&_a]:text-blue-600 [&_a]:underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:prose-p:text-zinc-100 [&_a]:dark:text-blue-400",
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
    <div className="rounded-xl border border-blue-100 bg-white/90 focus-within:ring-4 focus-within:ring-blue-200/70 dark:border-zinc-600 dark:bg-zinc-800/90 dark:focus-within:ring-blue-500/30">
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={defaultValue} />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-blue-100 bg-blue-50/70 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700/70">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded-md px-2.5 py-1 text-sm font-semibold transition ${
            editor.isActive("bold")
              ? "bg-blue-600 text-white dark:bg-blue-500"
              : "bg-white text-blue-700 hover:bg-blue-100 dark:bg-zinc-600 dark:text-blue-200 dark:hover:bg-zinc-500"
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
              ? "bg-blue-600 text-white dark:bg-blue-500"
              : "bg-white text-blue-700 hover:bg-blue-100 dark:bg-zinc-600 dark:text-blue-200 dark:hover:bg-zinc-500"
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
