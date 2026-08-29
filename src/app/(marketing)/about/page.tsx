import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.name} is a professional writing, research, editing and documentation practice based in ${siteConfig.addressLocality}, Uganda.`,
};

export default function AboutPage() {
  return (
    <>
      <Section className="border-b border-ink-100 bg-ink-50">
        <SectionHeading
          eyebrow="About us"
          title={`${siteConfig.name} — Africa's professional writing, research, editing and documentation partner`}
          description={`We are a professional services practice based in ${siteConfig.addressLocality}, Uganda, working with organisations, institutions and individuals across the region.`}
        />
      </Section>

      <Section>
        <div className="prose-content mx-auto max-w-3xl">
          <h2>What we do</h2>
          <p>
            We take documents that matter — proposals, reports, dissertations, policies, manuals,
            manuscripts and business communications — and make them clear, consistent, credible and
            ready to submit. Work is carried out by qualified editors, researchers and writers, and
            checked by a separate reviewer before delivery.
          </p>

          <h2>How we work</h2>
          <p>
            Every engagement follows the same controlled workflow: a written quotation, an approval
            step, an assigned specialist, a structured quality-assurance review and a documented
            delivery. You can see the current stage of your project at any time from your dashboard.
          </p>

          <h2>Confidentiality</h2>
          <p>
            Client documents are treated as confidential by default. Files are held in private
            storage, access is limited to the people assigned to the project, and downloads are
            issued through short-lived links rather than public URLs. Staff work under
            confidentiality terms and every access to a document is recorded.
          </p>

          <h2>Our commitment on quality</h2>
          <p>
            We do not publish claims we cannot evidence. Client names, testimonials and case studies
            appear on this site only where the client has given permission, and any performance
            figures we quote are drawn from our own delivery records.
          </p>

          <h2>Where AI fits</h2>
          <p>
            We use software assistance for tasks such as consistency checks and terminology
            suggestions. Suggestions are always reviewed by a person, and automated output never
            replaces or overwrites your document.
          </p>
        </div>

        <div className="mt-12 text-center">
          <ButtonLink href="/contact" size="lg">
            Get in touch
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
