import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  verificationToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(async (operations: unknown[]) => operations),
};

const queueEmail = vi.fn();
const recordAudit = vi.fn();

vi.mock("@/server/db", () => ({ prisma: db }));
vi.mock("@/server/services/notifications", () => ({ queueEmail }));
vi.mock("@/server/services/audit", () => ({ recordAudit }));
vi.mock("@/server/auth/password", () => ({
  hashPassword: async (plain: string) => `hashed:${plain}`,
}));
vi.mock("@/lib/env", () => ({ env: () => ({ NEXTAUTH_URL: "https://example.test" }) }));

const { completePasswordSetup, issuePasswordSetupToken } = await import(
  "@/server/services/account-access"
);

function tokenFromEmail(): string {
  const url = String(queueEmail.mock.calls[0][2]).match(/https:\/\/\S+/)?.[0] ?? "";
  return new URL(url).searchParams.get("token") ?? "";
}

describe("password setup links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ id: "user_1" });
    db.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
    db.verificationToken.create.mockResolvedValue({});
  });

  it("stores only a hash of the emailed token", async () => {
    await issuePasswordSetupToken("guest@example.com", "CLAIM");

    const token = tokenFromEmail();
    const stored = db.verificationToken.create.mock.calls[0][0].data.token;
    expect(token.length).toBeGreaterThan(30);
    expect(stored).not.toBe(token);
    expect(stored).toBe(createHash("sha256").update(token).digest("hex"));
  });

  it("replaces any earlier link for the same address", async () => {
    await issuePasswordSetupToken("guest@example.com", "RESET");
    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "guest@example.com" },
    });
  });

  it("expires the link within three days", async () => {
    await issuePasswordSetupToken("guest@example.com", "CLAIM");
    const { expires } = db.verificationToken.create.mock.calls[0][0].data;
    const hours = (expires.getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(1);
    expect(hours).toBeLessThanOrEqual(72);
  });

  it("says nothing and sends nothing for an unknown address", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(issuePasswordSetupToken("nobody@example.com", "RESET")).resolves.toBeUndefined();
    expect(queueEmail).not.toHaveBeenCalled();
    expect(db.verificationToken.create).not.toHaveBeenCalled();
  });
});

describe("completing password setup", () => {
  const token = "plain-token-value";
  const record = {
    identifier: "guest@example.com",
    token: createHash("sha256").update(token).digest("hex"),
    expires: new Date(Date.now() + 3_600_000),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ id: "user_1" });
    db.verificationToken.findUnique.mockResolvedValue(record);
  });

  it("sets the password and clears the token in one transaction", async () => {
    await completePasswordSetup("guest@example.com", token, "a-long-passphrase");

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { passwordHash: "hashed:a-long-passphrase", emailVerified: expect.any(Date) },
    });
    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "guest@example.com" },
    });
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.password_set", actorId: "user_1" }),
    );
  });

  it("rejects an unknown token", async () => {
    db.verificationToken.findUnique.mockResolvedValue(null);
    await expect(
      completePasswordSetup("guest@example.com", token, "a-long-passphrase"),
    ).rejects.toThrow(/expired/i);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    db.verificationToken.findUnique.mockResolvedValue({
      ...record,
      expires: new Date(Date.now() - 1_000),
    });
    await expect(
      completePasswordSetup("guest@example.com", token, "a-long-passphrase"),
    ).rejects.toThrow(/expired/i);
  });

  it("rejects a token issued for a different address", async () => {
    await expect(
      completePasswordSetup("someone.else@example.com", token, "a-long-passphrase"),
    ).rejects.toThrow(/expired/i);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
