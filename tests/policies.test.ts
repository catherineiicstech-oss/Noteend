import { describe, expect, it } from "vitest";
import {
  canApproveQuote,
  canDownloadFile,
  canReviewQA,
  canSubmitEditorWork,
  canUploadFileKind,
  canViewProject,
  visibleMessageScopes,
} from "@/server/policies";
import { actor, project } from "./helpers/actors";

const editor = actor({ id: "editor-1", roles: ["EDITOR"] });
const customer = actor({ id: "owner-1" });

describe("project visibility", () => {
  it("hides unassigned projects from editors", () => {
    expect(canViewProject(editor, project())).toBe(false);
  });

  it("shows assigned projects to editors", () => {
    const assigned = project({
      assignments: [{ userId: "editor-1", role: "EDITOR", unassignedAt: null }],
    });
    expect(canViewProject(editor, assigned)).toBe(true);
  });

  it("ignores assignments that have been withdrawn", () => {
    const withdrawn = project({
      assignments: [{ userId: "editor-1", role: "EDITOR", unassignedAt: new Date() }],
    });
    expect(canViewProject(editor, withdrawn)).toBe(false);
  });

  it("lets project managers see everything", () => {
    expect(canViewProject(actor({ roles: ["PROJECT_MANAGER"] }), project())).toBe(true);
  });

  it("lets organisation members see their organisation's projects", () => {
    const orgProject = project({ ownerUserId: "someone-else", organizationId: "org-1" });
    const member = actor({ memberships: [{ organizationId: "org-1", role: "MEMBER" }] });
    expect(canViewProject(member, orgProject)).toBe(true);
  });
});

describe("message visibility", () => {
  it("never exposes internal notes to customers", () => {
    expect(visibleMessageScopes(customer, project())).toEqual(["CUSTOMER"]);
  });

  it("gives assigned staff both scopes", () => {
    const assigned = project({
      assignments: [{ userId: "editor-1", role: "EDITOR", unassignedAt: null }],
    });
    expect(visibleMessageScopes(editor, assigned)).toContain("INTERNAL");
  });
});

describe("file access", () => {
  it("blocks customers from files that are not marked customer visible", () => {
    expect(
      canDownloadFile(customer, project(), { kind: "WORKING", customerVisible: false }),
    ).toBe(false);
  });

  it("allows customers to download deliverables shared with them", () => {
    expect(
      canDownloadFile(customer, project(), { kind: "FINAL", customerVisible: true }),
    ).toBe(true);
  });

  it("blocks unassigned staff from project files", () => {
    expect(
      canDownloadFile(editor, project(), { kind: "FINAL", customerVisible: true }),
    ).toBe(false);
  });

  it("restricts editors to working and edited uploads", () => {
    const assigned = project({
      assignments: [{ userId: "editor-1", role: "EDITOR", unassignedAt: null }],
    });
    expect(canUploadFileKind(editor, assigned, "EDITED")).toBe(true);
    expect(canUploadFileKind(editor, assigned, "FINAL")).toBe(false);
  });

  it("restricts customers to source and reference uploads", () => {
    expect(canUploadFileKind(customer, project(), "ORIGINAL")).toBe(true);
    expect(canUploadFileKind(customer, project(), "FINAL")).toBe(false);
  });
});

describe("role separation", () => {
  it("keeps QA sign-off away from the editor who did the work", () => {
    const assigned = project({
      assignments: [{ userId: "editor-1", role: "EDITOR", unassignedAt: null }],
    });
    expect(canSubmitEditorWork(editor, assigned)).toBe(true);
    expect(canReviewQA(editor, assigned)).toBe(false);
  });

  it("only lets organisation admins approve quotes for an organisation", () => {
    const orgProject = project({ organizationId: "org-1", ownerUserId: "someone-else" });
    const member = actor({ memberships: [{ organizationId: "org-1", role: "MEMBER" }] });
    const admin = actor({ memberships: [{ organizationId: "org-1", role: "ADMIN" }] });
    expect(canApproveQuote(member, orgProject)).toBe(false);
    expect(canApproveQuote(admin, orgProject)).toBe(true);
  });
});
