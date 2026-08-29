import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/sections";
import { ContactForm } from "@/components/marketing/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${siteConfig.name} about writing, research, editing and documentation work.`,
};

export default function ContactPage() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Talk to our team"
            description="Tell us what you need. For anything involving a document, the quote wizard gets you a faster answer because you can attach your files."
          />
          <ul className="mt-8 space-y-4 text-sm text-ink-700">
            <li className="flex gap-3">
              <Mail size={18} className="mt-0.5 text-accent-600" aria-hidden />
              <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
            </li>
            <li className="flex gap-3">
              <Phone size={18} className="mt-0.5 text-accent-600" aria-hidden />
              <a href={`tel:${siteConfig.contactPhone}`}>{siteConfig.contactPhone}</a>
            </li>
            <li className="flex gap-3">
              <MapPin size={18} className="mt-0.5 text-accent-600" aria-hidden />
              {siteConfig.addressLocality}, Uganda
            </li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
