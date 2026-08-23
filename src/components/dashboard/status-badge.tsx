import { ProjectStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "@/components/ui";
import { STATUS_LABELS } from "@/server/services/workflow";

const tones: Record<ProjectStatus, BadgeTone> = {
  DRAFT: "neutral",
  QUOTE_REQUESTED: "info",
  QUOTE_SENT: "info",
  AWAITING_CUSTOMER_APPROVAL: "warning",
  AWAITING_PAYMENT: "warning",
  PAID: "success",
  AWAITING_ASSIGNMENT: "warning",
  ASSIGNED: "info",
  IN_PROGRESS: "info",
  EDITOR_SUBMITTED: "info",
  QA_REVIEW: "info",
  REVISION_REQUIRED: "danger",
  FINAL_REVIEW: "info",
  COMPLETED: "success",
  DELIVERED: "success",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={tones[status]}>{STATUS_LABELS[status]}</Badge>;
}
