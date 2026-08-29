import { PrismaClient, type Complexity } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { SETTING_DEFAULTS } from "../src/server/services/settings";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.SEED_PASSWORD || "Passw0rd!demo";

type ServiceSeed = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  deliverables: string[];
  perWord: number;
  minimum: number;
  formatting: number;
  research: number;
};

type CategorySeed = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  services: ServiceSeed[];
};

const catalogue: CategorySeed[] = [
  {
    name: "Editing & proofreading",
    slug: "editing-proofreading",
    summary:
      "Line-by-line correction and improvement of documents you have already written.",
    description:
      "Our editors correct language errors, tighten structure and enforce a consistent style so your document reads as though it was written by a specialist.",
    services: [
      {
        name: "Proofreading",
        slug: "proofreading",
        summary: "Grammar, spelling, punctuation and typographical correction.",
        description:
          "A final check before submission. We correct grammar, spelling, punctuation, capitalisation and obvious inconsistencies without changing your argument or voice.\n\nThis service is appropriate when the content is finished and you need a clean, error-free document.",
        deliverables: [
          "Corrected document with tracked changes",
          "Clean copy ready for submission",
          "Short summary of recurring issues",
        ],
        perWord: 1500,
        minimum: 3000000,
        formatting: 2000000,
        research: 0,
      },
      {
        name: "Copy editing",
        slug: "copy-editing",
        summary: "Clarity, flow, tone and consistency across the whole document.",
        description:
          "We go beyond correction: sentences are rewritten for clarity, repetition is removed, terminology is standardised and transitions are strengthened.\n\nSuitable for reports, proposals and manuscripts where the argument is sound but the writing needs to be sharper.",
        deliverables: [
          "Edited document with tracked changes",
          "Comments explaining substantive edits",
          "Consistency and terminology notes",
        ],
        perWord: 2500,
        minimum: 5000000,
        formatting: 2500000,
        research: 0,
      },
      {
        name: "Academic editing",
        slug: "academic-editing",
        summary: "Dissertations, theses and journal articles edited to academic standards.",
        description:
          "Editing that respects academic conventions: argument structure, hedging, tense use in literature reviews and methods, table and figure captions, and citation consistency in APA, Harvard, MLA, Chicago or a university-specific style.\n\nWe do not write your research for you; we make the writing you produced meet the standard expected by examiners and reviewers.",
        deliverables: [
          "Edited manuscript with tracked changes",
          "Reference and citation consistency check",
          "Formatting to your institution's template",
        ],
        perWord: 3000,
        minimum: 8000000,
        formatting: 4000000,
        research: 0,
      },
    ],
  },
  {
    name: "Research & writing",
    slug: "research-writing",
    summary: "Original, well-sourced writing produced from your brief.",
    description:
      "Researchers and writers who can work from a brief, an outline or a pile of source material and produce a coherent, referenced document.",
    services: [
      {
        name: "Research support",
        slug: "research-support",
        summary: "Literature searches, source summaries and evidence tables.",
        description:
          "We locate credible sources, summarise them and organise the evidence so you can write with confidence.\n\nDeliverables are structured to be reusable: annotated bibliographies, evidence matrices and thematic summaries.",
        deliverables: [
          "Annotated bibliography",
          "Thematic summary of the literature",
          "Source files or links where licensing allows",
        ],
        perWord: 4000,
        minimum: 12000000,
        formatting: 2000000,
        research: 5000000,
      },
      {
        name: "Report & proposal writing",
        slug: "report-proposal-writing",
        summary: "Funding proposals, project reports and concept notes.",
        description:
          "We draft documents that follow donor, board or client templates, keep to word limits and present evidence clearly.\n\nWe work from your data, programme documents and interviews — the content is yours, structured and expressed professionally.",
        deliverables: [
          "Complete draft against your template",
          "Executive summary",
          "One round of revision within scope",
        ],
        perWord: 5000,
        minimum: 15000000,
        formatting: 3000000,
        research: 8000000,
      },
      {
        name: "Content & article writing",
        slug: "content-article-writing",
        summary: "Website copy, blog articles and thought-leadership pieces.",
        description:
          "Clear, credible writing for organisations that need to publish regularly. We research the topic, agree an angle and write in your organisation's voice.",
        deliverables: [
          "Draft article or page copy",
          "Suggested headings and meta description",
          "One revision round",
        ],
        perWord: 3500,
        minimum: 8000000,
        formatting: 1500000,
        research: 3000000,
      },
    ],
  },
  {
    name: "Business & technical documentation",
    slug: "business-technical-documentation",
    summary: "The documents an organisation needs to operate and be audited.",
    description:
      "Policies, manuals, standard operating procedures and technical documentation, written to be used rather than filed away.",
    services: [
      {
        name: "Policy & SOP writing",
        slug: "policy-sop-writing",
        summary: "Policies, procedures and manuals in a consistent house style.",
        description:
          "We turn how your organisation actually works into documents your staff and auditors can follow: numbered procedures, defined responsibilities, version control and review dates.",
        deliverables: [
          "Policy or SOP document",
          "Version control and review schedule",
          "Consistent house-style template",
        ],
        perWord: 4500,
        minimum: 12000000,
        formatting: 3000000,
        research: 4000000,
      },
      {
        name: "Technical documentation",
        slug: "technical-documentation",
        summary: "User guides, system documentation and training material.",
        description:
          "Documentation for software, equipment and processes, written for the audience that will use it and tested against the actual product where possible.",
        deliverables: [
          "Structured user or system guide",
          "Screenshots and diagrams where supplied",
          "Editable source files",
        ],
        perWord: 5000,
        minimum: 15000000,
        formatting: 3500000,
        research: 4000000,
      },
      {
        name: "Formatting & document design",
        slug: "formatting-document-design",
        summary: "Templates, typesetting and submission-ready layout.",
        description:
          "Styles, numbering, tables of contents, captions, headers and footers applied consistently so your document meets the template it will be judged against.",
        deliverables: [
          "Formatted document",
          "Reusable template file",
          "Accessibility-conscious heading structure",
        ],
        perWord: 800,
        minimum: 3000000,
        formatting: 0,
        research: 0,
      },
    ],
  },
  {
    name: "Publishing & translation",
    slug: "publishing-translation",
    summary: "Support for authors and multilingual organisations.",
    description:
      "Manuscript preparation, publishing support and translation between English and regional languages.",
    services: [
      {
        name: "Manuscript preparation",
        slug: "manuscript-preparation",
        summary: "Book and journal manuscripts prepared for submission.",
        description:
          "Structural review, copy editing, front and back matter, and formatting to a publisher's or journal's submission guidelines.",
        deliverables: [
          "Prepared manuscript",
          "Submission checklist against publisher guidelines",
          "Cover letter draft where required",
        ],
        perWord: 3200,
        minimum: 10000000,
        formatting: 4000000,
        research: 0,
      },
      {
        name: "Translation & localisation",
        slug: "translation-localisation",
        summary: "English, Luganda, Swahili and French translation with editorial review.",
        description:
          "Translation carried out by a translator and checked by a second reviewer, keeping terminology consistent with your existing material.",
        deliverables: [
          "Translated document",
          "Bilingual terminology list",
          "Reviewer sign-off",
        ],
        perWord: 4200,
        minimum: 10000000,
        formatting: 2000000,
        research: 0,
      },
    ],
  },
];

