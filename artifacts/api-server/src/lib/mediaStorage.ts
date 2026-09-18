import { randomUUID } from "node:crypto";
import { Storage, type File } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function getPrivateObjectDir() {
  const value = process.env.PRIVATE_OBJECT_DIR;
  if (!value) throw new Error("PRIVATE_OBJECT_DIR is not configured.");
  return value.replace(/\/$/, "");
}

function parseObjectPath(value: string) {
  const normalized = value.startsWith("/") ? value : `/${value}`;
  const [, bucketName, ...objectParts] = normalized.split("/");
  if (!bucketName || objectParts.length === 0) throw new Error("Invalid object path.");
  return { bucketName, objectName: objectParts.join("/") };
}

async function signObjectUrl(bucketName: string, objectName: string) {
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Failed to create upload URL: ${response.status}`);
  const data = (await response.json()) as { signed_url?: string };
  if (!data.signed_url) throw new Error("Upload URL was not returned.");
  return data.signed_url;
}

export async function createMediaUpload() {
  const objectName = `uploads/${randomUUID()}`;
  const { bucketName } = parseObjectPath(`${getPrivateObjectDir()}/${objectName}`);
  const uploadURL = await signObjectUrl(bucketName, objectName);
  return { uploadURL, objectPath: `/objects/${objectName}` };
}

export async function getMediaFile(objectPath: string): Promise<File> {
  if (!objectPath.startsWith("/objects/")) throw new Error("Invalid object path.");
  const objectName = objectPath.slice("/objects/".length);
  const { bucketName, objectName: parsedName } = parseObjectPath(`${getPrivateObjectDir()}/${objectName}`);
  const file = objectStorageClient.bucket(bucketName).file(parsedName);
  const [exists] = await file.exists();
  if (!exists) throw new Error("Object not found.");
  return file;
}