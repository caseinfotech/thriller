import { z } from "zod";
import { classForSignup } from "./attendance";
import { classes } from "./check-in";

const person = z.object({ name: z.string().trim().min(2).max(120), email: z.union([z.literal(""), z.string().trim().email().max(254)]), phone: z.string().trim().max(30).regex(/^[+0-9() .-]*$/) }).strict();
export const reconciliationSchema = z.object({
  action: z.enum(["preview", "apply"]), batchId: z.string().uuid(), snapshot: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  recordSignupAttendance: z.boolean().optional(),
  additions: z.array(person).max(100),
  updates: z.array(person.extend({ id: z.string().uuid() }).strict()).max(100),
  merges: z.array(z.object({ keepId: z.string().uuid(), removeIds: z.array(z.string().uuid()).min(1).max(10) }).strict()).max(50),
  classAttendance: z.object({ sessionId: z.enum(["thriller-2026-week-1", "thriller-2026-week-2", "thriller-2026-week-3", "thriller-2026-week-4"]), participants: z.array(z.string().trim().min(2).max(120)).min(1).max(100) }).strict().optional(),
}).strict();
export type Reconciliation = z.infer<typeof reconciliationSchema>;
export type RegistrationRow = { id: string; name: string; email: string; phone: string; created_at: string; source: string };
export type AttendanceRow = { session_id: string; participant_email: string; signup_id: string; checked_in_at: string };
export const nameKey = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
export const phoneKey = (value: string) => value.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const emailKey = (value: string) => value.trim().toLowerCase();
function similarName(a: string, b: string) {
  const x = nameKey(a), y = nameKey(b);
  if (x === y) return true;
  if (x.length !== y.length) return false;
  return [...x].filter((c, i) => c !== y[i]).length === 1;
}
export function buildReconciliation(input: Reconciliation, rows: RegistrationRow[], visits: AttendanceRow[] = []) {
  const lookup = new Map(rows.map(row => [row.id, row]));
  const removed = new Set<string>(), touched = new Set<string>();
  const merges = input.merges.map(merge => {
    const keep = lookup.get(merge.keepId);
    if (!keep || touched.has(keep.id)) throw new Error("A merge target is missing or appears twice.");
    touched.add(keep.id);
    const duplicates = merge.removeIds.map(id => {
      const row = lookup.get(id);
      if (!row || touched.has(id)) throw new Error("A duplicate is missing or appears twice.");
      touched.add(id); removed.add(id);
      const sameEmail = emailKey(keep.email) !== "" && emailKey(keep.email) === emailKey(row.email);
      const samePhone = phoneKey(keep.phone) !== "" && phoneKey(keep.phone) === phoneKey(row.phone);
      if (!similarName(keep.name, row.name) || (!sameEmail && !samePhone)) throw new Error("Merge records must have matching names and a shared contact.");
      if ((keep.email && row.email && !sameEmail) || (keep.phone && row.phone && !samePhone)) throw new Error("Conflicting contact details require review before merging.");
      return row;
    });
    return { keep, duplicates, email: keep.email || duplicates.find(row => row.email)?.email || "", phone: keep.phone || duplicates.find(row => row.phone)?.phone || "", createdAt: [keep, ...duplicates].map(row => row.created_at).sort()[0] };
  });
  const updateIds = new Set<string>();
  const updates = input.updates.map(update => {
    const before = lookup.get(update.id);
    if (!before || removed.has(update.id) || updateIds.has(update.id)) throw new Error("An update target is missing, duplicated, or being merged away.");
    updateIds.add(update.id);
    return { before, after: { ...update, email: emailKey(update.email) } };
  }).filter(({ before, after }) => before.name !== after.name || before.email !== after.email || before.phone !== after.phone);
  const addedNames = new Set<string>();
  const additions = input.additions.map(entry => {
    const name = nameKey(entry.name);
    if (rows.some(row => nameKey(row.name) === name) || addedNames.has(name)) throw new Error(`A registration already exists for ${entry.name}. Review it before adding another.`);
    addedNames.add(name);
    return { ...entry, id: crypto.randomUUID(), email: emailKey(entry.email) };
  });
  const finalRows = rows.filter(row => !removed.has(row.id)).map(row => {
    const merge = merges.find(item => item.keep.id === row.id);
    const update = updates.find(item => item.after.id === row.id);
    return { ...row, ...(merge ? { email: merge.email, phone: merge.phone } : {}), ...update?.after };
  }).concat(additions.map(row => ({ ...row, source: "handwritten", created_at: "" })));
  const seenAttendance = new Set<string>();
  const attendance: { id: string; name: string; email: string; sessionId: string; checkedInAt?: string; alreadyPresent: boolean }[] = (input.classAttendance?.participants ?? []).map(name => {
    const matches = finalRows.filter(row => nameKey(row.name) === nameKey(name));
    if (!matches.length || new Set(matches.map(row => row.name.trim().toLowerCase())).size !== 1) throw new Error(`Attendance for ${name} needs a matching registration.`);
    const row = [...matches].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)[0];
    if (seenAttendance.has(row.id)) throw new Error("A participant appears twice in this attendance import.");
    seenAttendance.add(row.id);
    const merge = merges.find(item => item.keep.id === row.id);
    const ids = new Set([...matches.map(match => match.id), ...(merge?.duplicates.map(item => item.id) ?? [])]);
    const sessionId = input.classAttendance!.sessionId;
    const checkedInAt = matches.map(match => match.created_at).filter(date => date && classForSignup(date)?.id === sessionId).sort()[0] ?? classes.find(session => session.id === sessionId)!.day + " 21:00:00";
    return { id: row.id, name: row.name, email: row.email || matches.find(match => match.email)?.email || "", sessionId, checkedInAt, alreadyPresent: visits.some(visit => visit.session_id === input.classAttendance!.sessionId && ids.has(visit.signup_id)) };
  });
  if (additions.length && (!input.classAttendance || additions.some(row => !input.classAttendance!.participants.some(name => nameKey(name) === nameKey(row.name))))) {
    throw new Error("Each new paper signup needs its dated class attendance in the import.");
  }
  if (input.recordSignupAttendance) {
    const planned = new Set(attendance.map(person => `${person.sessionId}:${person.id}`));
    for (const row of finalRows) {
      // A scanned sheet supplies its class explicitly, rather than using its upload time.
      if (row.source === "handwritten" || !row.created_at) continue;
      const session = classForSignup(row.created_at);
      if (!session) continue;
      const sessionId = session.id;
      const sameName = finalRows.filter(other => other.name.trim().toLowerCase() === row.name.trim().toLowerCase());
      const canonical = [...sameName].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)[0];
      const ids = new Set(sameName.map(other => other.id));
      for (const merge of merges) if (ids.has(merge.keep.id)) merge.duplicates.forEach(duplicate => ids.add(duplicate.id));
      const key = `${sessionId}:${canonical.id}`;
      if (planned.has(key) || visits.some(visit => visit.session_id === sessionId && ids.has(visit.signup_id))) continue;
      planned.add(key);
      attendance.push({ id: canonical.id, name: row.name, email: row.email, sessionId, checkedInAt: row.created_at, alreadyPresent: false });
    }
  }
  return { additions, updates, merges, attendance, totalAfter: rows.length + additions.length - removed.size, mergedCount: removed.size };
}

