"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { getSession } from "@/lib/get-session";
import { getActiveOrgId } from "@/lib/get-active-org";
import { canPerformAction } from "@/lib/entitlements";
import { createId } from "@paralleldrive/cuid2";

// tier ke hisab se allowed formats aur max size
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/mp4"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB (misaal ke taur pe)

export async function getUploadUrl(fileName: string, fileType: string, fileSize: number) {
  // 1. Login check
  const session = await getSession();
  if (!session) throw new Error("Login zaroori");

  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("Koi org nahi");

  // 2. ⭐ ENTITLEMENT check — quota khatam to yahin rok do
  const check = await canPerformAction(orgId, "create_note");
  if (!check.allowed) {
    throw new Error(check.reason || "Limit khatam");
  }

  // 3. Format aur size check (presigned URL banane se PEHLE)
  if (!ALLOWED_TYPES.includes(fileType)) {
    throw new Error("Ye file format allowed nahi");
  }
  if (fileSize > MAX_SIZE_BYTES) {
    throw new Error("File bohot bari hai");
  }

  // 4. ⭐ Unique object key — org ke folder mein
  const objectKey = `${orgId}/${createId()}-${fileName}`;

  // 5. Presigned PUT URL banao (5 min ke liye valid)
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: objectKey,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  return { uploadUrl, objectKey };
}
