import { S3Client } from "@aws-sdk/client-s3";

export const s3Config = {
  region: process.env.S3_REGION || "",
  bucket: process.env.S3_BUCKET || "",
  accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || "",
};

export function isS3Configured(): boolean {
  return Boolean(
    s3Config.region &&
      s3Config.bucket &&
      s3Config.accessKeyId &&
      s3Config.secretAccessKey
  );
}

export function createS3Client(): S3Client {
  return new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
  });
}

export function buildPublicS3Url(key: string): string {
  if (s3Config.publicBaseUrl) {
    return `${s3Config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}
