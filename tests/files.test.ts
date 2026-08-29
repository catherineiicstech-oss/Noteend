import { describe, expect, it } from "vitest";
import { sanitiseFilename } from "@/server/services/files";

describe("sanitiseFilename", () => {
  it("strips directory traversal", () => {
    expect(sanitiseFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitiseFilename("/tmp/report.docx")).toBe("report.docx");
  });

  it("replaces characters that are unsafe in storage keys", () => {
    expect(sanitiseFilename("my report;rm -rf.docx")).toBe("my report_rm -rf.docx");
  });

  it("keeps the name within a safe length", () => {
    expect(sanitiseFilename(`${"a".repeat(400)}.pdf`).length).toBeLessThanOrEqual(180);
  });

  it("falls back to a default name", () => {
    expect(sanitiseFilename("///")).toBe("document");
  });
});
