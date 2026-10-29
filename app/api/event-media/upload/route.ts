import { env } from "cloudflare:workers";
import { mediaBackend, jsonResponse, sameOrigin, safeFileName, readJson, MEDIA_TYPES, MEDIA_CHUNK_BYTES, MEDIA_MAX_PHOTO_BYTES, MEDIA_MAX_VIDEO_BYTES, MEDIA_STORAGE_LIMIT_BYTES, MEDIA_DAILY_UPLOAD_LIMIT, mediaBucket, mediaDatabase, requestFingerprint, emailIdentityKey, errorMessage } from "../../../../lib/event-media";
import { validOrganizerKey } from "../../../../lib/organizer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const reply = (value: unknown, status = 200) => jsonResponse(value, status);
type NewUpload = { fileName: string; contentType: string; size: number; email?: string; contributor?: string; caption?: string; creditContributor?: boolean; consent?: boolean };
type UploadRow = { id: string; object_key: string; content_type: string; file_size: number; part_count: number; status: string };

async function proxy(request: Request) {
  const url = new URL(request.url);
  const path = `/api/event-media/upload${url.search}`;
  const headers = new Headers();
  for (const name of ["content-type", "x-media-id", "x-part-number", "x-forwarded-for"]) { const value = request.headers.get(name); if (value) headers.set(name, value); }
  const body = request.method === "POST" ? await request.arrayBuffer() : undefined;
  try {
    const response = await mediaBackend(path, { method: "POST", headers, body });
    return new Response(response.body, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") || "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Please submit from the event website." }, 403);
  if (env.SITES_BACKEND) return proxy(request);
  const internal = await validOrganizerKey(request.headers.get("x-organizer-key"));
  if (!request.headers.get("origin") && !internal) return reply({ error: "Please submit from the event website." }, 403);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id && url.searchParams.has("complete")) return completeUpload(id);
  if (id && url.searchParams.has("abort")) return abortUpload(id);
  if (id) return uploadPart(request, id, Number(request.headers.get("x-part-number")));

  const input = await readJson<NewUpload>(request, 4096);
  if (!input || typeof input.fileName !== "string" || typeof input.contentType !== "string" || typeof input.size !== "number" || typeof input.email !== "string" || input.consent !== true) return reply({ error: "Enter your email address and confirm you have permission to share these files." }, 400);
  const email = input.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "Enter a valid email address." }, 400);
  const contentType = input.contentType.toLowerCase().split(";")[0].trim();
  if (!MEDIA_TYPES.has(contentType)) return reply({ error: "Use a JPEG, PNG, WebP, GIF, MP4, WebM, or QuickTime file." }, 415);
  const isVideo = contentType.startsWith("video/");
  const maxSize = isVideo ? MEDIA_MAX_VIDEO_BYTES : MEDIA_MAX_PHOTO_BYTES;
  if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > maxSize) return reply({ error: `This ${isVideo ? "video" : "photo"} must be ${isVideo ? "100 MB" : "25 MB"} or smaller.` }, 413);
  const contributor = typeof input.contributor === "string" ? input.contributor.trim().slice(0, 80) : "";
  const caption = typeof input.caption === "string" ? input.caption.trim().slice(0, 300) : "";
  const idNew = crypto.randomUUID();
  const fileName = safeFileName(input.fileName);
  const partCount = Math.ceil(input.size / MEDIA_CHUNK_BYTES);
  let identityKey = "";
  let identityReserved = false;
  try {
    const db = mediaDatabase();
    const stale = (await db.prepare("SELECT id,object_key,part_count,submitter_key FROM event_media WHERE status='uploading' AND datetime(created_at) < datetime('now','-1 day') LIMIT 50").all<{ id: string; object_key: string; part_count: number; submitter_key: string }>()).results;
    for (const item of stale) {
      await Promise.all([mediaBucket().delete(item.object_key), ...Array.from({ length: item.part_count }, (_, part) => mediaBucket().delete(`staging/${item.id}/${part}`))]);
      await db.prepare("DELETE FROM event_media WHERE id=? AND status='uploading'").bind(item.id).run();
      await db.prepare("UPDATE event_media_submission_limits SET used=MAX(0,used-1) WHERE submitter_key=?").bind(item.submitter_key).run();
    }
    identityKey = await emailIdentityKey(email);
    const identity = await db.prepare("INSERT INTO event_media_submission_limits(submitter_key,used) VALUES (?,1) ON CONFLICT(submitter_key) DO UPDATE SET used=used+1 WHERE used < 3 RETURNING used").bind(identityKey).first<{ used: number }>();
    if (!identity) return reply({ error: "This email has reached the 3-file event limit." }, 429);
    identityReserved = true;
    const day = new Date().toISOString().slice(0, 10);
    const fingerprint = await requestFingerprint(request);
    const allowed = await db.prepare("INSERT INTO event_media_rate_limits(day,fingerprint,count) VALUES (?,?,1) ON CONFLICT(day,fingerprint) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count").bind(day, fingerprint, MEDIA_DAILY_UPLOAD_LIMIT).first<{ count: number }>();
    if (!allowed) { await db.prepare("UPDATE event_media_submission_limits SET used=MAX(0,used-1) WHERE submitter_key=?").bind(identityKey).run(); return reply({ error: "This connection has reached its daily upload limit. Try again tomorrow." }, 429); }
    const result = await db.prepare("INSERT INTO event_media(id,submitter_key,object_key,content_type,original_name,file_size,part_count,contributor,caption,credit_contributor,consented_at,status) SELECT ?,?,?,?,?,?,?,?,?,?,?,'uploading' WHERE (SELECT COALESCE(SUM(CASE WHEN status='uploading' THEN file_size*2 ELSE file_size END),0) FROM event_media) + ? <= ? RETURNING id").bind(idNew, identityKey, `event/${idNew}`, contentType, fileName, input.size, partCount, contributor, caption, input.creditContributor === true ? 1 : 0, new Date().toISOString(), input.size, MEDIA_STORAGE_LIMIT_BYTES).first<{ id: string }>();
    if (!result) { await db.prepare("UPDATE event_media_submission_limits SET used=MAX(0,used-1) WHERE submitter_key=?").bind(identityKey).run(); return reply({ error: "The event album has reached its free storage limit. Please contact the organizer." }, 413); }
    return reply({ id: idNew, chunkSize: MEDIA_CHUNK_BYTES, parts: partCount });
  } catch (error) { if (identityReserved && identityKey) await mediaDatabase().prepare("UPDATE event_media_submission_limits SET used=MAX(0,used-1) WHERE submitter_key=?").bind(identityKey).run().catch(() => undefined); return reply({ error: errorMessage(error) }, 503); }
}

