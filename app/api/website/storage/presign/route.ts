import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_RAW_UPLOAD_BYTES,
  PRODUCT_IMAGES_BUCKET,
  TEMP_UPLOAD_PREFIX,
  UPLOAD_GENERIC_ERROR_EL,
  UPLOAD_SIZE_ERROR_EL,
} from "@/lib/website/constants";
import {
  isNextResponse,
  requireWebsiteAdmin,
} from "@/lib/website/require-website-admin";

export async function POST(request: Request) {
  const access = await requireWebsiteAdmin();
  if (isNextResponse(access)) return access;

  let body: { fileSize?: number };
  try {
    body = (await request.json()) as { fileSize?: number };
  } catch {
    return NextResponse.json({ error: UPLOAD_GENERIC_ERROR_EL }, { status: 400 });
  }

  const fileSize = Number(body.fileSize);
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: UPLOAD_GENERIC_ERROR_EL }, { status: 400 });
  }

  if (fileSize > MAX_RAW_UPLOAD_BYTES) {
    return NextResponse.json({ error: UPLOAD_SIZE_ERROR_EL }, { status: 413 });
  }

  const tempPath = `${TEMP_UPLOAD_PREFIX}/${randomUUID()}`;
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUploadUrl(tempPath);

  if (error || !data) {
    return NextResponse.json({ error: UPLOAD_GENERIC_ERROR_EL }, { status: 500 });
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
