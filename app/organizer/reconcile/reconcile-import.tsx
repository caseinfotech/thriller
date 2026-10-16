"use client";
import { useState } from "react";
import type { Reconciliation } from "../../../lib/registration-reconciliation";
type Result = { status: string; error?: string; snapshot?: string; summary?: { added: number; updated: number; merged: number; totalBefore: number; totalAfter: number; attendanceListed: number; attendanceAdded: number }; changes?: { additions: { name: string }[]; updates: { before: { name: string; email: string; phone: string }; after: { name: string; email: string; phone: string } }[]; merges: { keep: string; duplicates: string[] }[] }; verifiedTotal?: number };
export default function ReconcileImport() {
  const [data, setData] = useState<Reconciliation | null>(null), [result, setResult] = useState<Result | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function submit(action: "preview" | "apply") {
    if (!data) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/organizer/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, action, ...(action === "apply" ? { snapshot: result?.snapshot } : {}) }) });
      const next = await response.json() as Result;
      if (!response.ok) throw new Error(next.error || "Import unavailable.");
      setResult(next);
    } catch (e) { setError(e instanceof Error ? e.message : "Import unavailable."); } finally { setBusy(false); }
  }
  return <section className="notice-mailer"><label htmlFor="reviewed-import">Reviewed signup import</label><input id="reviewed-import" type="file" accept="application/json,.json" disabled={busy} onChange={async event => { setResult(null); setError(""); setData(null); const file = event.target.files?.[0]; if (!file) return; try { if (file.size > 65536) throw new Error(); setData(JSON.parse(await file.text()) as Reconciliation); } catch { setError("Please choose a valid reviewed import file."); } }} /><button disabled={!data || busy} onClick={() => void submit("preview")}>{busy ? "Checking…" : "Preview changes"}</button>{result?.summary && <div className="notice-review"><h2>Import review</h2><p>{result.summary.added} new participants · {result.summary.updated} contact updates · {result.summary.merged} duplicate registrations merged</p><p>{result.summary.attendanceListed} people listed for class attendance · {result.summary.attendanceAdded} new check-ins</p><p>{result.summary.totalBefore} registrations before · {result.summary.totalAfter} after</p>{result.changes && <><h3>New participants</h3><ul>{result.changes.additions.map(entry => <li key={entry.name}>{entry.name}</li>)}</ul><h3>Corrections</h3><ul>{result.changes.updates.map(entry => <li key={entry.before.name}>{entry.before.name}: {entry.before.email || "No email"} / {entry.before.phone || "No phone"} → {entry.after.email || "No email"} / {entry.after.phone || "No phone"}</li>)}</ul><h3>Duplicate records</h3><ul>{result.changes.merges.map(entry => <li key={entry.keep}>{entry.keep}: combine {entry.duplicates.length + 1} records</li>)}</ul></>}{result.status === "preview" && <button disabled={busy} onClick={() => void submit("apply")}>Apply reviewed changes</button>}</div>}{(result?.status === "applied" || result?.status === "already_applied") && <p className="notice-success" role="status">Import saved. {result.verifiedTotal !== undefined && `${result.verifiedTotal} registrations verified.`} <a href="/organizer">View registrations</a></p>}{error && <p className="notice-error" role="alert">{error}</p>}</section>;
}
