import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_SECRET: z.string().min(10),
  NEXTAUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  APP_ENCRYPTION_KEY: z.string().min(16),
  SNIPEIT_BASE_URL: z.string().url().optional().or(z.literal("")),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
  SNIPEIT_BASE_URL: process.env.SNIPEIT_BASE_URL,
});
