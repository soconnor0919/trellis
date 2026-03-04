"use client";

import { useRouter } from "next/navigation";
import { signOut } from "~/lib/auth-client";
import { LogOut } from "lucide-react";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

export default function AdminLogout({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();

  const btn = (
    <button
      onClick={async () => {
        await signOut();
        router.push("/admin/login");
      }}
      className={cn(
        "flex w-full items-center rounded-md py-1.5 text-xs",
        collapsed ? "justify-center px-2" : "gap-2.5 px-3",
        "text-muted-foreground hover:bg-muted hover:text-destructive transition-colors",
      )}
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" />
      {!collapsed && "Sign out"}
    </button>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return btn;
}
