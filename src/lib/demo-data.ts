import type { OrgRole, ProjectStatus, SystemRole } from "@prisma/client";

const now = () => new Date();

function daysFromNow(days: number, hour = 17) {
  const date = now();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const rushMultipliers = [
  { id: "rush-24", maxHours: 24, multiplierBps: 17500 },
  { id: "rush-48", maxHours: 48, multiplierBps: 15000 },
  { id: "rush-72", maxHours: 72, multiplierBps: 12500 },
];

function pricingRule(id: string, perWord: number, minimum: number) {
  return {
    id: `price-${id}`,
    serviceId: id,
    currency: "UGX",
    baseRatePerWordMinor: perWord,
    minimumChargeMinor: minimum,
    extraFilePercent: 5,
    formattingFeeMinor: 2500000,
    researchFeeMinor: 4000000,
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
    complexityMultipliers: [],
    rushMultipliers,
  };
}

const categorySeeds = [
  {
    name: "Editing & proofreading",
    slug: "editing-proofreading",
    summary: "Line-by-line correction and improvement of documents you have already written.",
    description: "Clear, careful editorial support from a final proofread to a substantive edit.",
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
      },
      {
        name: "Academic editing",
        slug: "academic-editing",
        summary: "Dissertations, theses and journal articles edited to academic standards.",
        description:
          "Editing that respects academic conventions: argument structure, tense, tables, captions and citation consistency.\n\nWe preserve the researcher's ideas while helping the writing meet the standards expected by examiners and reviewers.",
        deliverables: [
          "Edited manuscript with tracked changes",
          "Reference and citation consistency check",
          "Formatting to your institution's template",
        ],
        perWord: 3000,
        minimum: 8000000,
      },
    ],
  },
  {
    name: "Research & writing",
    slug: "research-writing",
    summary: "Original, well-sourced writing produced from your brief.",
    description: "Researchers and writers who turn briefs and source material into clear documents.",
    services: [
      {
        name: "Research support",
        slug: "research-support",
        summary: "Literature searches, source summaries and evidence tables.",
        description:
          "We locate credible sources, summarise them and organise the evidence so you can write with confidence.\n\nDeliverables are structured to be reusable: annotated bibliographies, evidence matrices and thematic summaries.",
        deliverables: ["Annotated bibliography", "Thematic literature summary", "Evidence matrix"],
        perWord: 4000,
        minimum: 12000000,
      },
      {
        name: "Report & proposal writing",
        slug: "report-proposal-writing",
        summary: "Funding proposals, project reports and concept notes.",
        description:
          "We draft documents that follow donor, board or client templates, keep to word limits and present evidence clearly.\n\nWe work from your data, programme documents and interviews to produce a professional, coherent draft.",
        deliverables: ["Complete draft against your template", "Executive summary", "One revision round"],
        perWord: 5000,
        minimum: 15000000,
      },
      {
        name: "Content & article writing",
        slug: "content-article-writing",
        summary: "Website copy, blog articles and thought-leadership pieces.",
        description:
          "Clear, credible writing for organisations that publish regularly.\n\nWe research the topic, agree an angle and write in your organisation's voice.",
        deliverables: ["Draft article or page copy", "Suggested headings and metadata", "One revision round"],
        perWord: 3500,
        minimum: 8000000,
      },
    ],
  },
  {
    name: "Business & technical documentation",
    slug: "business-technical-documentation",
    summary: "The documents an organisation needs to operate and be audited.",
    description: "Practical policies, manuals, procedures and technical documentation.",
    services: [
      {
        name: "Policy & SOP writing",
        slug: "policy-sop-writing",
        summary: "Policies, procedures and manuals in a consistent house style.",
        description:
          "We turn how your organisation works into documents staff and auditors can follow.\n\nEach document includes defined responsibilities, version control and clear review dates.",
        deliverables: ["Policy or SOP document", "Version control schedule", "Reusable house-style template"],
        perWord: 4500,
        minimum: 12000000,
      },
      {
        name: "Technical documentation",
        slug: "technical-documentation",
        summary: "User guides, system documentation and training material.",
        description:
          "Documentation for software, equipment and processes, written for the audience that will use it.\n\nWhere possible, instructions are checked against the real product or workflow.",
        deliverables: ["Structured user or system guide", "Illustrated procedures", "Editable source files"],
        perWord: 5000,
        minimum: 15000000,
      },
      {
        name: "Formatting & document design",
        slug: "formatting-document-design",
        summary: "Templates, typesetting and submission-ready layout.",
        description:
          "Styles, numbering, tables of contents, captions, headers and footers applied consistently.\n\nYour final document is clean, accessible and ready for its intended submission channel.",
        deliverables: ["Formatted document", "Reusable template", "Accessible heading structure"],
        perWord: 800,
        minimum: 3000000,
      },
    ],
  },
  {
    name: "Publishing & translation",
    slug: "publishing-translation",
    summary: "Support for authors and multilingual organisations.",
    description: "Manuscript preparation and editorially reviewed translation.",
    services: [
      {
        name: "Manuscript preparation",
        slug: "manuscript-preparation",
        summary: "Book and journal manuscripts prepared for submission.",
        description:
          "Structural review, copy editing, front and back matter, and formatting to a publisher's guidelines.\n\nWe provide a submission-ready manuscript and a clear checklist of the work completed.",
        deliverables: ["Prepared manuscript", "Submission checklist", "Cover letter draft"],
        perWord: 3200,
        minimum: 10000000,
      },
      {
        name: "Translation & localisation",
        slug: "translation-localisation",
        summary: "English, Luganda, Swahili and French translation with editorial review.",
        description:
          "Translation by a language specialist and review by a second editor.\n\nTerminology stays consistent with your existing material and the needs of your audience.",
        deliverables: ["Translated document", "Bilingual terminology list", "Reviewer sign-off"],
        perWord: 4200,
        minimum: 10000000,
      },
    ],
  },
];

