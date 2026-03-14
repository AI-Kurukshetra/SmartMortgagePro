import { z } from "zod";

const urlSchema = z.string().url();
const nonEmptySchema = z.string().min(1);

function parseUrl(value: string | undefined, fallback: string) {
  const parsed = urlSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

function parseNonEmpty(value: string | undefined, fallback: string) {
  const parsed = nonEmptySchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

function parseOptionalNonEmpty(value: string | undefined) {
  const parsed = nonEmptySchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export const env = {
  NEXT_PUBLIC_APP_URL: parseUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3001",
  ),
  NEXT_PUBLIC_SUPABASE_URL: parseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "https://placeholder.supabase.co",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: parseNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "placeholder-anon-key",
  ),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  CLOUDINARY_CLOUD_NAME: parseOptionalNonEmpty(process.env.CLOUDINARY_CLOUD_NAME),
  CLOUDINARY_API_KEY: parseOptionalNonEmpty(process.env.CLOUDINARY_API_KEY),
  CLOUDINARY_API_SECRET: parseOptionalNonEmpty(process.env.CLOUDINARY_API_SECRET),
  CLOUDINARY_UPLOAD_FOLDER: parseNonEmpty(
    process.env.CLOUDINARY_UPLOAD_FOLDER,
    "smartmortgagepro/documents",
  ),
} as const;
