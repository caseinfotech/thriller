import { z } from "zod";
export const noticeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("unlock"), pin: z.string().regex(/^\d{6}$/) }).strict(),
  z.object({ action: z.literal("send"), pin: z.string().regex(/^\d{6}$/), requestId: z.string().uuid(),
    recipientIds: z.array(z.string().uuid()).min(1).max(500).refine(ids => new Set(ids).size === ids.length),
    subject: z.string().trim().min(3).max(120).refine(s => !/[\r\n]/.test(s)),
    message: z.string().trim().min(10).max(5000),
  }).strict(),
]);
export function uniqueRecipients(rows: {id:string;email:string}[], ids: string[]) {
  if (rows.length !== ids.length || !ids.every(id => rows.some(row => row.id === id))) throw new Error("A selected registration is no longer available. Refresh the list.");
  return [...new Set(rows.map(row => row.email.trim().toLowerCase()))].sort();
}
export function noticeEmails(emails: string[], from: string, subject: string, message: string) {
  return emails.map(email => ({ from, to: [email], subject: `South Haven Thriller — ${subject}`,
    text: `${message}\n\nSouth Haven Thriller Flash Mob\nEvent notice for registered participants.\nhttps://tinyurl.com/sohathriller`,
  }));
}
export async function pinDigest(pin: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin)))).map(v => v.toString(16).padStart(2,"0")).join("");
}
export async function matchesPin(pin: string, expected: string) {
  const actual = await pinDigest(pin); let difference = actual.length ^ expected.length;
  for(let i=0;i<actual.length;i++) difference |= actual.charCodeAt(i) ^ (expected.charCodeAt(i) || 0);
  return difference === 0;
}
