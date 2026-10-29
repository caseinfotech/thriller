import { env } from "cloudflare:workers";
import { getOrganizer, validOrganizerKey } from "../../../../lib/organizer";
import { mediaBackend, mediaBucket, MEDIA_STORAGE_LIMIT_BYTES, errorMessage, jsonResponse, mediaDatabase } from "../../../../lib/event-media";

export const dynamic = "force-dynamic";
type MediaRow = { id: string; content_type: string; file_size: number; original_name: string; contributor: string; caption: string; credit_contributor: number; status: string; created_at: string; published_at: string | null };
const reply = (data: unknown, status = 200) => jsonResponse(data, status);

async function proxy(method: "GET" | "POST" | "DELETE", body?: unknown, id?: string) {
  const path = "/api/organizer/media" + (id ? `?id=${encodeURIComponent(id)}` : "");
  const response = await mediaBackend(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  return new Response(text, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

async function owner(request: Request) {
  if (env.SITES_BACKEND) return await getOrganizer() ? true : false;
  if (await getOrganizer()) return true;
  return await validOrganizerKey(request.headers.get("x-organizer-key"));
}

export async function GET(request: Request) {
  if (!await owner(request)) return reply({ error: "Organizer access required." }, 403);
  if (env.SITES_BACKEND) { try { return await proxy("GET"); } catch (error) { return reply({ error: errorMessage(error) }, 503); } }
  try {
    const rows = (await mediaDatabase().prepare("SELECT id,content_type,file_size,original_name,contributor,caption,credit_contributor,status,created_at,published_at FROM event_media ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'uploading' THEN 1 WHEN 'published' THEN 2 ELSE 3 END,created_at DESC LIMIT 500").all<MediaRow>()).results;
    const total = (await mediaDatabase().prepare("SELECT COALESCE(SUM(CASE WHEN status='uploading' THEN file_size*2 ELSE file_size END),0) AS bytes FROM event_media").first<{ bytes: number }>())?.bytes ?? 0;
    return reply({ items: rows.map((row) => ({ id: row.id, type: row.content_type.startsWith("video/") ? "video" : "photo", contentType: row.content_type, size: row.file_size, fileName: row.original_name, contributor: row.contributor, caption: row.caption, creditContributor: !!row.credit_contributor, status: row.status, createdAt: row.created_at, publishedAt: row.published_at, url: `/api/event-media/${row.id}?review=1` })), storageBytes: total, storageLimitBytes: MEDIA_STORAGE_LIMIT_BYTES });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}

export async function POST(request: Request) {
  if (!await owner(request)) return reply({ error: "Organizer access required." }, 403);
  let input: { id?: unknown; status?: unknown; caption?: unknown; contributor?: unknown; creditContributor?: unknown };
  try { input = await request.json() as typeof input; } catch { return reply({ error: "Invalid media update." }, 400); }
  const id = typeof input.id === "string" ? input.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ error: "Choose a valid submission." }, 400);
  const status = input.status;
  const caption = typeof input.caption === "string" ? input.caption.trim().slice(0, 300) : undefined;
  const contributor = typeof input.contributor === "string" ? input.contributor.trim().slice(0, 80) : undefined;
  if (status !== undefined && !["pending", "published", "rejected"].includes(String(status))) return reply({ error: "Choose pending, selected for album, or rejected." }, 400);
  const body = { id, status, caption, contributor, creditContributor: typeof input.creditContributor === "boolean" ? input.creditContributor : undefined };
  if (env.SITES_BACKEND) { try { return await proxy("POST", body); } catch (error) { return reply({ error: errorMessage(error) }, 503); } }
  try {
    const db = mediaDatabase();
    const existing = await db.prepare("SELECT status FROM event_media WHERE id=?").bind(id).first<{ status: string }>();
    if (!existing || existing.status === "uploading") return reply({ error: "This submission is not ready to manage." }, 404);
    await db.prepare("UPDATE event_media SET status=COALESCE(?,status),caption=COALESCE(?,caption),contributor=COALESCE(?,contributor),credit_contributor=COALESCE(?,credit_contributor),published_at=CASE WHEN ?='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) WHEN ?='pending' OR ?='rejected' THEN NULL ELSE published_at END WHERE id=?").bind(status ?? null, caption ?? null, contributor ?? null, typeof input.creditContributor === "boolean" ? (input.creditContributor ? 1 : 0) : null, status ?? null, status ?? null, status ?? null, id).run();
    return reply({ status: "updated", id });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}

export async function DELETE(request: Request) {
  if (!await owner(request)) return reply({ error: "Organizer access required." }, 403);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ error: "Choose a valid submission." }, 400);
  if (env.SITES_BACKEND) { try { return await proxy("DELETE", undefined, id); } catch (error) { return reply({ error: errorMessage(error) }, 503); } }
  try {
    const db = mediaDatabase(), row = await db.prepare("SELECT object_key,part_count FROM event_media WHERE id=?").bind(id).first<{ object_key: string; part_count: number }>();
    if (!row) return reply({ status: "removed" });
    const bucket = mediaBucket();
    await Promise.all([bucket.delete(row.object_key), ...Array.from({ length: row.part_count }, (_, part) => bucket.delete(`staging/${id}/${part}`))]);
    await db.prepare("DELETE FROM event_media WHERE id=?").bind(id).run();
    return reply({ status: "removed", id });
  } catch (error) { return reply({ error: errorMessage(error) }, 503); }
}
