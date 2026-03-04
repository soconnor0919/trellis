export type Bg = "white" | "cream" | "stone" | "olive";
export type ButtonVariant = "primary" | "outline";

export type BlockButton = {
  label: string;
  href: string;
  variant: ButtonVariant;
};

export type ImageWidth = "narrow" | "wide" | "full";

export type Block =
  | {
      id: string;
      type: "image";
      bg: Bg;
      src: string;
      alt: string;
      caption?: string;
      width?: ImageWidth;
    }
  | {
      id: string;
      type: "hero";
      bg: Bg;
      title: string;
      body: string;
      buttons: BlockButton[];
    }
  | {
      id: string;
      type: "richtext";
      bg: Bg;
      heading?: string;
      body: string;
    }
  | {
      id: string;
      type: "twocol";
      bg: Bg;
      left: { heading: string; body: string };
      right: { heading: string; body: string };
    }
  | {
      id: string;
      type: "cta";
      bg: Bg;
      title: string;
      body: string;
      buttons: BlockButton[];
    }
  | {
      id: string;
      type: "stats";
      bg: Bg;
      items: { stat: string; label: string }[];
    }
  | {
      id: string;
      type: "list";
      bg: Bg;
      heading: string;
      intro?: string;
      items: string[];
    }
  | {
      id: string;
      type: "cards";
      bg: Bg;
      heading?: string;
      items: { title: string; body: string }[];
    }
  | {
      id: string;
      type: "tiers";
      bg: Bg;
      heading: string;
      intro?: string;
      items: { name: string; amount: string; description: string; highlight?: boolean }[];
    };

export type BlockType = Block["type"];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  hero:     "Hero",
  richtext: "Text",
  twocol:   "Two Columns",
  cta:      "Call to Action",
  stats:    "Stats",
  list:     "List",
  cards:    "Cards",
  tiers:    "Tiers",
  image:    "Image",
};

export const BG_LABELS: Record<Bg, string> = {
  white:  "White",
  cream:  "Cream",
  stone:  "Stone",
  olive:  "Olive",
};

/** Sensible blank defaults when adding a new block. */
export function defaultBlock(type: BlockType, id: string): Block {
  switch (type) {
    case "hero":
      return { id, type, bg: "cream", title: "New Hero", body: "", buttons: [] };
    case "richtext":
      return { id, type, bg: "white", heading: "", body: "" };
    case "twocol":
      return { id, type, bg: "white", left: { heading: "Left Column", body: "" }, right: { heading: "Right Column", body: "" } };
    case "cta":
      return { id, type, bg: "white", title: "Call to Action", body: "", buttons: [] };
    case "stats":
      return { id, type, bg: "olive", items: [{ stat: "", label: "" }] };
    case "list":
      return { id, type, bg: "white", heading: "List", intro: "", items: [""] };
    case "cards":
      return { id, type, bg: "white", heading: "", items: [{ title: "", body: "" }] };
    case "tiers":
      return { id, type, bg: "stone", heading: "Funding Goals", intro: "", items: [{ name: "", amount: "", description: "" }] };
    case "image":
      return { id, type, bg: "white", src: "", alt: "", caption: "", width: "wide" };
  }
}
