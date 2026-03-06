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
  placeholder = "Add notes or links (optional)…",
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
          "min-h-[80px] w-full resize-y rounded-b-xl border border-t-0 border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline",
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
    return () => editor.off("update", setHiddenInput);
  }, [editor, setHiddenInput]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL");
    if (url == null) return;
    const href = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-zinc-200 focus-within:ring-4 focus-within:ring-zinc-950/10">
      <div className="flex items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-1 rounded-t-xl">
        <button
          type="button"
          onClick={addLink}
          className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
          title="Add link"
        >
          Link
        </button>
      </div>
      <input type="hidden" name={name} defaultValue={defaultValue} />
      <EditorContent editor={editor} />
    </div>
  );
}