export const demoCategories = categorySeeds.map((category, categoryIndex) => {
  const categoryId = `category-${category.slug}`;
  const categoryBase = {
    id: categoryId,
    name: category.name,
    slug: category.slug,
    summary: category.summary,
    description: category.description,
    icon: null,
    position: categoryIndex,
    isActive: true,
    seoTitle: null,
    seoDescription: null,
  };

  return {
    ...categoryBase,
    services: category.services.map((service, serviceIndex) => {
      const id = `service-${service.slug}`;
      return {
        id,
        categoryId,
        name: service.name,
        slug: service.slug,
        summary: service.summary,
        description: service.description,
        deliverables: service.deliverables,
        position: serviceIndex,
        isActive: true,
        category: categoryBase,
        pricingRules: [pricingRule(id, service.perWord, service.minimum)],
      };
    }),
  };
});

export const demoServices = demoCategories.flatMap((category) => category.services);

export const demoIndustries = [
  {
    id: "industry-ngo",
    name: "NGOs & development",
    slug: "ngos-development",
    summary: "Donor proposals, programme reports and monitoring documentation that meet funder requirements.",
    problems: ["Strict donor templates", "Inconsistent contributions from several teams", "Compressed reporting deadlines"],
    solutions: ["Editing against the funder's template", "One consistent editorial voice", "Rush turnaround when required"],
  },
  {
    id: "industry-government",
    name: "Government & public sector",
    slug: "government-public-sector",
    summary: "Policy documents, cabinet papers and public-facing communication.",
    problems: ["Policy language must be precise", "Documents pass through many reviewers", "Technical information must remain readable"],
    solutions: ["Structured policy drafting", "Consolidated review comments", "Plain-language public versions"],
  },
  {
    id: "industry-university",
    name: "Universities & researchers",
    slug: "universities-researchers",
    summary: "Dissertations, theses, journal articles and grant applications.",
    problems: ["Citation requirements vary", "Language comments obscure good research", "Submission presentation is demanding"],
    solutions: ["Editing to the required style", "Reference consistency checks", "Journal-ready manuscript preparation"],
  },
  {
    id: "industry-law",
    name: "Law firms",
    slug: "law-firms",
    summary: "Legal research summaries, submissions and client documentation.",
    problems: ["Sources must remain traceable", "Documents are highly confidential", "Drafting competes with client work"],
    solutions: ["Fully referenced research summaries", "Controlled document access", "Submission editing and formatting"],
  },
  {
    id: "industry-health",
    name: "Healthcare & public health",
    slug: "healthcare-public-health",
    summary: "Protocols, health reports and patient-facing material.",
    problems: ["Clinical meaning must be preserved", "Patient material must be accessible", "Reports serve funders and regulators"],
    solutions: ["Specialist editorial review", "Plain-language rewriting", "Protocol-aligned reporting"],
  },
  {
    id: "industry-business",
    name: "Business & startups",
    slug: "business-startups",
    summary: "Business plans, investor material, policies and website copy.",
    problems: ["Investor documents need focus", "Internal policies are inconsistent", "Content quickly becomes outdated"],
    solutions: ["Concise investor-ready writing", "Policy libraries in one style", "Ongoing content support"],
  },
].map((industry, position) => ({
  ...industry,
  position,
  isActive: true,
  body: null,
  seoTitle: null,
  seoDescription: null,
}));

