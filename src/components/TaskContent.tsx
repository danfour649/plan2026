import { sanitizeTaskContentForDisplay } from "@/lib/sanitize";

type TaskContentProps = { content: string | null };

/** Renders sanitized task rich text; bare http(s) URLs become clickable links. */
export function TaskContent({ content }: TaskContentProps) {
  if (content == null || content.trim() === "") return null;
  const safe = sanitizeTaskContentForDisplay(content);
  return (
    <div
      className="mt-1 text-[0.9375rem] leading-relaxed sm:text-sm sm:leading-normal text-zinc-600 dark:text-zinc-200 prose prose-sm max-w-none [&_a]:text-accent-blue [&_a]:underline [&_a]:break-all"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
