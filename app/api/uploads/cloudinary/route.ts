import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_BUCKET,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/documents/shared";
import { assertViewerCanAccessLoan } from "@/lib/services/loan-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentViewerSession } from "@/lib/services/viewer-session";

const uploadSchema = z.object({
  loanId: z.string().uuid(),
});

function getFileExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return name.slice(dotIndex).toLowerCase();
}

function isAllowedFile(file: File) {
  const extension = getFileExtension(file.name);
  return (
    (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type) ||
    (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)
  );
}

function sanitizePublicIdBase(name: string) {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  const cleaned = withoutExtension
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned.slice(0, 80) || "document";
}

function sanitizeStorageFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function signCloudinaryUpload(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

function ensureCloudinaryConfig() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}

async function uploadToSupabaseFallback(file: File, loanId: string, userId: string) {
  const storagePath = `${userId}/${loanId}/${Date.now()}-${sanitizeStorageFileName(file.name)}`;
  const supabase = createSupabaseAdminClient();
  const upload = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  return {
    storagePath,
    provider: "supabase" as const,
    bytes: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function POST(request: Request) {
  const { user, role } = await getCurrentViewerSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const formData = await request.formData();
  const parsedInput = uploadSchema.safeParse({
    loanId: formData.get("loanId"),
  });

  if (!parsedInput.success) {
    return NextResponse.json({ ok: false, error: "Invalid loan upload request." }, { status: 400 });
  }

  const accessibleLoan = await assertViewerCanAccessLoan(parsedInput.data.loanId, {
    userId: user.id,
    role,
  });

  if (!accessibleLoan) {
    return NextResponse.json(
      { ok: false, error: "You do not have access to this loan." },
      { status: 403 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file was provided." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ ok: false, error: "Uploaded file is empty." }, { status: 400 });
  }

  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported file type. Use PDF, JPG, or PNG files only." },
      { status: 400 },
    );
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File too large. Upload files up to 50MB each." },
      { status: 400 },
    );
  }

  if (!ensureCloudinaryConfig()) {
    try {
      const fallback = await uploadToSupabaseFallback(file, parsedInput.data.loanId, user.id);
      return NextResponse.json(
        {
          ok: true,
          upload: fallback,
        },
        { status: 200 },
      );
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Supabase upload fallback failed.",
        },
        { status: 502 },
      );
    }
  }

  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${parsedInput.data.loanId}/${user.id}`;
  const publicId = `${sanitizePublicIdBase(file.name)}-${randomUUID().slice(0, 8)}`;
  const signature = signCloudinaryUpload(
    {
      folder,
      public_id: publicId,
      timestamp,
    },
    env.CLOUDINARY_API_SECRET as string,
  );

  const uploadBody = new FormData();
  uploadBody.set("file", file);
  uploadBody.set("api_key", env.CLOUDINARY_API_KEY as string);
  uploadBody.set("timestamp", timestamp);
  uploadBody.set("folder", folder);
  uploadBody.set("public_id", publicId);
  uploadBody.set("signature", signature);

  const cloudName = env.CLOUDINARY_CLOUD_NAME as string;
  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: uploadBody,
    },
  );

  const uploadResult = (await uploadResponse.json().catch(() => null)) as
    | {
        secure_url?: string;
        public_id?: string;
        bytes?: number;
        error?: { message?: string };
      }
    | null;

  if (!uploadResponse.ok) {
    try {
      const fallback = await uploadToSupabaseFallback(file, parsedInput.data.loanId, user.id);
      return NextResponse.json(
        {
          ok: true,
          upload: fallback,
          warning: uploadResult?.error?.message ?? "Cloudinary upload failed. Used fallback.",
        },
        { status: 200 },
      );
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            uploadResult?.error?.message ??
            (error instanceof Error ? error.message : "Cloudinary and fallback uploads failed."),
        },
        { status: 502 },
      );
    }
  }

  if (!uploadResult?.secure_url) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cloudinary upload succeeded but no file URL was returned.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      upload: {
        storagePath: uploadResult.secure_url,
        provider: "cloudinary",
        publicId: uploadResult.public_id ?? publicId,
        url: uploadResult.secure_url,
        bytes: uploadResult.bytes ?? file.size,
        mimeType: file.type || "application/octet-stream",
      },
    },
    { status: 200 },
  );
}
