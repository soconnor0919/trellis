/**
 * ThemeInjector — async server component.
 *
 * Fetches the active site settings from the DB and injects a `:root {}` style
 * block that overrides the Tailwind design-token CSS custom properties with the
 * admin-configured primary and accent colors. Because this is a server
 * component the style tag is included in the initial HTML — no flash of
 * default colors.
 *
 * Falls back to the compile-time defaults from cms.ts if no settings row
 * exists yet (fresh install) or if the DB is unreachable during a build.
 */

import { db } from "~/server/db";
import { siteSettings } from "~/server/db/schema";
import { defaultTheme } from "~/config/cms";
import { buildThemeCSS } from "~/lib/theme";

export async function ThemeInjector() {
  let primary = defaultTheme.primaryColor;
  let accent  = defaultTheme.accentColor;
  let text    = defaultTheme.textColor;

  try {
    const row = await db.select({
      primaryColor: siteSettings.primaryColor,
      accentColor:  siteSettings.accentColor,
      textColor:    siteSettings.textColor,
    }).from(siteSettings).get();

    if (row) {
      primary = row.primaryColor;
      accent  = row.accentColor;
      text    = row.textColor;
    }
  } catch {
    // DB not ready (e.g. build-time static generation) — use config defaults.
  }

  // Only inject when the values differ from the hardcoded globals.css defaults,
  // so we don't add a pointless style block on a fresh install.
  if (
    primary === defaultTheme.primaryColor &&
    accent  === defaultTheme.accentColor  &&
    text    === defaultTheme.textColor
  ) {
    return null;
  }

  const css = buildThemeCSS(primary, accent, text);

  // Values are validated as /^#[0-9a-fA-F]{6}$/ in the settings mutation,
  // so dangerouslySetInnerHTML is safe here.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
