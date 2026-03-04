"use client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, MailOpen, CheckCheck, Trash2 } from "lucide-react";
import { PageHeader } from "~/components/admin/PageHeader";
import { PageContent } from "~/components/admin/PageContent";

function MessagesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-44" />
              </div>
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
            <Skeleton className="h-3 w-48 mt-1.5 ml-7" />
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-4/5 mb-2" />
            <Skeleton className="h-3 w-3/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminMessagesPage() {
  const { data: messages, refetch, isLoading } = api.contact.getAll.useQuery();
  const markRead = api.contact.markRead.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Marked as read");
    },
  });
  const deleteMsg = api.contact.delete.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Message deleted");
    },
  });

  const unread = messages?.filter((m) => !m.read).length ?? 0;

  return (
    <PageContent header={
      <PageHeader
        title="Messages"
        description="Contact form submissions from visitors."
        actions={unread > 0 ? <Badge>{unread} new</Badge> : undefined}
      />
    }>

      {isLoading ? (
        <MessagesSkeleton />
      ) : messages?.length === 0 ? (
        <div className="rounded-xl border border-dashed py-24 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-base font-medium text-muted-foreground">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Messages from your contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages?.map((msg) => (
            <Card
              key={msg.id}
              className={`transition-opacity ${msg.read ? "opacity-50" : "border-primary/30 shadow-sm"}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    {msg.read
                      ? <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <Mail className="h-4 w-4 text-primary shrink-0" />
                    }
                    <span className="font-semibold text-foreground">{msg.name}</span>
                    {!msg.read && <Badge className="text-xs px-2 py-0">New</Badge>}
                    <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">
                      {msg.email}
                    </a>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : ""}
                  </time>
                </div>
                {msg.subject && (
                  <p className="mt-1 text-sm font-medium text-muted-foreground pl-[26px]">{msg.subject}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    {!msg.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate({ id: msg.id })}
                        disabled={markRead.isPending}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm(`Delete message from ${msg.name}?`)) deleteMsg.mutate({ id: msg.id }); }}
                    disabled={deleteMsg.isPending}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContent>
  );
}
