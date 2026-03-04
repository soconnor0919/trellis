import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1).default("db.sqlite"),
    BETTER_AUTH_SECRET: z.string().min(32),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    EMAIL_SMTP_HOST: z.string().optional(),
    EMAIL_SMTP_PORT: z.coerce.number().optional(),
    EMAIL_SMTP_USER: z.string().optional(),
    EMAIL_SMTP_PASS: z.string().optional(),
    EMAIL_FROM:      z.string().optional(),
    EMAIL_TO:        z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER,
    EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS,
    EMAIL_FROM:      process.env.EMAIL_FROM,
    EMAIL_TO:        process.env.EMAIL_TO,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
