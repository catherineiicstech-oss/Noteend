import {
  demoArticles,
  demoCategories,
  demoFaqs,
  demoIndustries,
  demoPlans,
  demoServices,
  demoTestimonials,
} from "@/lib/demo-data";

/**
 * The UI showcase branch deliberately serves its catalogue from memory.
 * Keeping the same service API means the production-backed pages need no
 * special rendering path while the demo remains completely database-free.
 */
export async function listPublicCategories() {
  return demoCategories;
}

export async function listPublicServices() {
  return demoServices;
}

export async function getServiceBySlug(slug: string) {
  return demoServices.find((service) => service.slug === slug) ?? null;
}

export async function listIndustries() {
  return demoIndustries;
}

export async function getIndustryBySlug(slug: string) {
  return demoIndustries.find((industry) => industry.slug === slug) ?? null;
}

export async function listFaqs(topic?: string) {
  return topic ? demoFaqs.filter((faq) => faq.topic === topic) : demoFaqs;
}

export async function listArticles(limit?: number) {
  return typeof limit === "number" ? demoArticles.slice(0, limit) : demoArticles;
}

export async function getArticleBySlug(slug: string) {
  return demoArticles.find((article) => article.slug === slug) ?? null;
}

export async function listPlans() {
  return demoPlans;
}

export async function listPackages() {
  return [];
}

export async function listPublishedTestimonials() {
  return demoTestimonials;
}
