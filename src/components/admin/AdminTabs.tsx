import { cn } from "~/lib/utils";

export interface AdminTabDef<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  /** Small dot or count badge rendered after the label */
  indicator?: React.ReactNode;
}

interface AdminTabsProps<T extends string> {
  tabs: AdminTabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function AdminTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: AdminTabsProps<T>) {
  return (
    <div className={cn("flex border-b bg-background shrink-0", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            {tab.label}
            {tab.indicator}
          </button>
        );
      })}
    </div>
  );
}
