"use client";
import { useEffect, useState } from "react";
import { Download, RefreshCw, Trash2, Users } from "lucide-react";
import { formatEasternTime } from "../../../lib/eastern-time";
import styles from "./future-events-manager.module.css";

type Contact = { id: string; email: string; name: string; createdAt: string };
type Result = { items?: Contact[]; error?: string };

export default function FutureEventsManager() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/organizer/future-events", { cache: "no-store" });
      const result = await response.json() as Result;
      if (!response.ok) throw new Error(result.error || "Mailing-list contacts are unavailable.");
      setItems(result.items || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mailing-list contacts are unavailable.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function remove(contact: Contact) {
    if (!window.confirm(`Remove ${contact.email} from future event updates?`)) return;
    setBusy(contact.id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/organizer/future-events?id=${encodeURIComponent(contact.id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The contact could not be removed.");
      setItems(current => current.filter(item => item.id !== contact.id));
      setMessage("Contact removed from the future-events list.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The contact could not be removed.");
    } finally { setBusy(null); }
  }
  return <section className={styles.panel} aria-labelledby="future-contact-list">
    <div className={styles.heading}>
      <div><p className="eyebrow">SEPARATE FROM EVENT REGISTRATIONS</p><h2 id="future-contact-list">Future-event mailing list</h2><p>These people opted in to email updates about future South Haven Thriller Flash Mob events.</p></div>
      <div className={styles.buttons}><a className="export-button" href="/api/organizer/future-events?format=csv"><Download size={18} /> Export CSV</a><button className={styles.refresh} type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Refresh</button></div>
    </div>
    <div className={styles.count}><Users size={20} /><strong>{items.length}</strong><span>{items.length === 1 ? "contact opted in" : "contacts opted in"}</span></div>
    {message && <p className={styles.message} role="status">{message}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <p className={styles.empty}>Loading contacts…</p> : items.length === 0 ? <p className={styles.empty}>No one has joined the mailing list yet.</p> : <div className={styles.tableWrap}>
      <table><thead><tr><th>Email</th><th>Name</th><th>Joined (Eastern Time)</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
        <tbody>{items.map(contact => <tr key={contact.id}><td><a href={`mailto:${contact.email}`}>{contact.email}</a></td><td>{contact.name || "—"}</td><td>{formatEasternTime(contact.createdAt)}</td><td><button className={styles.remove} type="button" onClick={() => void remove(contact)} disabled={busy === contact.id} aria-label={`Remove ${contact.email}`}><Trash2 size={16} /> Remove</button></td></tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
