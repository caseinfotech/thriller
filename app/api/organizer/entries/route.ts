import { getOrganizer } from "../../../../lib/organizer";
import { registrationPage } from "../../../../lib/organizer-data";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 if(!await getOrganizer())return Response.json({error:"Organizer access required."},{status:403,headers:{"Cache-Control":"no-store"}});
 const page=Math.max(1,Math.min(100000,Math.floor(Number(new URL(request.url).searchParams.get("page"))||1)));
 try{return Response.json(await registrationPage(page),{headers:{"Cache-Control":"private, no-store"}});}catch(error){console.error("Organizer entries unavailable");return Response.json({error:"Registrations are temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
