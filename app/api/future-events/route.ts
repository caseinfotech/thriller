import { env } from "cloudflare:workers";
import { z } from "zod";
import { signupDatabase } from "../../../lib/organizer";
import { requestFingerprint, sameOrigin } from "../../../lib/event-media";
import { sitesOrigin } from "../../../lib/sites-backend";

export const dynamic = "force-dynamic";
const schema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(80).optional().default(""),
  consent: z.literal(true),
  website: z.string().max(200).optional().default(""),
}).strict();
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

async function proxyToDatabase(payload: z.infer<typeof schema>) {
  const token = process.env.SITES_SERVICE_TOKEN;
  if (!token) return reply({ error: "Mailing-list signup is temporarily unavailable." }, 503);
  try {
    const upstream = await fetch(`${sitesOrigin}/api/future-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "OAI-Sites-Authorization": `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return reply({ error: "Mailing-list signup is temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Please sign up from the event website." }, 403);
  let input: z.infer<typeof schema>;
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) return reply({ error: "Form is too large." }, 413);
    const result = schema.safeParse(await request.json());
    if (!result.success) return reply({ error: "Enter a valid email and confirm you want future event updates." }, 400);
    input = { ...result.data, email: result.data.email.toLowerCase() };
  } catch {
    return reply({ error: "Please check the form and try again." }, 400);
  }
  if (input.website) return reply({ status: "subscribed" }, 201);
  if (env.SITES_BACKEND) return proxyToDatabase(input);
  try {
    const db = signupDatabase();
    const day = new Date().toISOString().slice(0, 10);
    const fingerprint = await requestFingerprint(request);
    const allowed = await db.prepare("INSERT INTO future_event_signup_rate_limits(day,fingerprint,count) VALUES (?,?,1) ON CONFLICT(day,fingerprint) DO UPDATE SET count=count+1 WHERE count < 8 RETURNING count").bind(day, fingerprint).first<{ count: number }>();
    if (!allowed) return reply({ error: "Too many signups from this connection today. Please try again tomorrow." }, 429);
    const now = new Date().toISOString();
    await db.prepare("INSERT OR IGNORE INTO future_event_contacts(id,email,name,consented_at) VALUES (?,?,?,?)").bind(crypto.randomUUID(), input.email, input.name, now).run();
    return reply({ status: "subscribed" }, 201);
  } catch {
    return reply({ error: "We couldn’t save your email right now. Please try again shortly." }, 503);
  }
}
