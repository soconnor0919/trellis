import Link from "next/link";
import { sanitizeRichText } from "~/lib/sanitize";
import type { Block, Bg, BlockButton } from "~/lib/blocks";

const BG_CLASS: Record<Bg, string> = {
  white: "bg-background",
  cream: "bg-cream dark:bg-muted",
  stone: "bg-stone dark:bg-card",
  olive: "bg-olive text-white",
};

function sectionCls(bg: Bg, extra = "px-6 py-20") {
  return [BG_CLASS[bg], extra].filter(Boolean).join(" ");
}

function ButtonGroup({ buttons, bg }: { buttons: BlockButton[]; bg: Bg }) {
  if (!buttons.length) return null;
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      {buttons.map((btn, i) => {
        const isOliveBg = bg === "olive";
        if (btn.variant === "primary") {
          return (
            <Link
              key={i}
              href={btn.href}
              className={`rounded-full px-8 py-3 font-medium transition-colors ${
                isOliveBg
                  ? "bg-white text-olive hover:bg-stone"
                  : "bg-olive text-white hover:bg-olive-dark"
              }`}
            >
              {btn.label}
            </Link>
          );
        }
        return (
          <Link
            key={i}
            href={btn.href}
            className={`rounded-full border-2 px-8 py-3 font-medium transition-colors ${
              isOliveBg
                ? "border-white text-white hover:bg-white hover:text-olive"
                : "border-olive text-olive hover:bg-olive hover:text-white"
            }`}
          >
            {btn.label}
          </Link>
        );
      })}
    </div>
  );
}

function HeroBlock({ block }: { block: Extract<Block, { type: "hero" }> }) {
  return (
    <section className={sectionCls(block.bg, "px-6 py-24 text-center")}>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-5xl font-bold leading-tight text-charcoal dark:text-foreground md:text-6xl">
          {block.title}
        </h1>
        {block.body && (
          <div
            className="mt-6 text-lg leading-relaxed prose prose-gray dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.body) }}
          />
        )}
        <ButtonGroup buttons={block.buttons} bg={block.bg} />
      </div>
    </section>
  );
}

function RichtextBlock({ block }: { block: Extract<Block, { type: "richtext" }> }) {
  return (
    <section className={sectionCls(block.bg)}>
      <div className="mx-auto max-w-3xl">
        {block.heading && (
          <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-foreground">{block.heading}</h2>
        )}
        {block.body && (
          <div
            className={`leading-relaxed prose prose-gray dark:prose-invert max-w-none ${block.heading ? "mt-4" : ""}`}
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.body) }}
          />
        )}
      </div>
    </section>
  );
}

function TwoColBlock({ block }: { block: Extract<Block, { type: "twocol" }> }) {
  return (
    <section className={sectionCls(block.bg)}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {[block.left, block.right].map((col, i) => (
            <div key={i}>
              {col.heading && (
                <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-foreground">{col.heading}</h2>
              )}
              {col.body && (
                <div
                  className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400 prose prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(col.body) }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ block }: { block: Extract<Block, { type: "cta" }> }) {
  return (
    <section className={sectionCls(block.bg, "px-6 py-16 text-center")}>
      <div className="mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-foreground">{block.title}</h2>
        {block.body && (
          <div
            className="mt-4 leading-relaxed prose prose-gray dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.body) }}
          />
        )}
        <ButtonGroup buttons={block.buttons} bg={block.bg} />
      </div>
    </section>
  );
}

function StatsBlock({ block }: { block: Extract<Block, { type: "stats" }> }) {
  return (
    <section className={sectionCls(block.bg, "px-6 py-16")}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          {block.items.map((item, i) => (
            <div key={i}>
              <div className="font-serif text-5xl font-bold">{item.stat}</div>
              <div className="mt-2 text-sm uppercase tracking-widest opacity-75">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ListBlock({ block }: { block: Extract<Block, { type: "list" }> }) {
  return (
    <section className={sectionCls(block.bg)}>
      <div className="mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-foreground">{block.heading}</h2>
        {block.intro && (
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{block.intro}</p>
        )}
        <ul className="mt-6 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-olive" />
              <span className="text-gray-600 dark:text-gray-400">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CardsBlock({ block }: { block: Extract<Block, { type: "cards" }> }) {
  return (
    <section className={sectionCls(block.bg)}>
      <div className="mx-auto max-w-6xl">
        {block.heading && (
          <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-foreground text-center mb-12">
            {block.heading}
          </h2>
        )}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {block.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-stone dark:border-border bg-background p-6">
              <h3 className="font-serif text-lg font-bold text-charcoal dark:text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TiersBlock({ block }: { block: Extract<Block, { type: "tiers" }> }) {
  return (
    <section className={sectionCls(block.bg)}>
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-foreground text-center mb-4">
          {block.heading}
        </h2>
        {block.intro && (
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">{block.intro}</p>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {block.items.map((tier, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 ${
                tier.highlight
                  ? "bg-olive text-white shadow-lg"
                  : "bg-background border border-stone dark:border-border"
              }`}
            >
              <div className={`text-sm font-semibold uppercase tracking-wider ${tier.highlight ? "text-olive-light" : "text-olive"}`}>
                {tier.name}
              </div>
              <div className={`mt-2 font-serif text-3xl font-bold ${tier.highlight ? "text-white" : "text-charcoal dark:text-foreground"}`}>
                {tier.amount}
              </div>
              <p className={`mt-3 text-sm leading-relaxed ${tier.highlight ? "text-white/80" : "text-gray-600 dark:text-gray-400"}`}>
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":     return <HeroBlock     key={block.id} block={block} />;
          case "richtext": return <RichtextBlock key={block.id} block={block} />;
          case "twocol":   return <TwoColBlock   key={block.id} block={block} />;
          case "cta":      return <CtaBlock      key={block.id} block={block} />;
          case "stats":    return <StatsBlock    key={block.id} block={block} />;
          case "list":     return <ListBlock     key={block.id} block={block} />;
          case "cards":    return <CardsBlock    key={block.id} block={block} />;
          case "tiers":    return <TiersBlock    key={block.id} block={block} />;
          case "image":    return <ImageBlock    key={block.id} block={block} />;
        }
      })}
    </>
  );
}

function ImageBlock({ block }: { block: Extract<Block, { type: "image" }> }) {
  if (!block.src) return null;
  const maxW = block.width === "narrow" ? "max-w-2xl" : block.width === "full" ? "w-full" : "max-w-4xl";
  return (
    <section className={sectionCls(block.bg, "px-6 py-12")}>
      <div className={`mx-auto ${maxW}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.src} alt={block.alt} className="w-full rounded-lg" />
        {block.caption && (
          <p className="mt-3 text-center text-sm text-muted-foreground">{block.caption}</p>
        )}
      </div>
    </section>
  );
}
