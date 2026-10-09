import { env } from "cloudflare:workers";
import { getOrganizer, organizerAccessKey, signupDatabase, validOrganizerKey } from "../../../../lib/organizer";
import { sitesOrigin } from "../../../../lib/sites-backend";
import { matchesPin, noticeSchema, noticeEmails, uniqueRecipients } from "../../../../lib/notice-mailer";
export const dynamic = "force-dynamic";
const response = (data: unknown, status=200) => Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
async function proxy(method:string, body?: unknown) {
  const token=process.env.SITES_SERVICE_TOKEN,key=organizerAccessKey();
  if(!token||!key)return response({error:"Notice service is unavailable."},503);
  try {
    const result=await fetch(sitesOrigin+"/api/organizer/notices",{method,headers:{"OAI-Sites-Authorization":"Bearer "+token,"x-organizer-key":key,"x-notice-delivery-key":process.env.RESEND_API_KEY||"","Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(60000)});
    if(!result.headers.get("content-type")?.includes("application/json"))throw new Error("Unexpected response");
    return response(await result.json(),result.status);
  } catch { return response({error:"Notice service is unavailable. If a send timed out, retry the same notice to avoid duplicates."},503); }
}
async function deliveryKey(request:Request){
  if(env.RESEND_API_KEY)return env.RESEND_API_KEY;
  return await validOrganizerKey(request.headers.get("x-organizer-key"))?request.headers.get("x-notice-delivery-key")||undefined:undefined;
}
export async function GET(request:Request) {
  if(!await getOrganizer())return response({error:"Organizer access required."},403);
  if(env.SITES_BACKEND)return proxy("GET");
  return response({pinConfigured:!!env.MAILER_PIN_HASH,deliveryConfigured:!!await deliveryKey(request)&&!!env.NOTICE_FROM_EMAIL});
}
export async function POST(request:Request) {
  if(!await getOrganizer())return response({error:"Organizer access required."},403);
  const origin=request.headers.get("origin");
  if(origin){try{if(new URL(origin).host!==(request.headers.get("host")??new URL(request.url).host))return response({error:"Send notices from the organizer page."},403);}catch{return response({error:"Invalid request origin."},403);}}
  let input;try{const raw=await request.text();if(raw.length>40000)return response({error:"Notice is too large."},413);input=noticeSchema.safeParse(JSON.parse(raw));}catch{return response({error:"Check the PIN, recipients, subject and message."},400);}
  if(!input.success)return response({error:"Use a six-digit PIN and select 1–500 registered participants. A subject and message are required."},400);
  if(env.SITES_BACKEND)return proxy("POST",input.data);
  if(!env.MAILER_PIN_HASH)return response({error:"The mailer PIN has not been configured yet."},503);
  try {
    const db=signupDatabase();const bucket=String(Math.floor(Date.now()/900000));
    await db.prepare("DELETE FROM notice_pin_attempts WHERE bucket <> ?").bind(bucket).run();
    await db.prepare("INSERT OR IGNORE INTO notice_pin_attempts (bucket, attempts) VALUES (?, 0)").bind(bucket).run();
    const attempts=(await db.prepare("SELECT attempts FROM notice_pin_attempts WHERE bucket = ?").bind(bucket).first<{attempts:number}>())?.attempts??0;
    if(attempts>=5)return response({error:"Too many incorrect PIN attempts. Try again in 15 minutes."},429);
    if(!await matchesPin(input.data.pin,env.MAILER_PIN_HASH)) {
      const reservation = await db.prepare("UPDATE notice_pin_attempts SET attempts = attempts + 1 WHERE bucket = ? AND attempts < 5 RETURNING attempts").bind(bucket).first<{attempts:number}>();
      if(!reservation)return response({error:"Too many incorrect PIN attempts. Try again in 15 minutes."},429);
      return response({error:"Incorrect PIN."},403);
    }
    const resendKey=await deliveryKey(request);
    const ready=!!resendKey&&!!env.NOTICE_FROM_EMAIL;
    if(input.data.action==="unlock")return response({unlocked:true,deliveryConfigured:ready});
    if(!ready)return response({error:"Email delivery setup is pending. No notice was sent."},503);
    const {recipientIds,subject,message,requestId}=input.data;
    const rows:{id:string;email:string}[]=[];
    for(let start=0;start<recipientIds.length;start+=100){const ids=recipientIds.slice(start,start+100);rows.push(...(await db.prepare(`SELECT id,email FROM signups WHERE id IN (${ids.map(()=>"?").join(",")})`).bind(...ids).all<{id:string;email:string}>()).results);}
    let emails;try{emails=uniqueRecipients(rows,recipientIds);}catch{return response({error:"A selected registration is no longer available. Refresh the list."},409);}
    if(!emails.length)return response({error:"Selected registrations have no email addresses. No notice was sent."},400);
    const payloads=noticeEmails(emails,env.NOTICE_FROM_EMAIL!,subject,message);
    let accepted=0;
    for(let start=0;start<payloads.length;start+=100) {
      const result=await fetch("https://api.resend.com/emails/batch",{method:"POST",headers:{Authorization:"Bearer "+resendKey,"Content-Type":"application/json","Idempotency-Key":`thriller-notice/${requestId}/${start}`},body:JSON.stringify(payloads.slice(start,start+100)),signal:AbortSignal.timeout(15000)});
      if(!result.ok){
        const detail=await result.json().catch(()=>({})) as {name?:string;message?:string};
        const reason=typeof detail.message==="string"?detail.message.replace(/re_[A-Za-z0-9_-]+/g,"[redacted]").replace(/[\r\n]/g," ").slice(0,400):"Check delivery setup.";
        return response({error:accepted?`${accepted} notices were accepted; the rest were not confirmed. Retry this same notice to safely continue.`:`The email service did not accept the notice: ${reason}`,providerStatus:result.status},502);
      }
      const data=await result.json() as {data?:{id:string}[]};
      if(data.data?.length!==Math.min(100,payloads.length-start))return response({error:"The email service returned an unexpected result. Retry this same notice."},502);
      accepted+=data.data.length;
      if(start+100<payloads.length)await new Promise(resolve=>setTimeout(resolve,600));
    }
    return response({accepted,selected:recipientIds.length});
  } catch { console.error("Notice mailer unavailable");return response({error:"Notice delivery could not be confirmed. Retry this same notice to avoid duplicates."},503); }
}
