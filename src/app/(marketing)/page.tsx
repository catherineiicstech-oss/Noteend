import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { FeatureCard, Section, SectionHeading } from "@/components/marketing/sections";
import {
  listArticles,
  listFaqs,
  listIndustries,
  listPublicCategories,
  listPublishedTestimonials,
} from "@/server/services/catalogue";
import { promise, siteConfig } from "@/lib/site";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Tell us what you need",
    detail: "Share your document, deadline and requirements through the quote form.",
  },
  {
    title: "Receive a written quote",
    detail: "We review the brief, confirm scope and send a fixed quotation for approval.",
  },
  {
    title: "Approve and pay",
    detail: "Work starts once the quote is approved and payment or credit terms are confirmed.",
  },
  {
    title: "Specialist works on it",
    detail: "An experienced editor, researcher or writer is assigned to your project.",
  },
  {
    title: "Quality assurance",
    detail: "A second reviewer checks accuracy, consistency, formatting and instructions.",
  },
  {
    title: "Delivery",
    detail: "Final files are delivered to your dashboard with a revision window.",
  },
];

const assurances = [
  {
    icon: Lock,
    title: "Private by default",
    detail:
      "Documents are stored privately and shared only with the people assigned to your project.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed before delivery",
    detail: "Premium work passes a structured quality-assurance checklist before it is released.",
  },
  {
    icon: Users,
    title: "Team and organisation accounts",
    detail: "Invite colleagues, share projects and keep billing under one organisation.",
  },
  {
    icon: MessagesSquare,
    title: "One place to communicate",
    detail: "Messages, files and revisions stay attached to the project — not scattered in email.",
  },
];

export default async function HomePage() {
  const [categories, industries, articles, faqs, testimonials] = await Promise.all([
    listPublicCategories(),
    listIndustries(),
    listArticles(3),
    listFaqs(),
    listPublishedTestimonials(),
  ]);

  return (
    <>
      <section className="border-b border-ink-100 bg-gradient-to-b from-ink-50 to-white">
        <div className="container grid gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-600">
              {siteConfig.addressLocality}, Uganda
            </p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl lg:text-[3.4rem]">
              Professional writing, research, editing &amp; documentation — all in one place.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-600">{promise}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/quote" size="lg">
                Get a quote <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink href="/services" size="lg" variant="outline">
                Explore services
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-ink-500">
              Upload your document, get a written quotation, and track every stage from your
              dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <p className="text-sm font-semibold text-ink-900">How a project runs</p>
            <ol className="mt-4 space-y-4">
              {steps.slice(0, 6).map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-xs font-semibold text-accent-700">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink-900">{step.title}</span>
                    <span className="block text-sm text-ink-600">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Services"
          title="Everything your documents need, under one roof"
          description="Editing and proofreading, research and writing, business and technical documentation, publishing support and translation."
        />
        <div className="mt-10 space-y-12">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl">{category.name}</h3>
                <Link
                  href={`/services#${category.slug}`}
                  className="text-sm font-medium text-accent-700 hover:text-accent-800"
                >
                  View all
                </Link>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.slice(0, 3).map((service) => {
                  const rule = service.pricingRules[0];
                  return (
                    <FeatureCard
                      key={service.id}
                      title={service.name}
                      description={service.summary}
                      href={`/services/${service.slug}`}
                      meta={
                        rule
                          ? `From ${formatMoney(rule.minimumChargeMinor, rule.currency)}`
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-ink-50">
        <SectionHeading
          eyebrow="Why work with us"
          title="Built around confidentiality and review"
          description="Every project runs through the same controlled workflow, so you always know who has your document and what stage it is at."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {assurances.map((item) => (
            <div key={item.title} className="rounded-xl border border-ink-100 bg-white p-6">
              <item.icon className="text-accent-600" size={22} aria-hidden />
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      {industries.length ? (
        <Section>
          <SectionHeading
            eyebrow="Industries"
            title="Documents we work on every week"
            description="We adapt tone, structure and citation style to the sector you operate in."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {industries.slice(0, 6).map((industry) => (
              <FeatureCard
                key={industry.id}
                title={industry.name}
                description={industry.summary}
                href={`/industries/${industry.slug}`}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {testimonials.length ? (
        <Section className="bg-ink-50">
          <SectionHeading eyebrow="Client feedback" title="What clients say" />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.id} className="rounded-xl border border-ink-100 bg-white p-6">
                <blockquote className="text-sm text-ink-700">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-medium text-ink-900">
                  {testimonial.authorName}
                  {testimonial.authorRole || testimonial.organization ? (
                    <span className="block text-xs font-normal text-ink-500">
                      {[testimonial.authorRole, testimonial.organization]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {articles.length ? (
        <Section>
          <SectionHeading
            eyebrow="Resource centre"
            title="Guides from our editorial team"
            description="Practical writing, referencing and documentation guidance."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {articles.map((article) => (
              <FeatureCard
                key={article.id}
                title={article.title}
                description={article.excerpt}
                href={`/resources/${article.slug}`}
                meta={article.type.replace(/_/g, " ").toLowerCase()}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section className="bg-ink-50">
          <SectionHeading eyebrow="FAQ" title="Common questions" />
          <div className="mt-8 max-w-3xl divide-y divide-ink-200 rounded-xl border border-ink-100 bg-white">
            {faqs.slice(0, 6).map((faq) => (
              <details key={faq.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-ink-900 marker:hidden">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-ink-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <div className="rounded-2xl bg-ink-950 px-8 py-14 text-center">
          <h2 className="text-3xl text-white">Ready to get your document reviewed?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-200">
            Send us the brief and files. You will receive a written quotation with scope, price and
            turnaround before any work begins.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/quote" size="lg">
              Request a quote
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="outline">
              Talk to us
            </ButtonLink>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
            <FileCheck2 size={14} /> Files are uploaded to private storage, never a public link.
          </p>
        </div>
      </Section>
    </>
  );
}
