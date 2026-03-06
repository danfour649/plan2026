"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect } from "react";

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
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
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
    const el = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
    if (el && editor) {
      const html = editor.getHTML();
      el.value = html === "<p></p>" ? "" : html;
    }
  }, [name, editor]);

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
      <input type="hidden" name={name} defaultValue={defaultValue} />
      <EditorContent editor={editor} />
    </div>
  );
}
