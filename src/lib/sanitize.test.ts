import { describe, expect, it } from "vitest";

import { sanitizeTaskContent } from "./sanitize";

describe("sanitizeTaskContent", () => {
  it("allows safe tags and strips script", () => {
    const html = '<p>Hello <strong>world</strong></p><script>alert(1)</script>';
    expect(sanitizeTaskContent(html)).toBe("<p>Hello <strong>world</strong></p>");
  });

  it("allows links with href and sets target and rel", () => {
    const html = '<p><a href="https://example.com">link</a></p>';
    expect(sanitizeTaskContent(html)).toContain('href="https://example.com"');
    expect(sanitizeTaskContent(html)).toContain('target="_blank"');
    expect(sanitizeTaskContent(html)).toContain('rel="noopener noreferrer"');
  });

  it("strips javascript: URLs", () => {
    const html = '<p><a href="javascript:alert(1)">x</a></p>';
    const out = sanitizeTaskContent(html);
    expect(out).not.toContain("javascript:");
  });

  it("allows mailto links", () => {
    const html = '<p><a href="mailto:test@example.com">email</a></p>';
    expect(sanitizeTaskContent(html)).toContain('href="mailto:test@example.com"');
  });

  it("allows lists and emphasis", () => {
    const html = "<ul><li>one</li><li>two</li></ul><em>emphasis</em>";
    expect(sanitizeTaskContent(html)).toContain("<ul>");
    expect(sanitizeTaskContent(html)).toContain("<li>");
    expect(sanitizeTaskContent(html)).toContain("<em>");
  });
});