export const demoFaqs = [
  ["How is the price of my project calculated?", "Pricing is based on word count, subject complexity, deadline and extras such as formatting or research."],
  ["Do you start work before payment?", "Production begins after the quotation is approved and payment or agreed credit terms are confirmed."],
  ["Who can see my documents?", "Only assigned staff, the quality reviewer and authorised platform administrators can access project files."],
  ["What turnaround can you offer?", "Standard turnaround is agreed in the quotation. Rush delivery within 24, 48 or 72 hours may be available."],
  ["What happens if I need revisions?", "Each quotation includes a revision window, and anything outside the agreed scope is discussed before extra work begins."],
  ["Do you use AI to do the work?", "People carry out the work. Software may assist consistency checks, but a person reviews every suggestion."],
].map(([question, answer], position) => ({
  id: `faq-${position + 1}`,
  question,
  answer,
  topic: "general",
  position,
  isActive: true,
}));

export const demoArticles = [
  {
    id: "article-proofreading",
    title: "Choosing between proofreading and copy editing",
    slug: "proofreading-or-copy-editing",
    excerpt: "The two services solve different problems. Here is how to choose the right level of edit.",
    body: "## What proofreading does\n\nProofreading is the final pass. It corrects grammar, spelling, punctuation and typographical errors without restructuring the document.\n\n## What copy editing does\n\nCopy editing improves how the document reads. An editor rewrites unclear sentences, removes repetition and standardises terminology.\n\n## How to decide\n\nRead two pages aloud. If the ideas are sound but the sentences feel awkward, choose copy editing. If you are catching only small errors, proofreading is enough.",
    type: "GUIDE" as const,
    tags: ["editing", "academic"],
  },
  {
    id: "article-donor",
    title: "Preparing a donor report that survives review",
    slug: "donor-report-that-survives-review",
    excerpt: "A practical checklist for making a funder report easy to review and approve.",
    body: "## Start from the current template\n\nFunders update reporting formats, so begin with the latest version rather than last year's report.\n\n## Answer the question directly\n\nTreat each heading as a question. Answer it in the first sentence, then provide evidence.\n\n## Keep indicators consistent\n\nNumbers should match across the narrative, results framework and financial report.",
    type: "GUIDE" as const,
    tags: ["ngo", "reports"],
  },
  {
    id: "article-references",
    title: "Reference lists: the errors that cost marks",
    slug: "reference-list-errors",
    excerpt: "Most referencing penalties come from a small set of repeated, easily corrected mistakes.",
    body: "## Match citations and references\n\nEvery in-text citation must appear in the reference list, and every listed source must be cited.\n\n## Apply one style consistently\n\nCheck initials, capitalisation, multiple authors and retrieval details across every entry.\n\n## Make a final pass\n\nRead only the first line of each reference. Formatting inconsistencies become much easier to spot.",
    type: "GUIDE" as const,
    tags: ["academic", "referencing"],
  },
].map((article, index) => ({
  ...article,
  authorId: "demo-admin",
  author: { name: "Scriptor editorial team" },
  isPublished: true,
  publishedAt: daysFromNow(-14 - index * 8),
  createdAt: daysFromNow(-40 - index * 8),
  updatedAt: daysFromNow(-14 - index * 8),
  seoTitle: null,
  seoDescription: article.excerpt,
}));

