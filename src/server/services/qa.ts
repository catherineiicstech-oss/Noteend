import { ProjectStatus, type QAOutcome } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Actor } from "@/server/auth/session";
import { NotFoundError, WorkflowError } from "@/lib/errors";
import { assertPermission, canReviewQA } from "@/server/policies";
import { recordAudit } from "@/server/services/audit";
import {
  loadProjectContext,
  recordEvent,
  transitionProject,
} from "@/server/services/projects";
import { notify } from "@/server/services/notifications";

/// The standardised QA checklist from the service handbook. Stored per review
/// so that changing the template does not rewrite historical reviews.
export const QA_CHECKLIST_TEMPLATE: { section: string; label: string }[] = [
  { section: "Language", label: "Grammar" },
  { section: "Language", label: "Spelling" },
  { section: "Language", label: "Punctuation" },
  { section: "Language", label: "Sentence clarity" },
  { section: "Consistency", label: "Names" },
  { section: "Consistency", label: "Terminology" },
  { section: "Consistency", label: "Numbers" },
  { section: "Consistency", label: "Headings" },
  { section: "Consistency", label: "Formatting" },
  { section: "Structure", label: "Logical flow" },
  { section: "Structure", label: "Sections" },
  { section: "Structure", label: "Transitions" },
  { section: "Structure", label: "Argument" },
  { section: "Requirements", label: "Client instructions" },
  { section: "Requirements", label: "Donor requirements" },
  { section: "Requirements", label: "Citation requirements" },
  { section: "Requirements", label: "Formatting requirements" },
  { section: "Final", label: "File opens correctly" },
  { section: "Final", label: "Formatting intact" },
  { section: "Final", label: "No missing sections" },
  { section: "Final", label: "No tracked changes left in error" },
  { section: "Final", label: "Final version correct" },
];

export async function startQaReview(actor: Actor, projectId: string) {
  const context = await loadProjectContext(projectId);
  assertPermission(canReviewQA(actor, context), "You are not the QA reviewer on this project");

  const existing = await prisma.qAReview.findFirst({
    where: { projectId, reviewerId: actor.id, submittedAt: null },
    include: { items: true },
  });
  if (existing) return existing;

  const review = await prisma.qAReview.create({
    data: {
      projectId,
      reviewerId: actor.id,
      items: {
        create: QA_CHECKLIST_TEMPLATE.map((item, index) => ({
          section: item.section,
          label: item.label,
          position: index,
        })),
      },
    },
    include: { items: true },
  });

  if (context.status === ProjectStatus.EDITOR_SUBMITTED) {
    await transitionProject(actor, projectId, ProjectStatus.QA_REVIEW);
  }
  await recordEvent(projectId, actor.id, "qa.started", "QA review started");
  return review;
}

export async function updateChecklistItem(
  actor: Actor,
  itemId: string,
  data: { checked?: boolean; note?: string },
) {
  const item = await prisma.qAChecklistItem.findUnique({
    where: { id: itemId },
    include: { review: true },
  });
  if (!item) throw new NotFoundError("Checklist item not found");
  if (item.review.submittedAt) throw new WorkflowError("This review is already submitted");

  const context = await loadProjectContext(item.review.projectId);
  assertPermission(canReviewQA(actor, context), "You are not the QA reviewer on this project");

  return prisma.qAChecklistItem.update({ where: { id: itemId }, data });
}

export async function submitQaReview(
  actor: Actor,
  reviewId: string,
  outcome: QAOutcome,
  comments?: string,
) {
  const review = await prisma.qAReview.findUnique({
    where: { id: reviewId },
    include: { items: true },
  });
  if (!review) throw new NotFoundError("QA review not found");
  if (review.submittedAt) throw new WorkflowError("This review is already submitted");

  const context = await loadProjectContext(review.projectId);
  assertPermission(canReviewQA(actor, context), "You are not the QA reviewer on this project");

  if (outcome === "PASS" && review.items.some((item) => !item.checked)) {
    throw new WorkflowError("Every checklist item must be checked before passing a review");
  }

  const submitted = await prisma.qAReview.update({
    where: { id: reviewId },
    data: { outcome, comments, submittedAt: new Date() },
  });

  await recordEvent(
    review.projectId,
    actor.id,
    "qa.submitted",
    `QA review completed: ${outcome.replace("_", " ").toLowerCase()}`,
  );
  await recordAudit({
    actorId: actor.id,
    action: "qa.submit",
    resourceType: "QAReview",
    resourceId: reviewId,
    metadata: { projectId: review.projectId, outcome },
  });

  if (outcome === "PASS") {
    await transitionProject(actor, review.projectId, ProjectStatus.FINAL_REVIEW);
  } else {
    await transitionProject(actor, review.projectId, ProjectStatus.REVISION_REQUIRED, {
      reason: comments,
    });
    const editors = await prisma.projectAssignment.findMany({
      where: { projectId: review.projectId, role: "EDITOR", unassignedAt: null },
    });
    for (const editor of editors) {
      await notify(editor.userId, {
        type: "qa.revision_required",
        title: "Revision requested by QA",
        body: comments ?? "QA has requested changes to your submission.",
        link: `/staff/projects/${review.projectId}`,
      });
    }
  }

  return submitted;
}
