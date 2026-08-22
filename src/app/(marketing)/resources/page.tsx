import type { Metadata } from "next";
import { FeatureCard, Section, SectionHeading } from "@/components/marketing/sections";
import { EmptyState } from "@/components/ui";
import { listArticles } from "@/server/services/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resource centre",
  description:
    "Guides, templates and checklists on academic writing, referencing, proposals, reports and documentation standards.",
};

export default async function ResourcesPage() {
  const articles = await listArticles();

  return (
    <Section>
      <SectionHeading
        eyebrow="Resource centre"
        title="Writing and documentation guides"
        description="Practical guidance written by our editorial team."
      />
      <div className="mt-10">
        {articles.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <FeatureCard
                key={article.id}
                title={article.title}
                description={article.excerpt}
                href={`/resources/${article.slug}`}
                meta={article.type.replace(/_/g, " ").toLowerCase()}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No articles published yet"
            description="Guides and templates will appear here as our editorial team publishes them."
          />
        )}
      </div>
    </Section>
  );
}
