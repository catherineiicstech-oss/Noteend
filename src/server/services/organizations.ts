import { randomBytes } from "node:crypto";
import type { OrgRole } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  assertPermission,
  canManageOrganization,
  canViewOrganization,
} from "@/server/policies";
import { slugify } from "@/lib/reference";
import { recordAudit } from "@/server/services/audit";
import { queueEmail } from "@/server/services/notifications";
import { siteConfig } from "@/lib/site";

export async function createOrganization(
  actor: Actor,
  input: { name: string; industry?: string; country?: string; billingEmail?: string },
) {
  const base = slugify(input.name);
  if (!base) throw new ValidationError("Organization name is required");

  let slug = base;
  for (let attempt = 1; await prisma.organization.findUnique({ where: { slug } }); attempt++) {
    slug = `${base}-${attempt}`;
  }

  const organization = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      industry: input.industry,
      country: input.country ?? "Uganda",
      billingEmail: input.billingEmail,
      settings: { create: {} },
      members: { create: { userId: actor.id, role: "OWNER" } },
    },
    include: { settings: true },
  });

  await recordAudit({
    actorId: actor.id,
    action: "organization.create",
    resourceType: "Organization",
    resourceId: organization.id,
  });
  return organization;
}

export async function getOrganization(actor: Actor, organizationId: string) {
  assertPermission(
    canViewOrganization(actor, organizationId),
    "You cannot access this organization",
  );
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      settings: true,
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      styleGuides: true,
    },
  });
  if (!organization) throw new NotFoundError("Organization not found");
  return organization;
}

export async function inviteMember(
  actor: Actor,
  organizationId: string,
  email: string,
  role: OrgRole,
) {
  assertPermission(
    canManageOrganization(actor, organizationId),
    "Only organization administrators can invite members",
  );

  const normalised = email.trim().toLowerCase();
  const existing = await prisma.organizationMember.findFirst({
    where: { organizationId, user: { email: normalised } },
  });
  if (existing) throw new ValidationError("That person is already a member");

  const invitation = await prisma.invitation.create({
    data: {
      organizationId,
      email: normalised,
      role,
      token: randomBytes(24).toString("hex"),
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
    include: { organization: { select: { name: true } } },
  });

  await queueEmail(
    normalised,
    `You have been invited to ${invitation.organization.name} on ${siteConfig.name}`,
    `${actor.name} invited you to join ${invitation.organization.name}.\n\nAccept the invitation: ${siteConfig.url}/invitations/${invitation.token}`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "organization.invite",
    resourceType: "Invitation",
    resourceId: invitation.id,
    metadata: { organizationId, email: normalised, role },
  });
  return invitation;
}

export async function acceptInvitation(actor: Actor, token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new NotFoundError("Invitation not found");
  if (invitation.acceptedAt) throw new ValidationError("This invitation was already used");
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("This invitation has expired");
  }
  if (invitation.email !== actor.email.toLowerCase()) {
    throw new ValidationError("This invitation was issued to a different email address");
  }

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: actor.id,
        },
      },
      create: {
        organizationId: invitation.organizationId,
        userId: actor.id,
        role: invitation.role,
      },
      update: { role: invitation.role },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await recordAudit({
    actorId: actor.id,
    action: "organization.invitation_accepted",
    resourceType: "Organization",
    resourceId: invitation.organizationId,
  });
  return invitation;
}

export async function updateMemberRole(
  actor: Actor,
  organizationId: string,
  memberId: string,
  role: OrgRole,
) {
  assertPermission(
    canManageOrganization(actor, organizationId),
    "Only organization administrators can change roles",
  );
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member || member.organizationId !== organizationId) {
    throw new NotFoundError("Member not found");
  }
  if (member.role === "OWNER" && role !== "OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId, role: "OWNER" },
    });
    if (owners <= 1) throw new ValidationError("An organization must keep at least one owner");
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });
  await recordAudit({
    actorId: actor.id,
    action: "organization.member_role",
    resourceType: "OrganizationMember",
    resourceId: memberId,
    metadata: { organizationId, role },
  });
  return updated;
}

export async function removeMember(actor: Actor, organizationId: string, memberId: string) {
  assertPermission(
    canManageOrganization(actor, organizationId),
    "Only organization administrators can remove members",
  );
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member || member.organizationId !== organizationId) {
    throw new NotFoundError("Member not found");
  }
  if (member.role === "OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId, role: "OWNER" },
    });
    if (owners <= 1) throw new ValidationError("An organization must keep at least one owner");
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });
  await recordAudit({
    actorId: actor.id,
    action: "organization.member_removed",
    resourceType: "OrganizationMember",
    resourceId: memberId,
    metadata: { organizationId },
  });
}

export async function organizationUsage(actor: Actor, organizationId: string) {
  assertPermission(
    canViewOrganization(actor, organizationId),
    "You cannot access this organization",
  );

  const [projects, invoices, subscription] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        wordCount: true,
        createdAt: true,
        completedAt: true,
        deliveredAt: true,
        service: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId },
      select: { status: true, totalMinor: true, amountPaidMinor: true, currency: true },
    }),
    prisma.subscription.findFirst({
      where: { organizationId, status: "ACTIVE" },
      include: { plan: true },
    }),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const turnaroundHours = projects
    .filter((project) => project.deliveredAt)
    .map(
      (project) =>
        (project.deliveredAt!.getTime() - project.createdAt.getTime()) / 3_600_000,
    );

  return {
    activeProjects: projects.filter(
      (project) => !["DELIVERED", "CLOSED", "CANCELLED"].includes(project.status),
    ).length,
    completedProjects: projects.filter((project) =>
      ["COMPLETED", "DELIVERED", "CLOSED"].includes(project.status),
    ).length,
    wordsThisMonth: projects
      .filter((project) => project.createdAt >= monthStart)
      .reduce((sum, project) => sum + project.wordCount, 0),
    outstandingMinor: invoices
      .filter((invoice) => invoice.status === "ISSUED")
      .reduce((sum, invoice) => sum + invoice.totalMinor - invoice.amountPaidMinor, 0),
    spendMinor: invoices.reduce((sum, invoice) => sum + invoice.amountPaidMinor, 0),
    currency: invoices[0]?.currency ?? "UGX",
    averageTurnaroundHours: turnaroundHours.length
      ? Math.round(turnaroundHours.reduce((a, b) => a + b, 0) / turnaroundHours.length)
      : null,
    subscription,
    servicesUsed: Object.entries(
      projects.reduce<Record<string, number>>((acc, project) => {
        acc[project.service.name] = (acc[project.service.name] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, count]) => ({ name, count })),
  };
}