export const demoPlans = [
  { name: "Starter", slug: "starter", tagline: "For individuals with occasional documents", audience: "Students, consultants and sole practitioners.", monthlyPriceMinor: 15000000, wordAllowance: 10000, maxUsers: 1, features: ["Standard turnaround", "Email support", "Project dashboard"] },
  { name: "Professional", slug: "professional", tagline: "For small teams publishing regularly", audience: "Small NGOs, law firms and growing businesses.", monthlyPriceMinor: 60000000, wordAllowance: 50000, maxUsers: 5, features: ["Priority queue", "Shared organisation workspace", "A style guide for every project"] },
  { name: "Enterprise", slug: "enterprise", tagline: "For continuous documentation needs", audience: "Government bodies, universities and large NGOs.", monthlyPriceMinor: 180000000, wordAllowance: 200000, maxUsers: 25, features: ["Dedicated editor", "Approved credit terms", "Quarterly quality reporting"] },
].map((plan, position) => ({ ...plan, id: `plan-${plan.slug}`, currency: "UGX", position, isActive: true, prioritySupport: position > 0, dedicatedEditor: position === 2 }));

export const demoTestimonials = [
  {
    id: "testimonial-1",
    quote: "The tracked changes were thoughtful, the report sounded like us, and we met the donor deadline.",
    authorName: "Programme lead",
    authorRole: "Monitoring & evaluation",
    organization: "Regional nonprofit",
    position: 0,
    isPublished: true,
    isPlaceholder: false,
  },
];

export const demoActor = {
  id: "demo-admin",
  email: "demo@scriptor.ug",
  name: "Amina Nansubuga",
  roles: ["SUPER_ADMIN", "PROJECT_MANAGER", "FINANCE", "QA_REVIEWER"] as SystemRole[],
  memberships: [{ organizationId: "demo-foundation", role: "OWNER" as OrgRole }],
};

const demoOwner = { id: "customer-1", name: "Grace Atwine", email: "grace@horizon.org" };
const demoOrganizationSummary = { id: "demo-foundation", name: "Horizon Foundation" };

