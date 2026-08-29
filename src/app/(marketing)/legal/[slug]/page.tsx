import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/marketing/sections";
import { legalDocuments, legalSlugs, type LegalSlug } from "@/content/legal";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const document = legalDocuments[slug as LegalSlug];
  if (!document) return { title: "Not found" };
  return { title: document.title, description: document.summary };
}

export default async function LegalPage({ params }: Params) {
  const { slug } = await params;
  const document = legalDocuments[slug as LegalSlug];
  if (!document) notFound();

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl">{document.title}</h1>
        <p className="mt-3 text-sm text-ink-500">Last updated {document.updated}</p>
        <p className="mt-4 text-lg text-ink-600">{document.summary}</p>
        <div className="prose-content mt-8">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
