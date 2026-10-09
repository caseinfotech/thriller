import { env } from "cloudflare:workers";
import { signupDatabase,type Signup,organizerAccessKey } from "./organizer";
import { sitesOrigin } from "./sites-backend";
export async function organizerBackend(path:string){
 const token=process.env.SITES_SERVICE_TOKEN,key=organizerAccessKey();if(!token||!key)throw new Error("Organizer backend unavailable");
 const response=await fetch(sitesOrigin+path,{headers:{"OAI-Sites-Authorization":"Bearer "+token,"x-organizer-key":key},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("Organizer backend unavailable");return response;
}
export async function registrationPage(requestedPage:number):Promise<{rows:Signup[];total:number;page:number}>{
 if(env.SITES_BACKEND){const response=await organizerBackend("/api/organizer/entries?page="+requestedPage);if(!response.headers.get("content-type")?.includes("application/json"))throw new Error("Unexpected organizer response");return await response.json() as {rows:Signup[];total:number;page:number};}
 const db=signupDatabase();const total=(await db.prepare("SELECT COUNT(*) AS total FROM signups").first<{total:number}>())?.total??0;const page=Math.min(requestedPage,Math.max(1,Math.ceil(total/50)));
 const rows=(await db.prepare("SELECT s.id,s.name,s.email,s.phone,s.created_at,s.source,(SELECT COUNT(*) FROM attendance a WHERE a.signup_id=(SELECT MIN(id) FROM signups s2 WHERE LOWER(TRIM(s2.name))=LOWER(TRIM(s.name)))) AS attendance_count FROM signups s ORDER BY s.created_at DESC,s.id DESC LIMIT 50 OFFSET ?").bind((page-1)*50).all<Signup>()).results;
 return {rows,total,page};
}