export const demoProjects = [
  {
    id: "annual-report-edit",
    reference: "PRJ-2026-0148",
    title: "2025 Annual Impact Report",
    status: "QA_REVIEW" as ProjectStatus,
    service: { name: "Copy editing", slug: "copy-editing" },
    organization: demoOrganizationSummary,
    owner: demoOwner,
    deadline: daysFromNow(2),
    wordCount: 18600,
    assignments: [],
  },
  {
    id: "maternal-health-brief",
    reference: "PRJ-2026-0152",
    title: "Maternal Health Research Brief",
    status: "AWAITING_CUSTOMER_APPROVAL" as ProjectStatus,
    service: { name: "Research support", slug: "research-support" },
    organization: demoOrganizationSummary,
    owner: demoOwner,
    deadline: daysFromNow(6),
    wordCount: 7200,
    assignments: [],
  },
  {
    id: "hr-policy-manual",
    reference: "PRJ-2026-0139",
    title: "Human Resources Policy Manual",
    status: "IN_PROGRESS" as ProjectStatus,
    service: { name: "Policy & SOP writing", slug: "policy-sop-writing" },
    organization: demoOrganizationSummary,
    owner: { id: "customer-2", name: "Daniel Ouma", email: "daniel@lakeview.co.ug" },
    deadline: daysFromNow(11),
    wordCount: 24400,
    assignments: [],
  },
  {
    id: "grant-proposal",
    reference: "PRJ-2026-0121",
    title: "Youth Employment Grant Proposal",
    status: "DELIVERED" as ProjectStatus,
    service: { name: "Report & proposal writing", slug: "report-proposal-writing" },
    organization: demoOrganizationSummary,
    owner: demoOwner,
    deadline: daysFromNow(-9),
    wordCount: 9800,
    assignments: [],
  },
];

export const demoProject = {
  ...demoProjects[0],
  documentType: "Annual report",
  complexity: "TECHNICAL" as const,
  citationStyle: "APA",
  instructions:
    "Copy edit the full report for clarity and consistency. Keep the tone confident but evidence-led, and check that indicator names match the results framework.",
  isPremium: true,
  files: [
    { id: "file-1", filename: "Annual_Report_Draft_v3.docx", kind: "ORIGINAL" as const, version: 1, sizeBytes: 2840000, customerVisible: true, createdAt: daysFromNow(-8) },
    { id: "file-2", filename: "Results_Framework_2025.xlsx", kind: "REFERENCE" as const, version: 1, sizeBytes: 492000, customerVisible: true, createdAt: daysFromNow(-8) },
    { id: "file-3", filename: "Annual_Report_Edited_v1.docx", kind: "EDITED" as const, version: 1, sizeBytes: 3010000, customerVisible: false, createdAt: daysFromNow(-1) },
  ],
  messages: [
    { id: "message-1", body: "The revised results table is now attached. Please use those figures throughout the report.", visibility: "CUSTOMER" as const, createdAt: daysFromNow(-5), author: { name: "Grace Atwine" } },
    { id: "message-2", body: "Thanks, Grace. We have reconciled the figures and moved the edited draft into quality review.", visibility: "CUSTOMER" as const, createdAt: daysFromNow(-2), author: { name: "Amina Nansubuga" } },
    { id: "message-3", body: "Internal note: verify the outcomes table against pages 18–21 before sign-off.", visibility: "INTERNAL" as const, createdAt: daysFromNow(-1), author: { name: "Peter Okello" } },
  ],
  quotes: [
    { id: "quote-1", reference: "QT-2026-0097", status: "ACCEPTED" as const, totalMinor: 68440000, currency: "UGX", validUntil: daysFromNow(5) },
  ],
  invoices: [
    { id: "invoice-1", number: "INV-2026-0088", status: "PAID" as const, totalMinor: 68440000, currency: "UGX", dueAt: daysFromNow(-4), payments: [] },
  ],
  assignments: [
    { id: "assignment-1", role: "PROJECT_MANAGER" as const, user: { id: "demo-admin", name: "Amina Nansubuga" } },
    { id: "assignment-2", role: "EDITOR" as const, user: { id: "editor-1", name: "Peter Okello" } },
    { id: "assignment-3", role: "QA_REVIEWER" as const, user: { id: "qa-1", name: "Sarah Namukasa" } },
  ],
  qaReviews: [
    {
      id: "qa-review-1",
      outcome: null,
      comments: null,
      submittedAt: null,
      createdAt: daysFromNow(-1),
      reviewer: { name: "Sarah Namukasa" },
      items: [
        { id: "qa-item-1", section: "Language", label: "Grammar, spelling and punctuation checked", checked: true },
        { id: "qa-item-2", section: "Accuracy", label: "Figures match the supplied results framework", checked: false },
        { id: "qa-item-3", section: "Presentation", label: "Headings, tables and captions are consistent", checked: true },
      ],
    },
  ],
  events: [
    { id: "event-1", summary: "Project moved to quality review", actor: { name: "Peter Okello" }, createdAt: daysFromNow(-1) },
    { id: "event-2", summary: "Edited document uploaded", actor: { name: "Peter Okello" }, createdAt: daysFromNow(-1) },
    { id: "event-3", summary: "Payment confirmed", actor: { name: "Amina Nansubuga" }, createdAt: daysFromNow(-7) },
    { id: "event-4", summary: "Quote accepted by customer", actor: { name: "Grace Atwine" }, createdAt: daysFromNow(-8) },
  ],
};

