import type { Metadata } from "next";
import { FeatureCard, Section, SectionHeading } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { listPublicCategories } from "@/server/services/catalogue";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Editing and proofreading, research and writing, business and technical documentation, publishing support and translation services.",
};

export default async function ServicesPage() {
  const categories = await listPublicCategories();

  return (
    <>
      <Section className="border-b border-ink-100 bg-ink-50">
        <SectionHeading
          eyebrow="Service catalogue"
          title="Choose the service that fits your document"
          description="Every service has a defined scope, turnaround range and configurable pricing. If your work does not fit neatly into one, ask for a custom quote."
        />
        <div className="mt-6">
          <ButtonLink href="/quote">Request a quote</ButtonLink>
        </div>
      </Section>

      {categories.map((category) => (
        <Section key={category.id} id={category.slug}>
          <SectionHeading title={category.name} description={category.summary} />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.services.map((service) => {
              const rule = service.pricingRules[0];
              return (
                <FeatureCard
                  key={service.id}
                  title={service.name}
                  description={service.summary}
                  href={`/services/${service.slug}`}
                  meta={
                    rule ? `From ${formatMoney(rule.minimumChargeMinor, rule.currency)}` : undefined
                  }
                />
              );
            })}
          </div>
        </Section>
      ))}
    </>
  );
}
