import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Section } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { getServiceBySlug } from "@/server/services/catalogue";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return { title: service.name, description: service.summary };
}

export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const rule = service.pricingRules[0];

  return (
    <>
      <Section className="border-b border-ink-100 bg-ink-50">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-600">
          <Link href={`/services#${service.category.slug}`}>{service.category.name}</Link>
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl">{service.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-600">{service.summary}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={`/quote?service=${service.slug}`} size="lg">
            Request a quote
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="outline">
            Ask a question
          </ButtonLink>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="prose-content max-w-none">
            <h2 className="text-2xl">What this service covers</h2>
            {service.description.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            {service.deliverables.length ? (
              <>
                <h3 className="text-xl">What you receive</h3>
                <ul className="mt-4 space-y-2 pl-0">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex list-none gap-2">
                      <Check className="mt-0.5 shrink-0 text-accent-600" size={18} aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <div className="space-y-5">
            {rule ? (
              <Card>
                <CardHeader title="Indicative pricing" description="Confirmed in your quotation" />
                <CardBody className="space-y-2 text-sm text-ink-700">
                  <p className="flex justify-between">
                    <span>Per word</span>
                    <span className="font-medium">
                      {formatMoney(rule.baseRatePerWordMinor, rule.currency)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Minimum charge</span>
                    <span className="font-medium">
                      {formatMoney(rule.minimumChargeMinor, rule.currency)}
                    </span>
                  </p>
                  {rule.rushMultipliers.length ? (
                    <p className="flex justify-between">
                      <span>Rush surcharge</span>
                      <span className="font-medium">
                        up to{" "}
                        {Math.round(
                          Math.max(...rule.rushMultipliers.map((m) => m.multiplierBps)) / 100 - 100,
                        )}
                        %
                      </span>
                    </p>
                  ) : null}
                  <p className="pt-2 text-xs text-ink-500">
                    Final pricing depends on word count, complexity, deadline and formatting
                    requirements. Every quotation is reviewed by our team before it is sent.
                  </p>
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Turnaround" />
              <CardBody className="text-sm text-ink-700">
                <p>
                  Standard turnaround is agreed in your quotation. Rush delivery is available and
                  priced automatically from your deadline.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
