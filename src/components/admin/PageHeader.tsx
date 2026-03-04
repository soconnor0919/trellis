import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Extra content below the title/description row (e.g. badge counts, tabs) */
  below?: ReactNode;
  className?: string;
}

/**
 * Unified top header for every standard CMS admin page.
 * Renders: serif title + muted description on the left, optional action buttons on the right.
 */
export function PageHeader({ title, description, actions, below, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1.5 text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="shrink-0 flex items-center gap-2">{actions}</div>
        )}
      </div>
      {below}
    </div>
  );
}