const complexityBps: Record<Complexity, number> = {
  STANDARD: 10000,
  TECHNICAL: 13000,
  SPECIALIST: 16000,
};

const rushBands = [
  { maxHours: 24, multiplierBps: 17500 },
  { maxHours: 48, multiplierBps: 15000 },
  { maxHours: 72, multiplierBps: 12500 },
];

const industries = [
  {
    name: "NGOs & development",
    slug: "ngos-development",
    summary:
      "Donor proposals, programme reports and monitoring documentation that meet funder requirements.",
    problems: [
      "Donor templates and word limits are strict and vary by funder",
      "Reports are drafted by several people and read inconsistently",
      "Deadlines fall at the end of reporting cycles when teams are stretched",
    ],
    solutions: [
      "Writing and editing against the funder's exact template",
      "One consistent voice across contributions from multiple teams",
      "Rush turnaround for reporting deadlines",
    ],
  },
  {
    name: "Government & public sector",
    slug: "government-public-sector",
    summary: "Policy documents, cabinet papers and public-facing communication.",
    problems: [
      "Policy language must be precise and defensible",
      "Documents pass through many reviewers before approval",
      "Public communication must be readable by a general audience",
    ],
    solutions: [
      "Structured policy drafting and editing",
      "Consolidation of review comments into a single clean version",
      "Plain-language versions of technical documents",
    ],
  },
  {
    name: "Universities & researchers",
    slug: "universities-researchers",
    summary: "Dissertations, theses, journal articles and grant applications.",
    problems: [
      "Citation styles differ between departments and journals",
      "Supervisors return work for language rather than content",
      "Journal submissions are desk-rejected on presentation",
    ],
    solutions: [
      "Editing to APA, Harvard, MLA, Chicago or a university template",
      "Reference and citation consistency checks",
      "Manuscript preparation against journal guidelines",
    ],
  },
  {
    name: "Law firms",
    slug: "law-firms",
    summary: "Legal research summaries, submissions and client documentation.",
    problems: [
      "Research must be traceable to sources",
      "Documents are confidential and cannot be sent through open channels",
      "Drafting time competes with client work",
    ],
    solutions: [
      "Research summaries with full source references",
      "Private storage with access limited to assigned staff",
      "Editing and formatting of submissions and agreements",
    ],
  },
  {
    name: "Healthcare & public health",
    slug: "healthcare-public-health",
    summary: "Protocols, health reports and patient-facing material.",
    problems: [
      "Clinical accuracy must survive editing",
      "Material for patients must be readable at a low reading level",
      "Reports must satisfy both funders and regulators",
    ],
    solutions: [
      "Editors briefed to preserve clinical meaning",
      "Plain-language rewriting for patient material",
      "Structured reporting against protocol templates",
    ],
  },
  {
    name: "Business & startups",
    slug: "business-startups",
    summary: "Business plans, investor material, policies and website copy.",
    problems: [
      "Investor documents need to be concise and credible",
      "Internal policies are missing or inconsistent",
      "No in-house writer to keep content current",
    ],
    solutions: [
      "Business plan and pitch document writing",
      "Policy and SOP libraries in one house style",
      "Ongoing content support under a monthly plan",
    ],
  },
];

