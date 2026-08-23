import { ProjectStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  CUSTOMER_TRACKER_STEPS,
  STATUS_LABELS,
  canTransition,
  trackerIndex,
} from "@/server/services/workflow";

describe("project lifecycle", () => {
  it("requires payment before production starts", () => {
    expect(canTransition("AWAITING_PAYMENT", "IN_PROGRESS")).toBe(false);
    expect(canTransition("AWAITING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PAID", "AWAITING_ASSIGNMENT")).toBe(true);
  });

  it("routes submitted work through QA before completion", () => {
    expect(canTransition("EDITOR_SUBMITTED", "COMPLETED")).toBe(false);
    expect(canTransition("EDITOR_SUBMITTED", "QA_REVIEW")).toBe(true);
    expect(canTransition("QA_REVIEW", "REVISION_REQUIRED")).toBe(true);
  });

  it("treats closed and cancelled as terminal", () => {
    expect(ALLOWED_TRANSITIONS.CLOSED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("covers every status in the transition map and labels", () => {
    for (const status of Object.values(ProjectStatus)) {
      expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("maps every status to a customer tracker step", () => {
    for (const status of Object.values(ProjectStatus)) {
      if (status === ProjectStatus.CANCELLED) continue;
      const step = CUSTOMER_TRACKER_STEPS.find((entry) => entry.statuses.includes(status));
      expect(step, `${status} has no tracker step`).toBeDefined();
    }
    expect(trackerIndex("DELIVERED")).toBe(CUSTOMER_TRACKER_STEPS.length - 1);
  });
});
