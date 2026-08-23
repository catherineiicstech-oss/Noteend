import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/marketing/sections";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { listPublicServices } from "@/server/services/catalogue";
import { currentActor } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Describe your document, upload your files and get an indicative estimate. A binding quotation follows after our team reviews the brief.",
};

export default async function QuotePage() {
  const [services, actor] = await Promise.all([listPublicServices(), currentActor()]);

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl">Request a quote</h1>
        <p className="mt-3 text-ink-600">
          Four short steps. You will see an indicative estimate before you submit, and a written
          quotation from our team afterwards.
        </p>
        <div className="mt-8">
          <Suspense>
            <QuoteWizard
              services={services.map((service) => ({
                id: service.id,
                name: service.name,
                slug: service.slug,
                category: service.category.name,
                hasPricing: service.pricingRules.length > 0,
              }))}
              defaults={
                actor
                  ? { contactName: actor.name, contactEmail: actor.email }
                  : { contactName: "", contactEmail: "" }
              }
              signedIn={Boolean(actor)}
            />
          </Suspense>
        </div>
      </div>
    </Section>
  );
}