const faqs = [
  {
    question: "How is the price of my project calculated?",
    answer:
      "Pricing is based on word count, the complexity of the subject matter, your deadline and any extras such as formatting or additional research. The quote wizard shows an indicative estimate immediately, and our team confirms a binding quotation after reviewing your files.",
    topic: "pricing",
  },
  {
    question: "Do you start work before payment?",
    answer:
      "No. Production begins once your quotation is approved and payment is confirmed. Organisations with approved credit terms are the only exception.",
    topic: "pricing",
  },
  {
    question: "Who can see my documents?",
    answer:
      "Only the staff assigned to your project, the reviewer who quality-checks it and platform administrators. Files are stored privately and downloaded through short-lived signed links. Every download is recorded.",
    topic: "confidentiality",
  },
  {
    question: "Will you write my exam or assignment for me?",
    answer:
      "No. We provide editing, proofreading, formatting, research support and writing assistance. We do not take examinations, impersonate students or take part in anything that breaches an institution's academic integrity rules.",
    topic: "academic",
  },
  {
    question: "What turnaround can you offer?",
    answer:
      "Standard turnaround is agreed in your quotation and depends on length and complexity. Rush delivery inside 24, 48 or 72 hours is available and is priced automatically from the deadline you choose.",
    topic: "process",
  },
  {
    question: "What happens if I am not happy with the work?",
    answer:
      "Tell us within the revision window shown on your quotation. Work that does not meet the agreed scope is corrected at no cost, and if we cannot bring it to standard we refund the fee for that deliverable.",
    topic: "process",
  },
  {
    question: "Do you use AI to do the work?",
    answer:
      "Work is carried out by people. We use software assistance for checks such as consistency and terminology, but every suggestion is reviewed by a person and automated output never overwrites your document.",
    topic: "process",
  },
];

