import type { Metadata } from "next";
import { FeatureCard, Section, SectionHeading } from "@/components/marketing/sections";
import { listIndustries } from "@/server/services/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Sector-specific writing, research, editing and documentation support for NGOs, government, universities, law firms, healthcare and business.",
};

export default async function IndustriesPage() {
  const industries = await listIndustries();

  return (
    <Section>
      <SectionHeading
        eyebrow="Industries"
        title="Support shaped around your sector"
        description="Different sectors have different reporting standards, tone and citation expectations. We match the conventions your readers expect."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry) => (
          <FeatureCard
            key={industry.id}
            title={industry.name}
            description={industry.summary}
            href={`/industries/${industry.slug}`}
          />
        ))}
      </div>
    </Section>
  );
}