export const signupsSnapshotSql = "SELECT json_group_array(json_object('id',id,'name',name,'email',email,'phone',phone,'created_at',created_at,'source',source)) FROM (SELECT id,name,email,phone,created_at,source FROM signups ORDER BY id)";
export const attendanceSnapshotSql = "SELECT json_group_array(json_object('session_id',session_id,'participant_email',participant_email,'signup_id',signup_id,'checked_in_at',checked_in_at)) FROM (SELECT session_id,participant_email,signup_id,checked_in_at FROM attendance ORDER BY session_id,signup_id)";

export function reconciliationStatements(input: Reconciliation, plan: ReturnType<typeof buildReconciliation>, signupsJson: string, attendanceJson: string, snapshot: string) {
  const statements: { sql: string; args: (string | number | null)[] }[] = [];
  const push = (sql: string, ...args: (string | number | null)[]) => statements.push({ sql, args });
  push(`INSERT INTO registration_reconciliations(id,snapshot,plan,signups_before,attendance_before,consistent) VALUES (?,?,?,?,?,CASE WHEN (${signupsSnapshotSql})=? AND (${attendanceSnapshotSql})=? THEN 1 ELSE 0 END)`, input.batchId, snapshot, JSON.stringify(input), signupsJson, attendanceJson, signupsJson, attendanceJson);
  for (const merge of plan.merges) {
    push("UPDATE signups SET email=?,phone=?,created_at=? WHERE id=?", merge.email, merge.phone, merge.createdAt, merge.keep.id);
    for (const duplicate of merge.duplicates) {
      push("INSERT INTO attendance(session_id,participant_email,signup_id,checked_in_at) SELECT session_id,?,?,checked_in_at FROM attendance WHERE signup_id=? ON CONFLICT(session_id,signup_id) DO UPDATE SET checked_in_at=MIN(attendance.checked_in_at,excluded.checked_in_at)", merge.email, merge.keep.id, duplicate.id);
      push("DELETE FROM attendance WHERE signup_id=?", duplicate.id);
      push("DELETE FROM signups WHERE id=?", duplicate.id);
    }
    push("UPDATE attendance SET participant_email=? WHERE signup_id=?", merge.email, merge.keep.id);
  }
  for (const { after } of plan.updates) {
    push("UPDATE signups SET name=?,email=?,phone=? WHERE id=?", after.name, after.email, after.phone, after.id);
    push("UPDATE attendance SET participant_email=? WHERE signup_id=?", after.email, after.id);
  }
  for (const entry of plan.additions) push("INSERT INTO signups(id,name,email,phone,source) VALUES (?,?,?,?,'handwritten')", entry.id, entry.name, entry.email, entry.phone);
  for (const person of plan.attendance) push("INSERT OR IGNORE INTO attendance(session_id,participant_email,signup_id,checked_in_at) VALUES (?,?,?,COALESCE(?,CURRENT_TIMESTAMP))", person.sessionId, person.email, person.id, person.checkedInAt ?? null);
  return statements;
}
