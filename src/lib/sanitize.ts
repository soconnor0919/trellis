import sanitizeHtml from "sanitize-html";

// Tags emitted by TipTap StarterKit + Link extension.
// h1 is intentionally excluded — body copy should not contain page-level headings.
const OPTS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "strong", "em", "s", "code", "pre",
    "blockquote", "h2", "h3",
    "ul", "ol", "li",
    "br", "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTS);
}