async function uploadPart(request: Request, id: string, part: number) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(part) || part < 0) return reply({ error: "Upload part is invalid." }, 400);
  const length = Number(request.headers.get("content-length") || 0);
  if (length < 1 || length > MEDIA_CHUNK_BYTES) return reply({ error: "Upload part size is invalid." }, 413);
  try {
    const row = await mediaDatabase().prepare("SELECT id,object_key,content_type,file_size,part_count,status FROM event_media WHERE id=?").bind(id).first<UploadRow>();
    if (!row || row.status !== "uploading" || part >= row.part_count) return reply({ error: "This upload is no longer active." }, 404);
    const expected = Math.min(MEDIA_CHUNK_BYTES, row.file_size - part * MEDIA_CHUNK_BYTES);
    if (length !== expected) return reply({ error: "Upload part did not match the expected size." }, 400);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength !== expected) return reply({ error: "Upload part was incomplete." }, 400);
    await mediaBucket().put(`staging/${id}/${part}`, bytes, { httpMetadata: { contentType: "application/octet-stream" } });
    return reply({ status: "part_saved", part });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}

async function completeUpload(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ error: "Upload is invalid." }, 400);
  const db = mediaDatabase(), bucket = mediaBucket();
  try {
    const row = await db.prepare("SELECT id,object_key,content_type,file_size,part_count,status FROM event_media WHERE id=?").bind(id).first<UploadRow>();
    if (!row) return reply({ error: "Upload was not found." }, 404);
    if (row.status === "pending" || row.status === "published") return reply({ status: "submitted", id });
    if (row.status !== "uploading") return reply({ error: "Upload is no longer active." }, 409);
    const head = [] as { key: string; size: number }[];
    for (let part = 0; part < row.part_count; part++) {
      const key = `staging/${id}/${part}`;
      const object = await bucket.head(key);
      const expected = Math.min(MEDIA_CHUNK_BYTES, row.file_size - part * MEDIA_CHUNK_BYTES);
      if (!object || object.size !== expected) return reply({ error: `Upload is incomplete; part ${part + 1} needs to be retried.` }, 409);
      head.push({ key, size: expected });
    }
    let nextPart = 0;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          while (!reader && nextPart < head.length) {
            const object = await bucket.get(head[nextPart].key);
            if (!object?.body) throw new Error("Uploaded part disappeared before assembly.");
            reader = object.body.getReader();
          }
          if (!reader) { controller.close(); return; }
          const result = await reader.read();
          if (result.done) { reader = null; nextPart++; if (nextPart === head.length) controller.close(); return; }
          controller.enqueue(result.value);
        } catch (error) { controller.error(error); }
      },
      async cancel() { if (reader) await reader.cancel(); },
    });
    const saved = await bucket.put(row.object_key, stream, { httpMetadata: { contentType: row.content_type } });
    if (saved.size !== row.file_size) { await bucket.delete(row.object_key); return reply({ error: "The uploaded file could not be assembled completely." }, 500); }
    await Promise.all(head.map((item) => bucket.delete(item.key)));
    await db.prepare("UPDATE event_media SET status='pending' WHERE id=? AND status='uploading'").bind(id).run();
    return reply({ status: "submitted", id });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}

async function abortUpload(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ error: "Upload is invalid." }, 400);
  try {
    const db = mediaDatabase(), row = await db.prepare("SELECT part_count,status,submitter_key FROM event_media WHERE id=?").bind(id).first<{ part_count: number; status: string; submitter_key: string }>();
    if (!row) return reply({ status: "removed" });
    if (row.status !== "uploading") return reply({ error: "Submitted media must be removed from the organizer portal." }, 409);
    await Promise.all(Array.from({ length: row.part_count }, (_, part) => mediaBucket().delete(`staging/${id}/${part}`)));
    await db.prepare("DELETE FROM event_media WHERE id=? AND status='uploading'").bind(id).run();
    await db.prepare("UPDATE event_media_submission_limits SET used=MAX(0,used-1) WHERE submitter_key=?").bind(row.submitter_key).run();
    return reply({ status: "removed" });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}

export async function GET() { return reply({ error: "Use POST to submit event media." }, 405); }
