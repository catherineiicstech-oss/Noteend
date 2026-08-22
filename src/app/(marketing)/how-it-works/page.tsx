import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From quote request to quality-assured delivery: the exact steps every project goes through.",
};

const stages = [
  {
    title: "1. Submit your requirements",
    detail:
      "Use the quote wizard to describe the document, choose a service, set your deadline and upload your files. You can do this as a guest or from your account.",
  },
  {
    title: "2. Review and quotation",
    detail:
      "Our team reviews the brief and confirms the scope. You receive a written quotation showing the service, word count, turnaround, any surcharges and tax.",
  },
  {
    title: "3. Approval and payment",
    detail:
      "You approve or decline the quote from your dashboard. An invoice is generated on approval. Production starts once payment is confirmed, or immediately if your organisation has approved credit terms.",
  },
  {
    title: "4. Assignment",
    detail:
      "A project manager assigns a specialist whose experience matches the subject and document type. Assigned staff are the only people who can open your files.",
  },
  {
    title: "5. Production",
    detail:
      "Your specialist works on the document and submits it with a summary of the changes. You can message the team from the project page at any time.",
  },
  {
    title: "6. Quality assurance",
    detail:
      "A separate reviewer works through a structured checklist covering instructions, accuracy, consistency, references and formatting. Work that fails is returned for revision.",
  },
  {
    title: "7. Delivery and revisions",
    detail:
      "Final files appear in your dashboard for download. If something was missed within the agreed scope, request a revision and it goes back through the same workflow.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section className="border-b border-ink-100 bg-ink-50">
        <SectionHeading
          eyebrow="Process"
          title="A controlled workflow, from brief to delivery"
          description="Nothing moves forward without an approved quote, and premium work is never delivered without a second reviewer."
        />
      </Section>

      <Section>
        <ol className="mx-auto max-w-3xl space-y-8">
          {stages.map((stage) => (
            <li key={stage.title} className="border-l-2 border-accent-200 pl-6">
              <h2 className="text-xl">{stage.title}</h2>
              <p className="mt-2 text-ink-600">{stage.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <ButtonLink href="/quote" size="lg">
            Start a quote request
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
