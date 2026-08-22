import { z } from "zod";

const booleanish = z
  .string()
  .optional()
  .transform((value) => value === "true" || value === "1");

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  STORAGE_DRIVER: z.enum(["s3", "local"]).default("s3"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("scriptor-documents"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: booleanish,
  S3_SIGNED_URL_TTL: z.coerce.number().int().positive().default(120),
  LOCAL_STORAGE_DIR: z.string().default(".storage"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26_214_400),
  MAIL_DRIVER: z.enum(["log", "smtp"]).default("log"),
  MAIL_FROM: z.string().default("Scriptor <no-reply@example.com>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  PAYMENT_PROVIDERS: z.string().default("manual_bank_transfer,mobile_money_stub"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_TENANT_ID: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/// Validated server-only configuration. Throws on boot when misconfigured.
export function env(): ServerEnv {
  if (!cached) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid environment configuration -> ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function enabledPaymentProviders(): string[] {
  return env()
    .PAYMENT_PROVIDERS.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
