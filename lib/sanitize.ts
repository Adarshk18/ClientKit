import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
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
];

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

export function sanitizeScopeHtml(input: string): string {
  const clipped = input.slice(0, MAX_SCOPE_LENGTH);
  return sanitizeHtml(clipped, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
    },
    exclusiveFilter: (frame) => {
      const tag = frame.tag;
      return tag === "script" || tag === "iframe" || tag === "object" || tag === "embed";
    },
  });
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CK";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "CK";
}
