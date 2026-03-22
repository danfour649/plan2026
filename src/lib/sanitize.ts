import sanitizeHtml from "sanitize-html";

/** Allowed tags for task rich text content (safe subset for links, emphasis, and lists). */
const ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "a", "ul", "ol", "li"];

/** Allowed attributes (e.g. href for links). */
const ALLOWED_ATTR = ["href", "target", "rel"];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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
};

/**
 * Sanitize HTML for task content. Use when saving or rendering user-provided HTML.
 */
export function sanitizeTaskContent(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/** Opening <a> tag (not <address>, etc.); excludes self-closing. */
const OPEN_ANCHOR_TAG = /^<\s*a(?=[\s>\/])/i;
const CLOSE_ANCHOR_TAG = /^<\s*\/\s*a\s*>/i;

function escapeHtmlTextContent(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeHrefAttribute(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Wraps bare http(s) URLs in text segments that are not already inside an <a> element.
 * Input must already be sanitized HTML. Preserves existing entities in non-URL segments.
 */
export function linkifyHttpUrlsInSanitizedHtml(html: string): string {
  let out = "";
  let i = 0;
  let anchorDepth = 0;

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      const chunk = html.slice(i);
      out += anchorDepth === 0 ? linkifyPlainHttpUrlsInTextChunk(chunk) : chunk;
      break;
    }
    const textBefore = html.slice(i, lt);
    out += anchorDepth === 0 ? linkifyPlainHttpUrlsInTextChunk(textBefore) : textBefore;

    const gt = html.indexOf(">", lt);
    if (gt === -1) {
      out += html.slice(lt);
      break;
    }
    const tagSlice = html.slice(lt, gt + 1);
    out += tagSlice;

    const trimmed = tagSlice.trim();
    if (CLOSE_ANCHOR_TAG.test(trimmed)) {
      anchorDepth = Math.max(0, anchorDepth - 1);
    } else if (OPEN_ANCHOR_TAG.test(trimmed) && !/\/\s*>\s*$/i.test(trimmed)) {
      anchorDepth++;
    }

    i = gt + 1;
  }

  return out;
}

const HTTP_URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;

function linkifyPlainHttpUrlsInTextChunk(text: string): string {
  if (text === "") return text;
  let out = "";
  let last = 0;
  HTTP_URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HTTP_URL_RE.exec(text)) !== null) {
    out += text.slice(last, m.index);
    const url = m[0];
    const href = escapeHrefAttribute(url);
    out += `<a href="${href}">${escapeHtmlTextContent(url)}</a>`;
    last = m.index + url.length;
  }
  out += text.slice(last);
  return out;
}

/**
 * Sanitize task HTML, turn plain http(s) URLs into links (outside existing anchors), then sanitize again for display.
 */
export function sanitizeTaskContentForDisplay(html: string): string {
  const once = sanitizeHtml(html, SANITIZE_OPTIONS);
  const linked = linkifyHttpUrlsInSanitizedHtml(once);
  return sanitizeHtml(linked, SANITIZE_OPTIONS);
}
