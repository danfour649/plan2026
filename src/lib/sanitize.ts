import DOMPurify from "isomorphic-dompurify";

/** Allowed tags for task rich text content (safe subset for links, bold, lists). */
const ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "a", "ul", "ol", "li"];

/** Allowed attributes (e.g. href for links). */
const ALLOWED_ATTR = ["href", "target", "rel"];

/**
 * Sanitize HTML for task content. Use when saving or rendering user-provided HTML.
 */
export function sanitizeTaskContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target", "rel"],
  });
}
