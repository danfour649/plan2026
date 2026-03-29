/** Plain text for client-side task search (strips HTML from rich task content). */
export function stripHtmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type TaskLikeForLocalSearch = {
  title: string;
  content: string | null;
  plan: { name: string } | null;
};

export function taskMatchesLocalSearch(task: TaskLikeForLocalSearch, needleLower: string): boolean {
  if (!needleLower) return true;
  const title = task.title.toLowerCase();
  const planName = (task.plan?.name ?? "").toLowerCase();
  const body = stripHtmlToPlainText(task.content).toLowerCase();
  return title.includes(needleLower) || planName.includes(needleLower) || body.includes(needleLower);
}
