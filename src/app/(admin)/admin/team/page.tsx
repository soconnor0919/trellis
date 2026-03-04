"use client";

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { PageHeader } from "~/components/admin/PageHeader";
import { PageContent } from "~/components/admin/PageContent";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, GripVertical, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type MemberForm = {
  id?: number;
  name: string;
  role: string;
  bio: string;
  order: number;
  isAffiliate: boolean;
};

type Member = {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  order: number;
  isAffiliate: boolean;
  imageUrl?: string | null;
};

const blank: MemberForm = { name: "", role: "", bio: "", order: 0, isAffiliate: false };

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3.5">
          <Skeleton className="h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex gap-1 shrink-0">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableMemberRow({
  member,
  onEdit,
  onDelete,
}: {
  member: Member;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3.5 hover:bg-muted/30 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-foreground">{member.name}</span>
          <span className="text-sm text-primary">{member.role}</span>
        </div>
        {member.bio && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{member.bio}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Sortable list ─────────────────────────────────────────────────────────────

function SortableList({
  items,
  onReorder,
  onEdit,
  onDelete,
}: {
  items: Member[];
  onReorder: (items: Member[]) => void;
  onEdit: (m: Member) => void;
  onDelete: (id: number, name: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((m) => m.id === active.id);
      const newIndex = items.findIndex((m) => m.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((m) => (
            <SortableMemberRow
              key={m.id}
              member={m}
              onEdit={() => onEdit(m)}
              onDelete={() => onDelete(m.id, m.name)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTeamPage() {
  const { data: members, refetch, isLoading } = api.team.getAll.useQuery();
  const upsert = api.team.upsert.useMutation({
    onSuccess: async () => {
      await refetch();
      setOpen(false);
      toast.success(form.id ? "Member updated" : "Member added");
    },
    onError: () => toast.error("Failed to save"),
  });
  const reorder = api.team.reorder.useMutation({
    onError: () => toast.error("Failed to save order"),
  });
  const del = api.team.delete.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Member removed");
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(blank);

  // Optimistic local state for drag-and-drop
  const [localBoard, setLocalBoard] = useState<Member[] | null>(null);
  const [localAffiliates, setLocalAffiliates] = useState<Member[] | null>(null);

  const board = localBoard ?? members?.filter((m) => !m.isAffiliate) ?? [];
  const affiliates = localAffiliates ?? members?.filter((m) => m.isAffiliate) ?? [];

  // Reset local state when server data arrives
  const prevMembersRef = { current: members };
  if (members !== prevMembersRef.current) {
    setLocalBoard(null);
    setLocalAffiliates(null);
  }

  const openNew = () => {
    setForm({ ...blank, order: (members?.length ?? 0) });
    setOpen(true);
  };
  const openEdit = (m: Member) => {
    setForm({ id: m.id, name: m.name, role: m.role, bio: m.bio ?? "", order: m.order, isAffiliate: m.isAffiliate });
    setOpen(true);
  };
  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    del.mutate({ id });
  };

  const handleReorder = useCallback((group: "board" | "affiliates", reordered: Member[]) => {
    if (group === "board") setLocalBoard(reordered);
    else setLocalAffiliates(reordered);

    // Persist new order
    reorder.mutate(reordered.map((m, i) => ({ id: m.id, order: i })));
  }, [reorder]);

  return (
    <PageContent header={
      <PageHeader
        title="Team Members"
        description="Manage the board and affiliates shown on the public Team page."
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Member</Button>}
      />
    }>

        {isLoading ? (
          <>
            <section className="space-y-4">
              <Skeleton className="h-3.5 w-20" />
              <ListSkeleton rows={3} />
            </section>
            <section className="space-y-4">
              <Skeleton className="h-3.5 w-16" />
              <ListSkeleton rows={2} />
            </section>
          </>
        ) : (
          <>
            {/* Board */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Board</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{board.length}</span>
              </div>
              {board.length === 0 ? (
                <EmptyState label="No board members yet." />
              ) : (
                <SortableList
                  items={board}
                  onReorder={(reordered) => handleReorder("board", reordered)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
            </section>

            {/* Affiliates */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Affiliates</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{affiliates.length}</span>
              </div>
              {affiliates.length === 0 ? (
                <EmptyState label="No affiliates yet." />
              ) : (
                <SortableList
                  items={affiliates}
                  onReorder={(reordered) => handleReorder("affiliates", reordered)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
            </section>
          </>
        )}

        {/* Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Member" : "Add Team Member"}</DialogTitle>
              <DialogDescription>This person will appear on the public Team page.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tm-name">Full Name *</Label>
                  <Input id="tm-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tm-role">Role / Title *</Label>
                  <Input id="tm-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="President" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tm-bio">Bio <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea id="tm-bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short sentence or two about this person…" className="resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tm-order">Display Order</Label>
                  <Input id="tm-order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isAffiliate} onChange={(e) => setForm({ ...form, isAffiliate: e.target.checked })} className="h-4 w-4 accent-primary" />
                    <span className="text-sm">Affiliate <span className="text-muted-foreground">(not board)</span></span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.name || !form.role}>
                {upsert.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </PageContent>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
