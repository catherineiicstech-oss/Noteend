import { ProjectStatus } from "@prisma/client";

/// The 17-status lifecycle. Transitions not listed here are rejected, which is
/// what keeps business rules (payment before production, QA before completion)
/// from being bypassed by a stray status update.
export const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["QUOTE_REQUESTED", "CANCELLED"],
  QUOTE_REQUESTED: ["QUOTE_SENT", "CANCELLED"],
  QUOTE_SENT: ["AWAITING_CUSTOMER_APPROVAL", "CANCELLED"],
  AWAITING_CUSTOMER_APPROVAL: ["AWAITING_PAYMENT", "QUOTE_SENT", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["AWAITING_ASSIGNMENT", "CANCELLED"],
  AWAITING_ASSIGNMENT: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "AWAITING_ASSIGNMENT", "CANCELLED"],
  IN_PROGRESS: ["EDITOR_SUBMITTED", "CANCELLED"],
  EDITOR_SUBMITTED: ["QA_REVIEW", "IN_PROGRESS", "CANCELLED"],
  QA_REVIEW: ["REVISION_REQUIRED", "FINAL_REVIEW", "COMPLETED", "CANCELLED"],
  REVISION_REQUIRED: ["IN_PROGRESS", "CANCELLED"],
  FINAL_REVIEW: ["COMPLETED", "REVISION_REQUIRED", "CANCELLED"],
  COMPLETED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const CUSTOMER_TRACKER_STEPS: {
  label: string;
  statuses: ProjectStatus[];
}[] = [
  { label: "Request received", statuses: ["DRAFT", "QUOTE_REQUESTED"] },
  {
    label: "Quote",
    statuses: ["QUOTE_SENT", "AWAITING_CUSTOMER_APPROVAL"],
  },
  { label: "Payment", statuses: ["AWAITING_PAYMENT", "PAID"] },
  { label: "Assignment", statuses: ["AWAITING_ASSIGNMENT", "ASSIGNED"] },
  {
    label: "In production",
    statuses: ["IN_PROGRESS", "EDITOR_SUBMITTED", "REVISION_REQUIRED"],
  },
  { label: "Quality assurance", statuses: ["QA_REVIEW", "FINAL_REVIEW"] },
  { label: "Delivered", statuses: ["COMPLETED", "DELIVERED", "CLOSED"] },
];

export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function trackerIndex(status: ProjectStatus): number {
  const index = CUSTOMER_TRACKER_STEPS.findIndex((step) => step.statuses.includes(status));
  return index === -1 ? 0 : index;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  QUOTE_REQUESTED: "Quote requested",
  QUOTE_SENT: "Quote sent",
  AWAITING_CUSTOMER_APPROVAL: "Awaiting your approval",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  AWAITING_ASSIGNMENT: "Awaiting assignment",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  EDITOR_SUBMITTED: "Editor submitted",
  QA_REVIEW: "QA review",
  REVISION_REQUIRED: "Revision required",
  FINAL_REVIEW: "Final review",
  COMPLETED: "Completed",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

/// Statuses in which production work may legitimately be under way.
export const PRODUCTION_STATUSES: ProjectStatus[] = [
  ProjectStatus.ASSIGNED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.EDITOR_SUBMITTED,
  ProjectStatus.QA_REVIEW,
  ProjectStatus.REVISION_REQUIRED,
  ProjectStatus.FINAL_REVIEW,
];

export const OPEN_STATUSES: ProjectStatus[] = Object.values(ProjectStatus).filter(
  (status) =>
    status !== ProjectStatus.CLOSED &&
    status !== ProjectStatus.CANCELLED &&
    status !== ProjectStatus.DELIVERED,
);
