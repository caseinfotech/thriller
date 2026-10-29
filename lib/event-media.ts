import { env } from "cloudflare:workers";
import { organizerAccessKey } from "./organizer";
import { sitesOrigin } from "./sites-backend";

export const MEDIA_CHUNK_BYTES = 4 * 1024 * 1024;
export const MEDIA_MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
// Keep a margin beneath Cloudflare R2's 10 GB-month free allowance.
export const MEDIA_STORAGE_LIMIT_BYTES = 8 * 1024 * 1024 * 1024;
export const MEDIA_DAILY_UPLOAD_LIMIT = 8;
export const MEDIA_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
]);

export function mediaBucket(): R2Bucket {
  const bucket = (env as unknown as { MEDIA_BUCKET?: R2Bucket }).MEDIA_BUCKET;
  if (!bucket) throw new Error("Event media storage is not configured.");
  return bucket;
}

export function mediaDatabase() {
  if (!env.DB) throw new Error("Event media database is not configured.");
  return env.DB;
}

export async function mediaBackend(path: string, init: RequestInit = {}) {
  const token = process.env.SITES_SERVICE_TOKEN;
  const key = organizerAccessKey();
  if (!token || !key) throw new Error("Event media service is not configured.");
  const headers = new Headers(init.headers);
  headers.set("OAI-Sites-Authorization", `Bearer ${token}`);
  headers.set("x-organizer-key", key);
  return fetch(`${sitesOrigin}${path}`, {
    ...init,
    headers,
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(60000),
  });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function safeFileName(value: string) {
  const name = value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").trim() ?? "";
  return name.slice(0, 160) || "event-media";
}

export async function readJson<T>(request: Request, maxBytes = 4096): Promise<T | null> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) return null;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > maxBytes) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function requestFingerprint(request: Request) {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function emailIdentityKey(email: string) {
  const secret = organizerAccessKey();
  if (!secret) throw new Error("Event media privacy key is not configured.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.trim().toLowerCase()));
  return [...new Uint8Array(signature)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

export function errorMessage(error: unknown) {
  return error instanceof Error && error.message.startsWith("Event media") ? error.message : "Event media is temporarily unavailable. Please try again.";
}