export const demoStaff = [
  { id: "demo-admin", name: "Amina Nansubuga", roles: ["PROJECT_MANAGER", "SUPER_ADMIN"] },
  { id: "editor-1", name: "Peter Okello", roles: ["EDITOR"] },
  { id: "qa-1", name: "Sarah Namukasa", roles: ["QA_REVIEWER"] },
];

export const demoQuoteRequests = [
  { id: "request-1", reference: "QR-2026-0218", contactName: "Martha Kato", contactEmail: "martha@communityaid.org", serviceId: demoServices[4].id, service: { name: demoServices[4].name }, serviceOther: null, deadline: daysFromNow(5), estimateMinor: 32804000, estimateCurrency: "UGX", status: "NEW" as const, files: [{ id: "request-file-1" }] },
  { id: "request-2", reference: "QR-2026-0217", contactName: "Josephine Akello", contactEmail: "jakello@mak.ac.ug", serviceId: demoServices[2].id, service: { name: demoServices[2].name }, serviceOther: null, deadline: daysFromNow(12), estimateMinor: 23600000, estimateCurrency: "UGX", status: "REVIEWED" as const, files: [{ id: "request-file-2" }, { id: "request-file-3" }] },
  { id: "request-3", reference: "QR-2026-0214", contactName: "Isaac Mugisha", contactEmail: "isaac@kivu.ug", serviceId: demoServices[6].id, service: { name: demoServices[6].name }, serviceOther: null, deadline: daysFromNow(18), estimateMinor: 47200000, estimateCurrency: "UGX", status: "CONVERTED" as const, files: [] },
];

export const demoInvoices = [
  { id: "invoice-1", number: "INV-2026-0088", project: { id: "annual-report-edit", title: "2025 Annual Impact Report", reference: "PRJ-2026-0148" }, totalMinor: 68440000, currency: "UGX", dueAt: daysFromNow(-4), status: "PAID" as const, payments: [] },
  { id: "invoice-2", number: "INV-2026-0092", project: { id: "hr-policy-manual", title: "Human Resources Policy Manual", reference: "PRJ-2026-0139" }, totalMinor: 129800000, currency: "UGX", dueAt: daysFromNow(7), status: "ISSUED" as const, payments: [{ id: "payment-1", status: "PENDING" as const }] },
  { id: "invoice-3", number: "INV-2026-0079", project: { id: "grant-proposal", title: "Youth Employment Grant Proposal", reference: "PRJ-2026-0121" }, totalMinor: 57820000, currency: "UGX", dueAt: daysFromNow(-15), status: "PAID" as const, payments: [] },
];

export const demoNotifications = [
  { id: "notification-1", title: "Project ready for QA", body: "2025 Annual Impact Report has been submitted by the editor.", link: "/dashboard/projects/annual-report-edit", readAt: null, createdAt: daysFromNow(-1) },
  { id: "notification-2", title: "New quote request", body: "Martha Kato requested report and proposal writing.", link: "/dashboard/quote-requests", readAt: null, createdAt: daysFromNow(-1, 10) },
  { id: "notification-3", title: "Payment confirmed", body: "Payment for INV-2026-0088 was confirmed.", link: "/dashboard/invoices", readAt: daysFromNow(-6), createdAt: daysFromNow(-7) },
];

