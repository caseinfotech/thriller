import { env } from "cloudflare:workers";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { getOrganizer } from "../../../lib/organizer";
import ReconcileImport from "./reconcile-import";
export const dynamic = "force-dynamic";
export default async function Reconcile() {
  if (!env.SITES_BACKEND) await requireChatGPTUser("/organizer/reconcile");
  if (!await getOrganizer()) return <main className="organizer"><h1>Organizer access only</h1><p>Open your private organizer link first.</p></main>;
  return <main className="organizer"><a href="/organizer">Back to registrations</a><p className="eyebrow" style={{ marginTop: 40 }}>PRIVATE · REGISTRATION MAINTENANCE</p><h1>Review the signup sheets.</h1><p>Compare a reviewed import before applying it. Contact corrections and duplicate merges preserve existing class attendance, and a private backup is saved with each import.</p><ReconcileImport /></main>;
}
