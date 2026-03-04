/**
 * theme.ts — utilities for working with hex brand colors at runtime.
 *
 * Used by ThemeInjector to build the `:root` CSS custom-property override
 * that applies the admin-configured primary/accent colors to the live site.
 */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Return true for valid 6-digit hex strings (with leading #). */
export function isValidHex(hex: string): hex is `#${string}` {
  return HEX_RE.test(hex);
}

/** Parse a 6-digit hex color into 0–255 RGB components. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/**
 * WCAG relative luminance (0 = black, 1 = white).
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linearise = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * Return "#ffffff" or "#000000" — whichever achieves better contrast
 * against the given background color.
 */
export function contrastForeground(bg: string): string {
  return relativeLuminance(bg) > 0.179 ? "#000000" : "#ffffff";
}

/**
 * Build the `:root {}` CSS block that overrides the design-token custom
 * properties for the given primary, accent, and text hex values.
 *
 * Only injects properties that are actually used by the Tailwind theme
 * (`--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`,
 * `--foreground`, `--ring`). The defaults in globals.css handle everything else.
 */
export function buildThemeCSS(primaryColor: string, accentColor: string, textColor: string): string {
  const primary = isValidHex(primaryColor) ? primaryColor : "#8a7d55";
  const accent  = isValidHex(accentColor)  ? accentColor  : "#f8f5ee";
  const text    = isValidHex(textColor)    ? textColor    : "#2c2826";

  return [
    `:root {`,
    `  --primary: ${primary};`,
    `  --primary-foreground: ${contrastForeground(primary)};`,
    `  --accent: ${accent};`,
    `  --accent-foreground: ${contrastForeground(accent)};`,
    `  --foreground: ${text};`,
    `  --ring: ${primary};`,
    `}`,
  ].join("\n");
}
