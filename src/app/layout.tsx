import "~/styles/globals.css";
import { type Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/ThemeProvider";
import { ThemeInjector } from "~/components/ThemeInjector";
import { db } from "~/server/db";
import { siteSettings } from "~/server/db/schema";
import { appDefaults } from "~/config/cms";

export async function generateMetadata(): Promise<Metadata> {
  let row: {
    siteName: string;
    seoTitle: string | null;
    seoDescription: string | null;
    iconUrl: string | null;
  } | undefined;

  try {
    row = await db.select({
      siteName:       siteSettings.siteName,
      seoTitle:       siteSettings.seoTitle,
      seoDescription: siteSettings.seoDescription,
      iconUrl:        siteSettings.iconUrl,
    }).from(siteSettings).get();
  } catch {
    // DB not ready during build — use static defaults.
  }

  const title       = row?.seoTitle ?? row?.siteName ?? appDefaults.name;
  const description = row?.seoDescription ?? appDefaults.description;
  const icons: Metadata["icons"] = row?.iconUrl
    ? [{ rel: "icon", url: row.iconUrl }]
    : [
        { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
        { rel: "icon", url: "/favicon.ico" },
      ];

  return { title, description, icons };
}

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sourceSans.variable} suppressHydrationWarning>
      <body>
        {/*
          Reads DB-configured primary/accent colors and injects a :root {}
          override so the live site immediately reflects Settings > Branding
          color changes. Suspense fallback is null (globals.css defaults
          render instantly from the static stylesheet).
        */}
        <Suspense fallback={null}>
          <ThemeInjector />
        </Suspense>
        <ThemeProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
