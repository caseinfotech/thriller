import { env } from "cloudflare:workers";
import { z } from "zod";
import { saveThroughSites } from "../../../lib/sites-backend";
const schema=z.object({name:z.string().trim().min(2,"Please enter your full name.").max(120),email:z.string().trim().email("Please enter a valid email address.").max(254),phone:z.string().trim().min(7).max(30).regex(/^[+0-9() .-]+$/,"Please enter a valid phone number.").refine(v=>v.replace(/\D/g,"").length>=7,"Please enter at least 7 phone digits."),website:z.string().optional()});
function database(){if(!env.DB)throw new Error("Signup database unavailable");return env.DB;}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin){try{const url=new URL(origin);const host=request.headers.get("host")??new URL(request.url).host;if(!["http:","https:"].includes(url.protocol)||url.host!==host)return Response.json({error:"Please submit from the event page."},{status:403});}catch{return Response.json({error:"Please submit from the event page."},{status:403});}}
 let input;try{if(Number(request.headers.get("content-length")||0)>4096)return Response.json({error:"Form is too large."},{status:413});input=schema.safeParse(await request.json());}catch{return Response.json({error:"Please check your form and try again."},{status:400});}
 if(!input.success)return Response.json({error:input.error.issues[0].message},{status:400});
 if(env.SITES_BACKEND)return saveThroughSites(input.data);
 if(input.data.website)return Response.json({status:"registered"},{status:201});
 try{const {name,email,phone}=input.data;await database().prepare("INSERT INTO signups (id, name, email, phone) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(),name,email.toLowerCase(),phone).run();return Response.json({status:"registered"},{status:201});}catch(error){console.error("Signup save failed",error);return Response.json({error:"We couldn’t save your signup. Please try again shortly."},{status:503});}
}
