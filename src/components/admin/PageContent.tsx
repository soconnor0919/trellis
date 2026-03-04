import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface PageContentProps {
  children: ReactNode;
  /**
   * Rendered in a sticky non-scrolling header bar (border-b) above the scroll area.
   * Pass a <PageHeader> here so actions stay visible when content is long.
   */
  header?: ReactNode;
  /**
   * Rendered in a second sticky strip below the header (no extra border — component
   * provides its own). Use for <AdminTabs> so tabs remain visible while scrolling.
   */
  tabs?: ReactNode;
  /** Override the max-width of the inner content. Defaults to "max-w-4xl". */
  maxWidth?: "max-w-3xl" | "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-full";
  className?: string;
}

/**
 * Scrollable page shell for all standard CMS admin pages.
 *
 * Renders sticky header + optional tab bar above the scrollable content area
 * so page titles and action buttons never scroll out of view.
 */
export function PageContent({
  children,
  header,
  tabs,
  maxWidth = "max-w-4xl",
  className,
}: PageContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {header && (
        <div className="border-b bg-background shrink-0 px-8 py-5">
          {header}
        </div>
      )}
      {tabs && (
        <div className="bg-background shrink-0">
          {tabs}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("mx-auto px-8 py-8 space-y-8", maxWidth, className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
