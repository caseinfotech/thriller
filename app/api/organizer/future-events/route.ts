import { env } from "cloudflare:workers";
import { getOrganizer, organizerAccessKey, signupDatabase } from "../../../../lib/organizer";
import { sitesOrigin } from "../../../../lib/sites-backend";
import { csvCell } from "../../../../lib/signup-csv";

export const dynamic = "force-dynamic";
type Contact = { id: string; email: string; name: string; created_at: string };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });

async function proxy(method: "GET" | "DELETE", query: string) {
  const token = process.env.SITES_SERVICE_TOKEN;
  const key = organizerAccessKey();
  if (!token || !key) throw new Error("Organizer backend unavailable");
  const upstream = await fetch(`${sitesOrigin}/api/organizer/future-events${query}`, {
    method,
    headers: { "OAI-Sites-Authorization": `Bearer ${token}`, "x-organizer-key": key },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  const contentType = upstream.headers.get("content-type") || "application/json";
  const headers = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Type": contentType });
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("Content-Disposition", disposition);
  return new Response(upstream.body, { status: upstream.status, headers });
}

async function authorized() {
  return !!await getOrganizer();
}

export async function GET(request: Request) {
  if (!await authorized()) return json({ error: "Organizer access required." }, 403);
  const url = new URL(request.url);
  if (env.SITES_BACKEND) {
    try { return await proxy("GET", url.searchParams.get("format") === "csv" ? "?format=csv" : ""); }
    catch { return json({ error: "Future event contacts are temporarily unavailable." }, 503); }
  }
  try {
    const rows = (await signupDatabase().prepare("SELECT id,email,name,created_at FROM future_event_contacts ORDER BY created_at DESC,id DESC").all<Contact>()).results;
    if (url.searchParams.get("format") === "csv") {
      const csv = "\uFEFF" + [["Email", "Name", "Joined (UTC)"], ...rows.map(row => [row.email, row.name, row.created_at])].map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="thriller-future-event-contacts.csv"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    }
    return json({ items: rows.map(row => ({ id: row.id, email: row.email, name: row.name, createdAt: row.created_at })) });
  } catch {
    return json({ error: "Future event contacts are temporarily unavailable." }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!await authorized()) return json({ error: "Organizer access required." }, 403);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Choose a valid contact." }, 400);
  if (env.SITES_BACKEND) {
    try { return await proxy("DELETE", `?id=${encodeURIComponent(id)}`); }
    catch { return json({ error: "The contact could not be removed." }, 503); }
  }
  try {
    await signupDatabase().prepare("DELETE FROM future_event_contacts WHERE id=?").bind(id).run();
    return json({ status: "removed", id });
  } catch {
    return json({ error: "The contact could not be removed." }, 503);
  }
}
