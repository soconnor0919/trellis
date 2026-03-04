"use client";

import { useState } from "react";
import { Trash2, Plus, X, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import RichTextEditor from "~/components/admin/RichTextEditor";
import ImageUpload from "~/components/admin/ImageUpload";
import type { Block, Bg, BlockType, BlockButton } from "~/lib/blocks";
import { BLOCK_TYPE_LABELS, BG_LABELS, defaultBlock } from "~/lib/blocks";
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

// ─── Block type metadata ───────────────────────────────────────────────────────

const BLOCK_META: Record<BlockType, {
  description: string;
  preview: React.ReactNode;
}> = {
  hero: {
    description: "Full-width banner with title, body text, and call-to-action buttons.",
    preview: (
      <div className="w-full rounded bg-amber-50 border border-amber-100 px-3 py-2.5 space-y-1">
        <div className="h-2.5 w-3/4 rounded bg-amber-300/60" />
        <div className="h-1.5 w-full rounded bg-amber-200/60" />
        <div className="h-1.5 w-2/3 rounded bg-amber-200/60" />
        <div className="flex gap-1.5 mt-1.5">
          <div className="h-4 w-12 rounded bg-amber-500/40" />
          <div className="h-4 w-12 rounded border border-amber-400/40" />
        </div>
      </div>
    ),
  },
  richtext: {
    description: "Optional heading with rich body text. Good for paragraphs and prose.",
    preview: (
      <div className="w-full rounded bg-white border px-3 py-2.5 space-y-1">
        <div className="h-2 w-1/2 rounded bg-gray-300/70" />
        <div className="h-1.5 w-full rounded bg-gray-200/80" />
        <div className="h-1.5 w-full rounded bg-gray-200/80" />
        <div className="h-1.5 w-3/4 rounded bg-gray-200/80" />
      </div>
    ),
  },
  twocol: {
    description: "Two equal columns side by side, each with a heading and body.",
    preview: (
      <div className="w-full rounded bg-white border px-3 py-2.5 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-2 w-3/4 rounded bg-gray-300/70" />
            <div className="h-1.5 w-full rounded bg-gray-200/80" />
            <div className="h-1.5 w-5/6 rounded bg-gray-200/80" />
          </div>
        ))}
      </div>
    ),
  },
  cta: {
    description: "Centered call-to-action with title, supporting text, and buttons.",
    preview: (
      <div className="w-full rounded bg-white border px-3 py-2.5 flex flex-col items-center space-y-1">
        <div className="h-2.5 w-1/2 rounded bg-gray-300/70" />
        <div className="h-1.5 w-3/4 rounded bg-gray-200/80" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-4 w-14 rounded bg-[#8a7d55]/40" />
        </div>
      </div>
    ),
  },
  stats: {
    description: "Row of big stat numbers with labels — metrics, outcomes, key figures.",
    preview: (
      <div className="w-full rounded bg-[#8a7d55]/15 border border-[#8a7d55]/20 px-3 py-2.5 flex gap-4">
        {["12", "94%", "3×"].map((s) => (
          <div key={s} className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold text-[#8a7d55]/80">{s}</span>
            <div className="h-1 w-8 rounded bg-[#8a7d55]/30" />
          </div>
        ))}
      </div>
    ),
  },
  list: {
    description: "Heading with an optional intro and a bulleted list of items.",
    preview: (
      <div className="w-full rounded bg-white border px-3 py-2.5 space-y-1.5">
        <div className="h-2 w-1/2 rounded bg-gray-300/70" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#8a7d55]/50 shrink-0" />
            <div className="h-1.5 flex-1 rounded bg-gray-200/80" />
          </div>
        ))}
      </div>
    ),
  },
  cards: {
    description: "A grid of cards, each with a title and body. Great for features or team highlights.",
    preview: (
      <div className="w-full rounded bg-white border px-3 py-2.5 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded border p-1.5 space-y-1">
            <div className="h-1.5 w-full rounded bg-gray-300/70" />
            <div className="h-1 w-full rounded bg-gray-200/80" />
            <div className="h-1 w-2/3 rounded bg-gray-200/80" />
          </div>
        ))}
      </div>
    ),
  },
  tiers: {
    description: "Pricing or funding tiers — name, amount, description, with one highlighted.",
    preview: (
      <div className="w-full rounded bg-stone-100 border px-3 py-2.5 grid grid-cols-3 gap-2">
        {[false, true, false].map((hi, i) => (
          <div key={i} className={`rounded border p-1.5 space-y-1 ${hi ? "border-[#8a7d55]/50 bg-[#8a7d55]/10" : ""}`}>
            <div className="h-1.5 w-3/4 rounded bg-gray-300/70" />
            <div className="h-2 w-1/2 rounded bg-gray-400/50 font-bold" />
            <div className="h-1 w-full rounded bg-gray-200/80" />
          </div>
        ))}
      </div>
    ),
  },
  image: {
    description: "A standalone image with optional alt text and caption.",
    preview: (
      <div className="w-full rounded bg-white border px-3 py-2 flex flex-col items-center gap-1.5">
        <div className="w-full h-10 rounded bg-gray-200/80 flex items-center justify-center">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="h-1.5 w-1/2 rounded bg-gray-200/80" />
      </div>
    ),
  },
};

