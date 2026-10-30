import { env } from "cloudflare:workers";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { getOrganizer } from "../../../lib/organizer";
import FutureEventsManager from "./future-events-manager";
export const dynamic = "force-dynamic";

export default async function FutureEventsOrganizerPage() {
  if (!env.SITES_BACKEND) await requireChatGPTUser("/organizer/future-events");
  const owner = await getOrganizer();
  if (!owner) return <main className="organizer"><a href="/organizer">Back to organizer</a><h1>Organizer access only</h1></main>;
  return <main className="organizer">
    <header className="organizer-header"><a className="brand" href="/organizer">← Organizer portal</a><a href="/">View event page</a></header>
    <div className="organizer-heading"><div><p className="eyebrow">PRIVATE · ORGANIZER ONLY</p><h1>Future event contacts</h1><p className="organizer-subtitle">Mailing-list signups are stored separately from event registrations.</p></div></div>
    <FutureEventsManager />
  </main>;
}
