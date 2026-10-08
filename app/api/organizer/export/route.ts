import { env } from "cloudflare:workers";
import { sitesOrigin } from "../../../../lib/sites-backend";
import { getOrganizer,signupDatabase,type Signup } from "../../../../lib/organizer";
import { signupCsv } from "../../../../lib/signup-csv";
export const dynamic="force-dynamic";
export async function GET(){
 if(env.SITES_BACKEND)return Response.redirect(sitesOrigin+"/api/organizer/export",307);
 if(!await getOrganizer())return Response.json({error:"Organizer access required."},{status:403,headers:{"Cache-Control":"no-store"}});
 try{const rows=(await signupDatabase().prepare("SELECT name,email,phone,created_at FROM signups ORDER BY created_at DESC,id DESC").all<Signup>()).results;return new Response(signupCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="thriller-signups.csv"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch(e){console.error("Signup export unavailable",e);return Response.json({error:"Unable to export registrations. Please try again."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
