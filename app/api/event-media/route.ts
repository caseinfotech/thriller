import { env } from "cloudflare:workers";
import { mediaBackend, jsonResponse, mediaDatabase, mediaBucket, errorMessage } from "../../../lib/event-media";
import { validOrganizerKey } from "../../../lib/organizer";

export const dynamic = "force-dynamic";
type MediaRow = { id: string; content_type: string; file_size: number; contributor: string; caption: string; credit_contributor: number; created_at: string };

export async function GET() {
  if (env.SITES_BACKEND) {
    try {
      const response = await mediaBackend("/api/event-media");
      return new Response(response.body, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30, s-maxage=60", "X-Content-Type-Options": "nosniff" } });
    } catch (error) { return jsonResponse({ error: errorMessage(error) }, 503); }
  }
  try {
    const rows = (await mediaDatabase().prepare("SELECT id,content_type,file_size,contributor,caption,credit_contributor,created_at FROM event_media WHERE status='published' ORDER BY published_at DESC,id DESC LIMIT 300").all<MediaRow>()).results;
    return Response.json({ items: rows.map((item) => ({ id: item.id, type: item.content_type.startsWith("video/") ? "video" : "photo", contentType: item.content_type, size: item.file_size, contributor: item.credit_contributor ? item.contributor : "", caption: item.caption, createdAt: item.created_at, url: `/api/event-media/${item.id}` })) }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return jsonResponse({ error: errorMessage(error) }, 503); }
}