const articles = [
  {
    title: "Choosing between proofreading and copy editing",
    slug: "proofreading-or-copy-editing",
    excerpt:
      "The two services solve different problems. Picking the wrong one is the most common reason clients are disappointed with an edit.",
    body: "## What proofreading does\n\nProofreading is the final pass. It corrects grammar, spelling, punctuation and typographical errors. It does not restructure paragraphs, rewrite awkward sentences or change your terminology. If your document is finished and you want it clean, this is the service you need.\n\n## What copy editing does\n\nCopy editing changes how the document reads. An editor will rewrite unclear sentences, remove repetition, standardise terminology and strengthen the transitions between sections. The argument stays yours; the expression improves.\n\n## How to decide\n\nRead two pages aloud. If you stumble over sentence construction, or you find yourself explaining what you meant, you need copy editing. If the reading is smooth and you are catching only small errors, proofreading is enough.\n\n## A practical test for academic work\n\nIf your supervisor's comments are about clarity, flow or structure, proofreading will not solve the problem. Ask for academic editing instead, which combines copy editing with the conventions examiners expect.",
    type: "GUIDE" as const,
    tags: ["editing", "academic"],
  },
  {
    title: "Preparing a donor report that survives review",
    slug: "donor-report-that-survives-review",
    excerpt:
      "Funder reports are rejected for presentation as often as for substance. A short checklist before you submit.",
    body: "## Start from the template, not from last year's report\n\nFunders change their reporting formats more often than teams expect. Download the current template and build the document inside it.\n\n## Answer the question that was asked\n\nEach heading in a donor template is a question. Answer it directly in the first sentence under that heading, then provide evidence. Reviewers read quickly and reward documents that do not make them search.\n\n## Keep indicators consistent\n\nNumbers should match between the narrative, the results framework and the financial report. Where a figure has been revised, say so explicitly rather than leaving the reader to reconcile two versions.\n\n## Write the executive summary last\n\nIt should be readable on its own and contain no information that does not appear in the body.\n\n## Leave time for one clean read\n\nA single uninterrupted read of the assembled document catches more problems than several partial reviews by different people.",
    type: "GUIDE" as const,
    tags: ["ngo", "reports"],
  },
  {
    title: "Reference lists: the errors that cost marks",
    slug: "reference-list-errors",
    excerpt:
      "Most referencing penalties come from a small number of repeated, easily corrected mistakes.",
    body: "## Mismatch between citations and the list\n\nEvery in-text citation must appear in the reference list, and every entry in the list must be cited. This is the single most common problem we correct.\n\n## Inconsistent author formatting\n\nPick the style your department requires and apply it to every entry: initials, ampersands, capitalisation of titles and the treatment of multiple authors.\n\n## Missing retrieval information\n\nOnline sources need a DOI where one exists. Where there is no DOI, a stable URL and, for styles that require it, an access date.\n\n## Secondary citations\n\nCiting a source you have not read, through another author, is allowed in most styles but must be shown as such. Silently citing the original is a serious error.\n\n## A quick check before submission\n\nSort the reference list alphabetically and read only the first line of each entry. Inconsistencies in author formatting become obvious immediately.",
    type: "GUIDE" as const,
    tags: ["academic", "referencing"],
  },
];

const plans = [
  {
    name: "Starter",
    slug: "starter",
    tagline: "For individuals with occasional documents",
    audience: "Students, consultants and sole practitioners.",
    monthlyPriceMinor: 15000000,
    wordAllowance: 10000,
    features: ["Standard turnaround", "Email support", "Project dashboard"],
    maxUsers: 1,
    position: 1,
  },
  {
    name: "Professional",
    slug: "professional",
    tagline: "For small teams publishing regularly",
    audience: "Small NGOs, law firms and growing businesses.",
    monthlyPriceMinor: 60000000,
    wordAllowance: 50000,
    features: [
      "Priority queue",
      "Shared organisation workspace",
      "Style guide applied to every project",
    ],
    maxUsers: 5,
    prioritySupport: true,
    position: 2,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    tagline: "For organisations with continuous documentation needs",
    audience: "Government bodies, universities and large NGOs.",
    monthlyPriceMinor: 180000000,
    wordAllowance: 200000,
    features: [
      "Dedicated editor",
      "Approved credit terms available",
      "Custom templates and terminology management",
      "Quarterly quality reporting",
    ],
    maxUsers: 25,
    prioritySupport: true,
    dedicatedEditor: true,
    position: 3,
  },
];