export const demoOrganization = {
  id: "demo-foundation",
  name: "Horizon Foundation",
  members: [
    { id: "member-1", role: "OWNER" as OrgRole, user: { name: "Amina Nansubuga", email: "amina@horizon.org" } },
    { id: "member-2", role: "ADMIN" as OrgRole, user: { name: "Grace Atwine", email: "grace@horizon.org" } },
    { id: "member-3", role: "MEMBER" as OrgRole, user: { name: "Daniel Ouma", email: "daniel@horizon.org" } },
  ],
  invitations: [{ id: "invite-1", email: "maria@horizon.org", role: "MEMBER" as OrgRole, acceptedAt: null }],
};

export const demoOrganizationUsage = {
  activeProjects: 3,
  completedProjects: 7,
  wordsThisMonth: 60200,
  outstandingMinor: 129800000,
  spendMinor: 412600000,
  currency: "UGX",
  averageTurnaroundHours: 82,
  subscription: null,
  servicesUsed: [{ name: "Copy editing", count: 4 }],
};

export const demoAnalytics = {
  totalRevenueMinor: 486320000,
  monthRevenueMinor: 126260000,
  currency: "UGX",
  activeProjects: 9,
  newCustomersThisMonth: 6,
  organizations: 18,
  pendingQuoteRequests: 5,
  pendingPaymentsMinor: 129800000,
  awaitingAssignment: 2,
  inQa: 3,
  overdue: 1,
  averageTurnaroundHours: 86,
  satisfaction: 4.8,
  quoteConversionPercent: 68,
  repeatCustomers: 11,
  revenueByMonth: [
    { month: "2026-03", revenueMinor: 38400000 },
    { month: "2026-04", revenueMinor: 52700000 },
    { month: "2026-05", revenueMinor: 44600000 },
    { month: "2026-06", revenueMinor: 71120000 },
    { month: "2026-07", revenueMinor: 93800000 },
    { month: "2026-08", revenueMinor: 126260000 },
  ],
  customerGrowth: [],
  byService: [
    { name: "Copy editing", count: 12 },
    { name: "Report & proposal writing", count: 9 },
    { name: "Academic editing", count: 8 },
    { name: "Policy & SOP writing", count: 6 },
  ],
  byIndustry: [],
  editorPerformance: [
    { name: "Peter Okello", active: 3, delivered: 18 },
    { name: "Lydia Nakato", active: 2, delivered: 15 },
    { name: "David Wekesa", active: 4, delivered: 12 },
  ],
};

export const demoSettings: Record<string, unknown> = {
  "billing.currency": "UGX",
  "billing.taxPercent": 18,
  "billing.taxLabel": "VAT",
  "billing.invoiceDueDays": 14,
  "billing.bankDetails": { accountName: "Scriptor Uganda Ltd", bank: "Demo Bank", accountNumber: "0012345678", branch: "Kampala" },
  "documents.retentionDays": 365,
  "documents.allowedMimeTypes": ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  "workflow.requireQaForPremium": true,
  "workflow.defaultTurnaroundHours": 72,
  "notifications.enabled": true,
};

export const demoAudits = [
  { id: "audit-1", action: "project.status_changed", resourceType: "Project", actor: { name: "Peter Okello" } },
  { id: "audit-2", action: "file.download", resourceType: "ProjectFile", actor: { name: "Sarah Namukasa" } },
  { id: "audit-3", action: "payment.confirmed", resourceType: "Payment", actor: { name: "Amina Nansubuga" } },
  { id: "audit-4", action: "quote_request.converted", resourceType: "QuoteRequest", actor: { name: "Amina Nansubuga" } },
];
