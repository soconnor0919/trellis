import { draftMode } from "next/headers";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";
import BlockRenderer from "~/components/BlockRenderer";

export default async function AboutPage() {
  const ctx = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);
  const [{ layout, draftLayout }, { isEnabled: isDraft }] = await Promise.all([
    caller.layout.getPage({ page: "about" }),
    draftMode(),
  ]);
  const blocks = isDraft && draftLayout ? draftLayout : layout;
  return <BlockRenderer blocks={blocks} />;
}
