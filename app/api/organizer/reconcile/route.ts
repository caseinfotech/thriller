import { env } from "cloudflare:workers";
import { getOrganizer, organizerAccessKey, signupDatabase } from "../../../../lib/organizer";
import { sitesOrigin } from "../../../../lib/sites-backend";
import { reconciliationSchema, buildReconciliation, reconciliationStatements, signupsSnapshotSql, attendanceSnapshotSql, type RegistrationRow, type AttendanceRow } from "../../../../lib/registration-reconciliation";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!await getOrganizer()) return reply({ error: "Organizer access required." }, 403);
  const origin = request.headers.get("origin");
  if (origin) { try { if (new URL(origin).host !== (request.headers.get("host") ?? new URL(request.url).host)) return reply({ error: "Invalid origin." }, 403); } catch { return reply({ error: "Invalid origin." }, 403); } }
  let input;
  try { const text = await request.text(); if (text.length > 65536) return reply({ error: "Import too large." }, 413); input = reconciliationSchema.parse(JSON.parse(text)); }
  catch { return reply({ error: "Please select a valid reviewed registration import." }, 400); }
  try {
    if (env.SITES_BACKEND) {
      const token = process.env.SITES_SERVICE_TOKEN, key = organizerAccessKey();
      if (!token || !key) return reply({ error: "Registration service unavailable." }, 503);
      const response = await fetch(sitesOrigin + "/api/organizer/reconcile", { method: "POST", headers: { "Content-Type": "application/json", "OAI-Sites-Authorization": "Bearer " + token, "x-organizer-key": key }, body: JSON.stringify(input), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20000) });
      if (!response.headers.get("content-type")?.includes("application/json")) throw new Error();
      return reply(await response.json(), response.status);
    }
    const db = signupDatabase();
    const completed = await db.prepare("SELECT id FROM registration_reconciliations WHERE id=?").bind(input.batchId).first();
    if (completed) return reply({ status: "already_applied", batchId: input.batchId });
    const snapshots = await db.batch([db.prepare(signupsSnapshotSql), db.prepare(attendanceSnapshotSql)]);
    const firstValue = (result: typeof snapshots[number]) => String(Object.values(result.results[0] ?? {})[0] ?? "[]");
    const signupsJson = firstValue(snapshots[0]), attendanceJson = firstValue(snapshots[1]);
    const rows = JSON.parse(signupsJson) as RegistrationRow[];
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signupsJson + "\n" + attendanceJson));
    const snapshot = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    let plan;
    try { plan = buildReconciliation(input, rows, JSON.parse(attendanceJson) as AttendanceRow[]); } catch (error) { return reply({ error: error instanceof Error ? error.message : "The import needs review." }, 409); }
    const summary = { added: plan.additions.length, updated: plan.updates.length, merged: plan.mergedCount, totalBefore: rows.length, totalAfter: plan.totalAfter, attendanceListed: plan.attendance.length, attendanceAdded: plan.attendance.filter(p => !p.alreadyPresent).length };
    if (input.action === "preview") return reply({ status: "preview", snapshot, summary, changes: { additions: plan.additions, updates: plan.updates, merges: plan.merges.map(m => ({ keep: m.keep.name, duplicates: m.duplicates.map(row => row.name) })) } });
    if (input.snapshot !== snapshot) return reply({ error: "The registration list or attendance changed. Preview again before applying." }, 409);
    // The CHECK guard and the changes run in one D1 transaction. A concurrent
    // signup or check-in invalidates the batch instead of losing their update.
    const statements = reconciliationStatements(input, plan, signupsJson, attendanceJson, snapshot).map(statement => db.prepare(statement.sql).bind(...statement.args));
    await db.batch(statements);
    const after = await db.prepare("SELECT COUNT(*) AS total FROM signups").first<{ total: number }>();
    return reply({ status: "applied", batchId: input.batchId, summary, verifiedTotal: after?.total, attendanceBefore: (JSON.parse(attendanceJson) as AttendanceRow[]).length });
  } catch { return reply({ error: "The import could not be confirmed. Preview again before retrying; completed imports are safe to retry." }, 503); }
}
