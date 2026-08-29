export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Scriptor",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
    "Professional Writing, Research, Editing & Documentation",
  description:
    "Professional writing, research, editing, proofreading and documentation services for NGOs, government, universities, law firms and businesses across Uganda and Africa.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+256 000 000 000",
  addressLocality: "Kampala",
  addressCountry: "UG",
} as const;

export const promise =
  "You provide the information. We turn it into professional, clear, credible and submission-ready content.";
