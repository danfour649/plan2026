"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      Placeholder.configure({ placeholder: resolvedPlaceholder }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] w-full resize-y rounded-b-xl border border-t-0 border-border bg-white px-3 py-2 text-base text-black outline-none ring-ring focus:ring-4 prose prose-sm max-sm:prose-base sm:prose-sm max-w-none sm:text-sm prose-p:text-black [&_a]:text-accent-blue [&_a]:underline dark:bg-zinc-800 dark:text-zinc-100 dark:prose-p:text-zinc-100",
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
    <div className="rounded-xl border border-border bg-white/90 focus-within:ring-4 focus-within:ring-ring dark:bg-zinc-800/90">
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={defaultValue} />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-border bg-blue-50/70 px-3 py-2 dark:bg-zinc-700/70">
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
