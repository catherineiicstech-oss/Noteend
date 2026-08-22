import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Section } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { getArticleBySlug } from "@/server/services/catalogue";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-600">
          {article.type.replace(/_/g, " ").toLowerCase()}
        </p>
        <h1 className="mt-3 text-4xl">{article.title}</h1>
        <p className="mt-3 text-sm text-ink-500">
          {article.author?.name ? `${article.author.name} · ` : ""}
          {article.publishedAt ? format(article.publishedAt, "d MMMM yyyy") : "Draft"}
        </p>
        <div className="prose-content mt-8">
          {article.body.split("\n\n").map((paragraph) =>
            paragraph.startsWith("## ") ? (
              <h2 key={paragraph}>{paragraph.replace("## ", "")}</h2>
            ) : (
              <p key={paragraph}>{paragraph}</p>
            ),
          )}
        </div>
        <div className="mt-10 rounded-xl border border-ink-100 bg-ink-50 p-6">
          <p className="font-medium text-ink-900">Need help with a document like this?</p>
          <p className="mt-1 text-sm text-ink-600">
            Send us the brief and we will respond with a written quotation.
          </p>
          <ButtonLink href="/quote" className="mt-4">
            Request a quote
          </ButtonLink>
        </div>
      </article>
    </Section>
  );
}
