import sanitizeHtml from "sanitize-html";

/** Allowed tags for task rich text content (safe subset for links, emphasis, and lists). */
const ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li"];

/** Allowed attributes (e.g. href for links). */
const ALLOWED_ATTR = ["href", "target", "rel"];

/**
 * Sanitize HTML for task content. Use when saving or rendering user-provided HTML.
 */
export function sanitizeTaskContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ALLOWED_ATTR,
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}
