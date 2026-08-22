import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export type BankDetails = {
  accountName: string;
  bank: string;
  accountNumber: string;
  branch: string;
};

export type SettingShape = {
  "billing.currency": string;
  "billing.taxPercent": number;
  "billing.taxLabel": string;
  "billing.invoiceDueDays": number;
  "billing.bankDetails": BankDetails;
  "documents.retentionDays": number;
  "documents.allowedMimeTypes": string[];
  "workflow.requireQaForPremium": boolean;
  "workflow.defaultTurnaroundHours": number;
  "notifications.enabled": boolean;
};

/// Application configuration lives in the database so an administrator can
/// change behaviour without a code change or deploy.
export const SETTING_DEFAULTS: SettingShape = {
  "billing.currency": "UGX",
  "billing.taxPercent": 18,
  "billing.taxLabel": "VAT",
  "billing.invoiceDueDays": 14,
  "billing.bankDetails": {
    accountName: "Not configured",
    bank: "Not configured",
    accountNumber: "Not configured",
    branch: "Not configured",
  },
  "documents.retentionDays": 365,
  "documents.allowedMimeTypes": [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
  ],
  "workflow.requireQaForPremium": true,
  "workflow.defaultTurnaroundHours": 72,
  "notifications.enabled": true,
};

export type SettingKey = keyof SettingShape;

export async function getSetting<K extends SettingKey>(
  key: K,
  fallback?: SettingShape[K],
): Promise<SettingShape[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value as SettingShape[K];
  return fallback ?? SETTING_DEFAULTS[key];
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.setting.findMany();
  const values: Record<string, unknown> = { ...SETTING_DEFAULTS };
  for (const row of rows) values[row.key] = row.value;
  return values;
}

export async function setSetting(key: string, value: Prisma.InputJsonValue): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
