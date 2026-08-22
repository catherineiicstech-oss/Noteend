import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Card, CardBody, CardHeader, Table, Td, Th } from "@/components/ui";
import { listPlans, listPublicServices } from "@/server/services/catalogue";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent, configurable pricing based on word count, complexity and turnaround, plus monthly plans for organisations.",
};

export default async function PricingPage() {
  const [services, plans] = await Promise.all([listPublicServices(), listPlans()]);
  const priced = services.filter((service) => service.pricingRules.length > 0);

  return (
    <>
      <Section className="border-b border-ink-100 bg-ink-50">
        <SectionHeading
          eyebrow="Pricing"
          title="Priced on word count, complexity and deadline"
          description="Use the quote wizard for an instant estimate. Every binding quotation is reviewed and confirmed by our team before you are asked to pay."
        />
        <div className="mt-6">
          <ButtonLink href="/quote">Get an estimate</ButtonLink>
        </div>
      </Section>

      <Section>
        <SectionHeading title="Per-service rates" />
        <Card className="mt-8">
          <Table>
            <thead>
              <tr>
                <Th>Service</Th>
                <Th>Per word</Th>
                <Th>Minimum charge</Th>
              </tr>
            </thead>
            <tbody>
              {priced.map((service) => {
                const rule = service.pricingRules[0];
                return (
                  <tr key={service.id}>
                    <Td>
                      <span className="font-medium text-ink-900">{service.name}</span>
                      <span className="block text-xs text-ink-500">{service.category.name}</span>
                    </Td>
                    <Td>{formatMoney(rule.baseRatePerWordMinor, rule.currency)}</Td>
                    <Td>{formatMoney(rule.minimumChargeMinor, rule.currency)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
        <div className="mt-6 max-w-3xl">
          <Alert>
            Complexity and rush multipliers, formatting and research fees and tax are applied on top
            of the base rate. All of these are configured by our administrators, so the figures
            above always reflect current pricing.
          </Alert>
        </div>
      </Section>

      {plans.length ? (
        <Section className="bg-ink-50">
          <SectionHeading
            title="Monthly plans for organisations"
            description="For teams with recurring documentation needs. Plans are activated by our team after a short onboarding call."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader title={plan.name} description={plan.tagline} />
                <CardBody className="flex flex-1 flex-col">
                  <p className="text-2xl font-semibold text-ink-950">
                    {formatMoney(plan.monthlyPriceMinor, plan.currency)}
                    <span className="text-sm font-normal text-ink-500"> / month</span>
                  </p>
                  <p className="mt-2 text-sm text-ink-600">{plan.audience}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-700">
                    <li className="flex gap-2">
                      <Check size={16} className="mt-0.5 text-accent-600" aria-hidden />
                      {plan.wordAllowance.toLocaleString()} words included each month
                    </li>
                    <li className="flex gap-2">
                      <Check size={16} className="mt-0.5 text-accent-600" aria-hidden />
                      Up to {plan.maxUsers} team member{plan.maxUsers === 1 ? "" : "s"}
                    </li>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <Check size={16} className="mt-0.5 text-accent-600" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href={`/contact?plan=${plan.slug}`}
                    variant="outline"
                    className="mt-6"
                  >
                    Talk to us about {plan.name}
                  </ButtonLink>
                </CardBody>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
