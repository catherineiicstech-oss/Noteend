import { prisma } from "@/server/db";

export function listPublicCategories() {
  return prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { pricingRules: { where: { isActive: true }, take: 1 } },
      },
    },
  });
}

export function listPublicServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
    include: {
      category: true,
      pricingRules: { where: { isActive: true }, take: 1 },
    },
  });
}

export function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      pricingRules: {
        where: { isActive: true },
        take: 1,
        include: { complexityMultipliers: true, rushMultipliers: true },
      },
    },
  });
}

export function listIndustries() {
  return prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
}

export function getIndustryBySlug(slug: string) {
  return prisma.industry.findFirst({ where: { slug, isActive: true } });
}

export function listFaqs(topic?: string) {
  return prisma.faq.findMany({
    where: { isActive: true, ...(topic ? { topic } : {}) },
    orderBy: { position: "asc" },
  });
}

export function listArticles(limit?: number) {
  return prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: { author: { select: { name: true } } },
  });
}

export function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, isPublished: true },
    include: { author: { select: { name: true } } },
  });
}

export function listPlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });
}

export function listPackages() {
  return prisma.servicePackage.findMany({
    where: { isActive: true },
    include: { items: { include: { service: { select: { name: true } } } } },
  });
}

/// Only genuine, published testimonials are shown; placeholder rows exist for
/// admin previews and are never rendered publicly.
export function listPublishedTestimonials() {
  return prisma.testimonial.findMany({
    where: { isPublished: true, isPlaceholder: false },
    orderBy: { position: "asc" },
  });
}
