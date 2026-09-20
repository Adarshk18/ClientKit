const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
]);

export const MAX_SCOPE_LENGTH = 20_000;
export const MAX_LINE_ITEMS = 20;
export const MAX_TITLE_LENGTH = 200;

export function normalizeScopeHtml(input: string): string {
  const trimmed = input.trim().slice(0, MAX_SCOPE_LENGTH);
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeScopeHtml(trimmed);
  const escaped = trimmed
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return sanitizeScopeHtml(
    escaped
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`)
      .join(""),
  );
}

function safeHref(raw: string): string | null {
  const value = raw.trim().replace(/^['"]|['"]$/g, "").replace(/&amp;/gi, "&");
  if (!/^(https?:|mailto:)/i.test(value)) return null;
  if (/[\s<>\\]/.test(value)) return null;
  return value;
}

export function sanitizeScopeHtml(input: string): string {
  let html = input.slice(0, MAX_SCOPE_LENGTH);
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?>/g, (full, tag, attrs) => {
    const name = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (full.startsWith("</")) return `</${name}>`;
    if (name === "br") return "<br />";
    if (name === "a") {
      const hrefMatch = String(attrs).match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const raw = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "";
      const href = safeHref(raw);
      if (!href) return "<a>";
      const encoded = href.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
      return `<a href="${encoded}" rel="noopener noreferrer" target="_blank">`;
    }
    return `<${name}>`;
  });
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CK";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "CK";
}
