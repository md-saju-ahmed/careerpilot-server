import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z
    .string()
    .default("5000")
    .transform((val) => Number(val))
    .pipe(z.number().int().positive()),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (MongoDB connection string)"),

  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),

  GEMINI_API_KEY: z.string().optional(),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid/missing environment variables:\n${details}\n\n` +
        `Copy .env.example to .env and fill these in before starting the server.`,
    );
  }

  return result.data;
}

export const env = loadEnv();