async function seedSettings() {
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never },
      update: {},
    });
  }
}

async function seedCatalogue() {
  for (const [categoryIndex, category] of catalogue.entries()) {
    const categoryRow = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        summary: category.summary,
        description: category.description,
        position: categoryIndex,
      },
      update: { name: category.name, summary: category.summary },
    });

    for (const [serviceIndex, service] of category.services.entries()) {
      const serviceRow = await prisma.service.upsert({
        where: { slug: service.slug },
        create: {
          categoryId: categoryRow.id,
          name: service.name,
          slug: service.slug,
          summary: service.summary,
          description: service.description,
          deliverables: service.deliverables,
          position: serviceIndex,
        },
        update: { summary: service.summary, description: service.description },
      });

      const existingRule = await prisma.pricingRule.findFirst({
        where: { serviceId: serviceRow.id },
      });
      if (existingRule) continue;

      const rule = await prisma.pricingRule.create({
        data: {
          serviceId: serviceRow.id,
          currency: "UGX",
          baseRatePerWordMinor: service.perWord,
          minimumChargeMinor: service.minimum,
          extraFilePercent: 5,
          formattingFeeMinor: service.formatting,
          researchFeeMinor: service.research,
        },
      });

      await prisma.complexityMultiplier.createMany({
        data: (Object.keys(complexityBps) as Complexity[]).map((complexity) => ({
          pricingRuleId: rule.id,
          complexity,
          multiplierBps: complexityBps[complexity],
        })),
      });
      await prisma.rushMultiplier.createMany({
        data: rushBands.map((band) => ({ pricingRuleId: rule.id, ...band })),
      });
    }
  }
}

async function seedContent(authorId: string) {
  for (const [index, industry] of industries.entries()) {
    await prisma.industry.upsert({
      where: { slug: industry.slug },
      create: { ...industry, position: index },
      update: { summary: industry.summary },
    });
  }

  for (const [index, faq] of faqs.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: { ...faq, position: index } });
    }
  }

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      create: {
        ...article,
        authorId,
        isPublished: true,
        publishedAt: new Date(),
        seoDescription: article.excerpt,
      },
      update: {},
    });
  }

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: { monthlyPriceMinor: plan.monthlyPriceMinor },
    });
  }
}

async function seedUsers() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const people = [
    { email: "admin@example.com", name: "Platform Administrator", role: "SUPER_ADMIN" as const },
    { email: "manager@example.com", name: "Project Manager", role: "PROJECT_MANAGER" as const },
    {
      email: "editor@example.com",
      name: "Senior Editor",
      role: "EDITOR" as const,
      specialties: ["Academic editing", "Report writing"],
    },
    { email: "qa@example.com", name: "Quality Reviewer", role: "QA_REVIEWER" as const },
    { email: "finance@example.com", name: "Finance Officer", role: "FINANCE" as const },
    { email: "customer@example.com", name: "Demo Customer", role: "CUSTOMER" as const },
  ];

  const created: Record<string, string> = {};
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      create: {
        email: person.email,
        name: person.name,
        passwordHash,
        country: "Uganda",
        emailVerified: new Date(),
        specialties: person.specialties ?? [],
        roles: { create: { role: person.role } },
      },
      update: {},
    });
    created[person.role] = user.id;
  }
  return created;
}

async function seedOrganization(ownerId: string) {
  const existing = await prisma.organization.findUnique({ where: { slug: "demo-foundation" } });
  if (existing) return existing;

  return prisma.organization.create({
    data: {
      name: "Demo Foundation",
      slug: "demo-foundation",
      industry: "NGOs & development",
      billingEmail: "customer@example.com",
      settings: { create: { englishVariant: "UK", defaultCitationStyle: "APA" } },
      members: { create: { userId: ownerId, role: "OWNER" } },
    },
  });
}

async function main() {
  await seedSettings();
  await seedCatalogue();
  const users = await seedUsers();
  await seedContent(users.SUPER_ADMIN);
  await seedOrganization(users.CUSTOMER);

  console.log("Seed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log(Object.keys(users).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
