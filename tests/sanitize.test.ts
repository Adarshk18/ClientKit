import { describe, expect, it } from "vitest";
import { normalizeScopeHtml, sanitizeScopeHtml } from "@/lib/sanitize";

describe("sanitizeScopeHtml", () => {
  it("strips script, iframe, and on* handlers", () => {
    const dirty =
      '<p onclick="alert(1)">Hi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe>';
    const clean = sanitizeScopeHtml(dirty);
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/iframe/i);
    expect(clean).not.toMatch(/onClick/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).toMatch(/Hi/);
  });

  it("keeps basic formatting", () => {
    const clean = sanitizeScopeHtml("<p>Hello <strong>world</strong></p>");
    expect(clean).toContain("<strong>world</strong>");
  });
});

describe("normalizeScopeHtml", () => {
  it("wraps plain text paragraphs", () => {
    const html = normalizeScopeHtml("Hello\n\nThere");
    expect(html).toContain("<p>Hello</p>");
    expect(html).toContain("<p>There</p>");
  });
});
