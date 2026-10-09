import { env } from "cloudflare:workers";
import { z } from "zod";
import { sitesOrigin } from "../../../../lib/sites-backend";
import { getOrganizer, signupDatabase, organizerAccessKey } from "../../../../lib/organizer";
import { registrationPage } from "../../../../lib/organizer-data";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 if(!await getOrganizer())return Response.json({error:"Organizer access required."},{status:403,headers:{"Cache-Control":"no-store"}});
 const page=Math.max(1,Math.min(100000,Math.floor(Number(new URL(request.url).searchParams.get("page"))||1)));
 try{return Response.json(await registrationPage(page),{headers:{"Cache-Control":"private, no-store"}});}catch(error){console.error("Organizer entries unavailable");return Response.json({error:"Registrations are temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});}
}

const manualEntry=z.object({name:z.string().trim().min(2).max(120),email:z.union([z.literal(""),z.string().trim().email().max(254)]).default(""),phone:z.union([z.literal(""),z.string().trim().min(7).max(30).regex(/^[+0-9() .-]+$/)]).default("")}).strict();
export async function POST(request:Request){
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
 if(!await getOrganizer())return reply({error:"Organizer access required."},403);
 const origin=request.headers.get("origin");if(origin){try{if(new URL(origin).host!==(request.headers.get("host")??new URL(request.url).host))return reply({error:"Invalid origin."},403);}catch{return reply({error:"Invalid origin."},403);}}
 let parsed;try{const raw=await request.text();if(raw.length>4096)return reply({error:"Entry too large."},413);parsed=manualEntry.safeParse(JSON.parse(raw));}catch{return reply({error:"Invalid entry."},400);}
 if(!parsed.success)return reply({error:"Enter a name and valid contact details when available."},400);
 try{
  if(env.SITES_BACKEND){
   const token=process.env.SITES_SERVICE_TOKEN,key=organizerAccessKey();if(!token||!key)return reply({error:"Registration service unavailable."},503);
   const r=await fetch(sitesOrigin+"/api/organizer/entries",{method:"POST",headers:{"Content-Type":"application/json","OAI-Sites-Authorization":"Bearer "+token,"x-organizer-key":key},body:JSON.stringify(parsed.data),redirect:"error",cache:"no-store",signal:AbortSignal.timeout(15000)});
   if(!r.headers.get("content-type")?.includes("application/json"))throw new Error();return reply(await r.json(),r.status);
  }
  const {name,email,phone}=parsed.data;
  const inserted=await signupDatabase().prepare("INSERT INTO signups (id,name,email,phone,source) SELECT ?,?,?,?,'handwritten' WHERE NOT EXISTS (SELECT 1 FROM signups WHERE LOWER(TRIM(name)) = ? OR (? <> '' AND LOWER(email) = ?)) RETURNING id").bind(crypto.randomUUID(),name,email.toLowerCase(),phone,name.toLowerCase(),email.toLowerCase(),email.toLowerCase()).first<{id:string}>();
  return reply({status:inserted?"registered":"already_registered"},inserted?201:200);
 }catch{return reply({error:"Registration could not be confirmed. Check the list before retrying."},503);}
}
