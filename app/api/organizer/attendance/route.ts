import { env } from "cloudflare:workers";
import { getOrganizer, signupDatabase } from "../../../../lib/organizer";
import { organizerBackend } from "../../../../lib/organizer-data";
import { classes } from "../../../../lib/check-in";
export const dynamic="force-dynamic";
export async function GET(){
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
 if(!await getOrganizer())return reply({error:"Organizer access required."},403);
 try{if(env.SITES_BACKEND)return reply(await (await organizerBackend("/api/organizer/attendance")).json());
 const db=signupDatabase();const counts=(await db.prepare("SELECT session_id,COUNT(*) AS count FROM attendance GROUP BY session_id").all<{session_id:string;count:number}>()).results;
 const sources=(await db.prepare("SELECT source,COUNT(*) AS count FROM signups GROUP BY source").all<{source:string;count:number}>()).results;
 const distribution=(await db.prepare("SELECT visits,COUNT(*) AS people FROM (SELECT signup_id,COUNT(*) AS visits FROM attendance GROUP BY signup_id) GROUP BY visits ORDER BY visits").all<{visits:number;people:number}>()).results;
 return reply({classes:classes.map(s=>({...s,count:counts.find(c=>c.session_id===s.id)?.count??0})),sources,distribution});
 }catch{return reply({error:"Attendance is temporarily unavailable."},503);}
}
