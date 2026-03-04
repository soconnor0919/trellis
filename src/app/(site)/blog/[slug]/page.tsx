import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { headers } from "next/headers";
import Link from "next/link";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import BlockRenderer from "~/components/BlockRenderer";
import type { Block } from "~/lib/blocks";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const ctx = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);
  const { isEnabled: isDraft } = await draftMode();

  const post = await caller.posts.getBySlug({ slug });

  if (!post) notFound();
  if (post.status !== "published" && !isDraft) notFound();

  let blocks: Block[] = [];
  try {
    const draft = (isDraft && post.draftLayout) ? JSON.parse(post.draftLayout) as Block[] : null;
    const live  = post.layout ? JSON.parse(post.layout) as Block[] : [];
    blocks = draft ?? live;
  } catch {
    blocks = [];
  }

  return (
    <>
      {/* Post hero */}
      <section className="bg-cream dark:bg-muted px-6 py-20">
        <div className="mx-auto max-w-3xl">
          {post.category && (
            <Link
              href="/blog"
              className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-olive hover:text-olive-dark transition-colors"
            >
              ← {post.category}
            </Link>
          )}
          {!post.category && (
            <Link
              href="/blog"
              className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-olive hover:text-olive-dark transition-colors"
            >
              ← All Posts
            </Link>
          )}
          <h1 className="font-serif text-4xl font-bold text-charcoal dark:text-foreground md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          {post.publishedAt && (
            <p className="mt-4 text-sm text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </section>

      {/* Cover image */}
      {post.coverImage && (
        <div className="px-6">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-72 w-full object-cover md:h-96"
            />
          </div>
        </div>
      )}

      {/* Block content */}
      {blocks.length > 0 && <BlockRenderer blocks={blocks} />}

      {/* Fallback if no content */}
      {blocks.length === 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground">Content coming soon.</p>
          </div>
        </section>
      )}

      {/* Back to blog */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl border-t pt-10">
          <Link
            href="/blog"
            className="text-sm font-medium text-olive hover:text-olive-dark transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </section>
    </>
  );
}
