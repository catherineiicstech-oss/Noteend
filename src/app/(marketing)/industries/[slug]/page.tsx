import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { getIndustryBySlug } from "@/server/services/catalogue";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  if (!industry) return { title: "Industry not found" };
  return {
    title: industry.seoTitle ?? industry.name,
    description: industry.seoDescription ?? industry.summary,
  };
}

export default async function IndustryPage({ params }: Params) {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  if (!industry) notFound();

  return (
    <>
      <Section className="border-b border-ink-100 bg-ink-50">
        <h1 className="max-w-3xl text-4xl">{industry.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-600">{industry.summary}</p>
        <div className="mt-8">
          <ButtonLink href="/quote" size="lg">
            Request a quote
          </ButtonLink>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Common challenges" />
            <CardBody>
              <ul className="list-disc space-y-2 pl-5 text-sm text-ink-700">
                {industry.problems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="How we help" />
            <CardBody>
              <ul className="list-disc space-y-2 pl-5 text-sm text-ink-700">
                {industry.solutions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </Section>
    </>
  );
}
