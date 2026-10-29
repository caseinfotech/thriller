import { env } from "cloudflare:workers";
import { mediaBackend, mediaBucket, mediaDatabase, errorMessage, jsonResponse } from "../../../../lib/event-media";
import { getOrganizer, validOrganizerKey } from "../../../../lib/organizer";

export const dynamic = "force-dynamic";
type Row = { object_key: string; content_type: string; file_size: number; original_name: string; status: string };
function parseRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  let offset: number, length: number;
  if (!match[1]) {
    const suffix = Number(match[2]); if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    length = Math.min(suffix, size); offset = size - length;
  } else {
    offset = Number(match[1]); const end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(end) || offset < 0 || end < offset || offset >= size) return null;
    length = Math.min(end, size - 1) - offset + 1;
  }
  return { offset, length, contentRange: `bytes ${offset}-${offset + length - 1}/${size}` };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const review = new URL(request.url).searchParams.get("review") === "1";
  if (review) {
    const owner = env.SITES_BACKEND ? await getOrganizer() : (await getOrganizer()) || await validOrganizerKey(request.headers.get("x-organizer-key"));
    if (!owner) return new Response("Organizer access required.", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (env.SITES_BACKEND) {
    try {
      const range = request.headers.get("range");
      const response = await mediaBackend(`/api/event-media/${id}${review ? "?review=1" : ""}`, { headers: range ? { Range: range } : undefined });
      const headers = new Headers({ "Content-Type": response.headers.get("content-type") || "application/octet-stream", "Content-Disposition": "inline", "Cache-Control": review ? "private, no-store" : "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" });
      for (const name of ["content-length", "content-range"]) { const value = response.headers.get(name); if (value) headers.set(name, value); }
      return new Response(response.body, { status: response.status, headers });
    } catch (error) { return new Response(errorMessage(error), { status: 503 }); }
  }
  try {
    const row = await mediaDatabase().prepare("SELECT object_key,content_type,file_size,original_name,status FROM event_media WHERE id=?").bind(id).first<Row>();
    if (!row || (row.status !== "published" && !(review && row.status !== "uploading"))) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    const rangeHeader = request.headers.get("range");
    const range = rangeHeader ? parseRange(rangeHeader, row.file_size) : null;
    if (rangeHeader && !range) return new Response("Requested byte range is invalid or unsupported.", { status: 416, headers: { "Content-Range": `bytes */${row.file_size}`, "Cache-Control": "no-store" } });
    const object = await mediaBucket().get(row.object_key, range ? { range: { offset: range.offset, length: range.length } } : undefined);
    if (!object?.body) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    const partial = !!range;
    const length = range?.length ?? row.file_size;
    const headers = new Headers({ "Content-Type": row.content_type, "Content-Length": String(length), "Content-Disposition": "inline", "Cache-Control": review ? "private, no-store" : "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin", "Accept-Ranges": "bytes" });
    if (range) headers.set("Content-Range", range.contentRange);
    return new Response(object.body, { status: partial ? 206 : 200, headers });
  } catch (error) { return new Response(errorMessage(error), { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