// ─── Bg selector ──────────────────────────────────────────────────────────────

const BG_DOT_CLS: Record<Bg, string> = {
  white: "bg-white border border-gray-300",
  cream: "bg-amber-50 border border-amber-200",
  stone: "bg-stone-200 border border-stone-300",
  olive: "bg-olive",
};

function BgSelector({ value, onChange }: { value: Bg; onChange: (bg: Bg) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Background:</span>
      {(Object.keys(BG_DOT_CLS) as Bg[]).map((bg) => (
        <button
          key={bg}
          type="button"
          title={BG_LABELS[bg]}
          onClick={() => onChange(bg)}
          className={`h-4 w-4 rounded-full transition-all ${BG_DOT_CLS[bg]} ${
            value === bg
              ? "ring-2 ring-primary ring-offset-1"
              : "hover:ring-1 hover:ring-muted-foreground"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground">{BG_LABELS[value]}</span>
    </div>
  );
}

// ─── Preview text ─────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").slice(0, 80);
}

function previewText(block: Block): string {
  switch (block.type) {
    case "hero":     return block.title || "(no title)";
    case "richtext": return block.heading || stripHtml(block.body) || "(empty)";
    case "twocol":   return [block.left.heading, block.right.heading].filter(Boolean).join(" / ") || "(empty)";
    case "cta":      return block.title || "(no title)";
    case "stats":    return block.items.map((i) => i.stat).filter(Boolean).join(" · ") || "(no stats)";
    case "list":     return block.heading || "(no heading)";
    case "cards":    return block.heading || block.items[0]?.title || "(empty)";
    case "tiers":    return block.heading || "(no heading)";
    case "image":    return block.alt || block.src || "(no image)";
  }
}

// ─── Button list editor ────────────────────────────────────────────────────────

function ButtonListEditor({ buttons, onChange }: { buttons: BlockButton[]; onChange: (b: BlockButton[]) => void }) {
  function update(i: number, patch: Partial<BlockButton>) {
    onChange(buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs">Buttons</Label>
      {buttons.map((btn, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={btn.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" className="h-7 text-xs" />
          <Input value={btn.href} onChange={(e) => update(i, { href: e.target.value })} placeholder="/href" className="h-7 text-xs" />
          <select
            value={btn.variant}
            onChange={(e) => update(i, { variant: e.target.value as BlockButton["variant"] })}
            className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
          >
            <option value="primary">Primary</option>
            <option value="outline">Outline</option>
          </select>
          <button type="button" onClick={() => onChange(buttons.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onChange([...buttons, { label: "", href: "/", variant: "primary" }])}>
        <Plus className="mr-1 h-3 w-3" /> Add Button
      </Button>
    </div>
  );
}

// ─── Per-type editors ──────────────────────────────────────────────────────────

function HeroEditor({ block, onChange }: { block: Extract<Block, { type: "hero" }>; onChange: (b: Extract<Block, { type: "hero" }>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Body</Label>
        <RichTextEditor className="mt-1" value={block.body} onChange={(html) => onChange({ ...block, body: html })} />
      </div>
      <ButtonListEditor buttons={block.buttons} onChange={(buttons) => onChange({ ...block, buttons })} />
    </div>
  );
}

function RichtextEditor({ block, onChange }: { block: Extract<Block, { type: "richtext" }>; onChange: (b: Extract<Block, { type: "richtext" }>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Heading (optional)</Label>
        <Input value={block.heading ?? ""} onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })} className="mt-1" placeholder="Leave blank for no heading" />
      </div>
      <div>
        <Label className="text-xs">Body</Label>
        <RichTextEditor className="mt-1" value={block.body} onChange={(html) => onChange({ ...block, body: html })} />
      </div>
    </div>
  );
}

function TwoColEditor({ block, onChange }: { block: Extract<Block, { type: "twocol" }>; onChange: (b: Extract<Block, { type: "twocol" }>) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {(["left", "right"] as const).map((side) => (
        <div key={side} className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{side} column</p>
          <div>
            <Label className="text-xs">Heading</Label>
            <Input value={block[side].heading} onChange={(e) => onChange({ ...block, [side]: { ...block[side], heading: e.target.value } })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <RichTextEditor className="mt-1" value={block[side].body} onChange={(html) => onChange({ ...block, [side]: { ...block[side], body: html } })} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CtaEditor({ block, onChange }: { block: Extract<Block, { type: "cta" }>; onChange: (b: Extract<Block, { type: "cta" }>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Body</Label>
        <RichTextEditor className="mt-1" value={block.body} onChange={(html) => onChange({ ...block, body: html })} />
      </div>
      <ButtonListEditor buttons={block.buttons} onChange={(buttons) => onChange({ ...block, buttons })} />
    </div>
  );
}

function StatsEditor({ block, onChange }: { block: Extract<Block, { type: "stats" }>; onChange: (b: Extract<Block, { type: "stats" }>) => void }) {
  function updateItem(i: number, patch: Partial<{ stat: string; label: string }>) {
    onChange({ ...block, items: block.items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs">Stat items</Label>
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={item.stat} onChange={(e) => updateItem(i, { stat: e.target.value })} placeholder="12–15" className="h-7 w-24 text-xs font-bold" />
          <Input value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} placeholder="months to graduation" className="h-7 flex-1 text-xs" />
          <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onChange({ ...block, items: [...block.items, { stat: "", label: "" }] })}>
        <Plus className="mr-1 h-3 w-3" /> Add stat
      </Button>
    </div>
  );
}

function ListEditor({ block, onChange }: { block: Extract<Block, { type: "list" }>; onChange: (b: Extract<Block, { type: "list" }>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Heading</Label>
        <Input value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Intro (optional)</Label>
        <Input value={block.intro ?? ""} onChange={(e) => onChange({ ...block, intro: e.target.value || undefined })} className="mt-1" placeholder="Leave blank to omit" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Items</Label>
        {block.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item} onChange={(e) => onChange({ ...block, items: block.items.map((x, idx) => (idx === i ? e.target.value : x)) })} className="h-7 text-xs" />
            <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onChange({ ...block, items: [...block.items, ""] })}>
          <Plus className="mr-1 h-3 w-3" /> Add item
        </Button>
      </div>
    </div>
  );
}

function CardsEditor({ block, onChange }: { block: Extract<Block, { type: "cards" }>; onChange: (b: Extract<Block, { type: "cards" }>) => void }) {
  function updateItem(i: number, patch: Partial<{ title: string; body: string }>) {
    onChange({ ...block, items: block.items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  }
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Section heading (optional)</Label>
        <Input value={block.heading ?? ""} onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })} className="mt-1" placeholder="Leave blank to omit" />
      </div>
      <div className="space-y-3">
        <Label className="text-xs">Cards</Label>
        {block.items.map((item, i) => (
          <div key={i} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Card {i + 1}</span>
              <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Input value={item.title} onChange={(e) => updateItem(i, { title: e.target.value })} placeholder="Card title" className="h-7 text-xs" />
            <Input value={item.body} onChange={(e) => updateItem(i, { body: e.target.value })} placeholder="Card body text" className="h-7 text-xs" />
          </div>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onChange({ ...block, items: [...block.items, { title: "", body: "" }] })}>
          <Plus className="mr-1 h-3 w-3" /> Add card
        </Button>
      </div>
    </div>
  );
}

function TiersEditor({ block, onChange }: { block: Extract<Block, { type: "tiers" }>; onChange: (b: Extract<Block, { type: "tiers" }>) => void }) {
  function updateItem(i: number, patch: Partial<{ name: string; amount: string; description: string; highlight?: boolean }>) {
    onChange({ ...block, items: block.items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  }
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Section heading</Label>
        <Input value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Intro (optional)</Label>
        <Input value={block.intro ?? ""} onChange={(e) => onChange({ ...block, intro: e.target.value || undefined })} className="mt-1" placeholder="Leave blank to omit" />
      </div>
      <div className="space-y-3">
        <Label className="text-xs">Tiers</Label>
        {block.items.map((tier, i) => (
          <div key={i} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tier {i + 1}</span>
              <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <Input value={tier.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="Tier name" className="h-7 text-xs flex-1" />
              <Input value={tier.amount} onChange={(e) => updateItem(i, { amount: e.target.value })} placeholder="$75,000" className="h-7 w-28 text-xs" />
            </div>
            <Input value={tier.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="What this tier funds…" className="h-7 text-xs" />
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={tier.highlight ?? false} onChange={(e) => updateItem(i, { highlight: e.target.checked })} className="rounded" />
              Highlight (featured tier — olive background)
            </label>
          </div>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onChange({ ...block, items: [...block.items, { name: "", amount: "", description: "" }] })}>
          <Plus className="mr-1 h-3 w-3" /> Add tier
        </Button>
      </div>
    </div>
  );
}

function ImageEditor({ block, onChange }: { block: Extract<Block, { type: "image" }>; onChange: (b: Extract<Block, { type: "image" }>) => void }) {
  return (
    <div className="space-y-3 p-3">
      <BgSelector value={block.bg} onChange={(bg) => onChange({ ...block, bg })} />
      <div>
        <Label className="text-xs">Image</Label>
        <ImageUpload value={block.src} onChange={(src) => onChange({ ...block, src })} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Alt Text</Label>
        <Input value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} className="mt-1 h-7 text-xs" placeholder="Describe the image" />
      </div>
      <div>
        <Label className="text-xs">Caption (optional)</Label>
        <Input value={block.caption ?? ""} onChange={(e) => onChange({ ...block, caption: e.target.value })} className="mt-1 h-7 text-xs" />
      </div>
      <div>
        <Label className="text-xs">Width</Label>
        <select
          value={block.width ?? "wide"}
          onChange={(e) => onChange({ ...block, width: e.target.value as "narrow" | "wide" | "full" })}
          className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-xs"
        >
          <option value="narrow">Narrow (max 640px)</option>
          <option value="wide">Wide (max 900px)</option>
          <option value="full">Full width</option>
        </select>
      </div>
    </div>
  );
}

// ─── Block row (sortable) ──────────────────────────────────────────────────────

function BlockRow({
  block,
  isFirst: _isFirst,
  isLast: _isLast,
  onUpdate,
  onDelete,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (b: Block) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  function renderEditor() {
    switch (block.type) {
      case "hero":     return <HeroEditor     block={block} onChange={onUpdate} />;
      case "richtext": return <RichtextEditor block={block} onChange={onUpdate} />;
      case "twocol":   return <TwoColEditor   block={block} onChange={onUpdate} />;
      case "cta":      return <CtaEditor      block={block} onChange={onUpdate} />;
      case "stats":    return <StatsEditor    block={block} onChange={onUpdate} />;
      case "list":     return <ListEditor     block={block} onChange={onUpdate} />;
      case "cards":    return <CardsEditor    block={block} onChange={onUpdate} />;
      case "tiers":    return <TiersEditor    block={block} onChange={onUpdate} />;
      case "image":    return <ImageEditor    block={block} onChange={onUpdate} />;
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <button
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder block"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className={`h-3.5 w-3.5 rounded-full flex-shrink-0 ${BG_DOT_CLS[block.bg]}`} title={`Background: ${BG_LABELS[block.bg]}`} />
        <Badge variant="outline" className="text-xs font-mono shrink-0 px-1.5 py-0">{BLOCK_TYPE_LABELS[block.type]}</Badge>
        <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">{previewText(block)}</span>

        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { if (confirm("Delete this block?")) onDelete(); }}
            className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {open && (
        <div className="border-t px-3 py-4 space-y-4">
          <BgSelector value={block.bg} onChange={(bg) => onUpdate({ ...block, bg } as Block)} />
          {renderEditor()}
        </div>
      )}
    </div>
  );
}

// ─── Block picker dialog ───────────────────────────────────────────────────────

const BLOCK_TYPE_ORDER: BlockType[] = [
  "hero", "richtext", "twocol", "cta", "stats", "list", "cards", "tiers", "image",
];

function BlockPickerDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: BlockType) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a Block</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 pb-2">
          {BLOCK_TYPE_ORDER.map((type) => {
            const meta = BLOCK_META[type];
            return (
              <button
                key={type}
                onClick={() => { onAdd(type); onClose(); }}
                className="group flex flex-col gap-2.5 rounded-xl border border-border bg-background p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {/* Visual preview */}
                <div className="w-full overflow-hidden rounded-md border border-border/60 bg-muted/20">
                  {meta.preview}
                </div>
                {/* Name + description */}
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {BLOCK_TYPE_LABELS[type]}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(id: string, newBlock: Block) {
    onChange(blocks.map((b) => (b.id === id ? newBlock : b)));
  }
  function remove(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onChange(arrayMove(blocks, oldIndex, newIndex));
  }
  function addBlock(type: BlockType) {
    const id = crypto.randomUUID();
    onChange([...blocks, defaultBlock(type, id)]);
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map((block, i) => (
              <BlockRow
                key={block.id}
                block={block}
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
                onUpdate={(b) => update(block.id, b)}
                onDelete={() => remove(block.id)}
              />
            ))}
          </div>
        </SortableContext>

        <Button
          variant="outline"
          className="w-full border-dashed text-muted-foreground hover:text-foreground mt-2"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Block
        </Button>
      </DndContext>

      <BlockPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addBlock}
      />
    </>
  );
}
