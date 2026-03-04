import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/lib/auth";
import {
  buildPublicS3Url,
  createS3Client,
  isS3Configured,
  s3Config,
} from "@/lib/s3";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const AGGRESSIVE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function safeFileExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) return "jpg";
  return match[1].slice(0, 8);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "S3 is not configured on this deployment." },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => null);
  const fileName = String(body?.fileName || "upload.jpg");
  const contentType = String(body?.contentType || "");
  const fileSize = Number(body?.fileSize || 0);

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }
  if (!fileSize || fileSize > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image must be smaller than 5MB." },
      { status: 400 }
    );
  }

  const extension = safeFileExtension(fileName);
  const key = `uploads/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const s3 = createS3Client();

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: AGGRESSIVE_CACHE_CONTROL,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
  const fileUrl = buildPublicS3Url(key);
  const fileUrlHost = (() => {
    try {
      return new URL(fileUrl).host;
    } catch {
      return "unknown";
    }
  })();

  return NextResponse.json({
    uploadUrl,
    fileUrl,
    method: "PUT",
    debug: {
      bucket: s3Config.bucket,
      key,
      fileUrlHost,
      usesPublicBaseUrl: Boolean(s3Config.publicBaseUrl),
    },
  });
}
