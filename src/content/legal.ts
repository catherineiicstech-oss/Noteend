import { siteConfig } from "@/lib/site";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
};

const updated = "22 August 2026";
const brand = siteConfig.name;

/// These are operational drafts written for this platform's actual behaviour.
/// They are not legal advice and should be reviewed by a qualified lawyer in
/// the operating jurisdiction before launch.
export const legalDocuments = {
  terms: {
    title: "Terms of service",
    summary: `The terms that apply when you request or receive services from ${brand}.`,
    updated,
    sections: [
      {
        heading: "1. Agreement",
        paragraphs: [
          `These terms govern your use of the ${brand} platform and any services you order through it. By creating an account, submitting a quote request or approving a quotation, you accept these terms.`,
        ],
      },
      {
        heading: "2. Quotations and scope",
        paragraphs: [
          "Estimates shown in the quote wizard are indicative. A binding quotation is issued only after our team has reviewed your brief and files. The quotation defines the service, deliverables, turnaround and price.",
          "Work outside the agreed scope requires a new or revised quotation.",
        ],
      },
      {
        heading: "3. Payment",
        paragraphs: [
          "Unless approved credit terms are in place for your organisation, production begins after payment is confirmed. Invoices are due by the date shown on the invoice.",
        ],
      },
      {
        heading: "4. Your responsibilities",
        paragraphs: [
          "You confirm that you own or are authorised to submit the material you upload, and that our work on it will not infringe anyone's rights.",
        ],
        bullets: [
          "Provide accurate instructions, deadlines and reference material.",
          "Respond to clarification requests in reasonable time.",
          "Do not submit material you are not permitted to share.",
        ],
      },
      {
        heading: "5. Academic integrity",
        paragraphs: [
          "We provide editing, proofreading, formatting, research support and writing assistance. We do not participate in examination fraud, impersonation, or any activity that breaches an institution's academic integrity rules. It is your responsibility to ensure that the assistance you request is permitted by your institution.",
        ],
      },
      {
        heading: "6. Revisions",
        paragraphs: [
          "Revisions within the agreed scope may be requested within the revision window stated in your quotation. Requests that change the scope are quoted separately.",
        ],
      },
      {
        heading: "7. Intellectual property",
        paragraphs: [
          "You retain ownership of the material you submit. On full payment, you own the deliverables produced for you, except for our pre-existing templates, checklists and internal tooling.",
        ],
      },
      {
        heading: "8. Limitation of liability",
        paragraphs: [
          "Our total liability for any claim relating to a project is limited to the amount paid for that project. We are not liable for indirect or consequential losses, including outcomes of submissions, applications or examinations.",
        ],
      },
      {
        heading: "9. Changes",
        paragraphs: [
          "We may update these terms. Material changes will be notified through the platform. The version in force is the one published when your quotation was approved.",
        ],
      },
      {
        heading: "10. Contact",
        paragraphs: [`Questions about these terms can be sent to ${siteConfig.contactEmail}.`],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    summary: "What personal data we collect, why we hold it, and the choices you have.",
    updated,
    sections: [
      {
        heading: "Data we collect",
        paragraphs: ["We collect only what we need to quote for, deliver and invoice your work."],
        bullets: [
          "Account details: name, email address, phone number, country and organisation.",
          "Project data: briefs, instructions, uploaded documents and messages.",
          "Billing data: invoices, payments and payment references. Card and mobile money details are handled by the payment provider, not stored by us.",
          "Technical data: authentication sessions and audit records of significant actions.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "To prepare quotations, deliver projects, communicate with you, issue invoices, meet legal obligations and improve our service quality.",
        ],
      },
      {
        heading: "Access within our team",
        paragraphs: [
          "Your documents are visible only to the staff assigned to your project, the reviewers who quality-check it, and administrators responsible for the platform. Access to files is logged.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Project files are retained for the retention period configured for the platform, after which they are removed. Invoices and audit records are retained for as long as required for accounting and legal purposes. You may ask us to delete your files earlier.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You can request a copy of your data, ask for corrections, or ask us to delete it, by writing to ${siteConfig.contactEmail}.`,
        ],
      },
      {
        heading: "Processors",
        paragraphs: [
          "We use third parties for hosting, file storage, email delivery and payment processing. They act on our instructions and only for the purposes above.",
        ],
      },
    ],
  },

  confidentiality: {
    title: "Confidentiality statement",
    summary: "How we protect the documents you send us.",
    updated,
    sections: [
      {
        heading: "Default position",
        paragraphs: [
          "Everything you send us is treated as confidential. We do not share, publish or reuse client material, and we do not name clients without written permission.",
        ],
      },
      {
        heading: "Technical controls",
        paragraphs: ["The platform is built so that documents cannot be accessed casually."],
        bullets: [
          "Files are stored in private storage and are never served from a public URL.",
          "Downloads are issued as short-lived signed links to authorised users only.",
          "Editors can open only the projects they are assigned to.",
          "Internal staff notes are stored separately from customer-visible messages.",
          "Significant actions, including file downloads, are written to an audit log.",
        ],
      },
      {
        heading: "People",
        paragraphs: [
          "Editors, researchers, writers and reviewers work under confidentiality obligations. Access is removed when an assignment ends.",
        ],
      },
      {
        heading: "Non-disclosure agreements",
        paragraphs: [
          `If your organisation requires a signed NDA before sending material, contact ${siteConfig.contactEmail} and we will complete it before work begins.`,
        ],
      },
    ],
  },

  refunds: {
    title: "Refund policy",
    summary: "When refunds apply and how to request one.",
    updated,
    sections: [
      {
        heading: "Before work starts",
        paragraphs: [
          "If you cancel after paying but before a specialist has been assigned, you receive a full refund.",
        ],
      },
      {
        heading: "After work starts",
        paragraphs: [
          "If you cancel while work is in progress, we refund the portion of the fee that corresponds to work not yet carried out. We will tell you the amount before processing.",
        ],
      },
      {
        heading: "Quality concerns",
        paragraphs: [
          "If delivered work does not meet the scope in your quotation, tell us within the revision window. We will correct it at no cost. If we cannot bring the work to the agreed standard, we refund the fee for that deliverable.",
        ],
      },
      {
        heading: "Not refundable",
        paragraphs: ["Some outcomes are outside our control and are not grounds for a refund."],
        bullets: [
          "The result of a submission, application, grade or funding decision.",
          "Changes to your requirements after the quotation was approved.",
          "Delays caused by information we requested and did not receive.",
        ],
      },
      {
        heading: "How to request",
        paragraphs: [
          `Raise the request from the project page or email ${siteConfig.contactEmail}. Approved refunds are returned through the original payment method.`,
        ],
      },
    ],
  },

  "acceptable-use": {
    title: "Acceptable use policy",
    summary: "What the platform may and may not be used for.",
    updated,
    sections: [
      {
        heading: "Permitted use",
        paragraphs: [
          "The platform is for requesting and managing professional writing, research, editing, proofreading, documentation and publishing services.",
        ],
      },
      {
        heading: "Prohibited use",
        paragraphs: ["You must not use the platform to:"],
        bullets: [
          "Submit material you do not have the right to share.",
          "Request work that breaches an institution's academic integrity rules, including sitting examinations or impersonating a student.",
          "Request content that is unlawful, defamatory, discriminatory or intended to deceive.",
          "Attempt to access another customer's projects, files or account.",
          "Upload malicious files or attempt to disrupt the service.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "We may decline or stop work, suspend an account, or report unlawful activity where this policy is breached. Where we decline work before production begins, you are refunded.",
        ],
      },
    ],
  },
} satisfies Record<string, LegalDocument>;

export type LegalSlug = keyof typeof legalDocuments;
export const legalSlugs = Object.keys(legalDocuments) as LegalSlug[];
