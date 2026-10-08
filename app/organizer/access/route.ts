import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { validOrganizerKey } from "../../../lib/organizer";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const url=new URL(request.url);const key=url.searchParams.get("key");
 if(!env.SITES_BACKEND||!await validOrganizerKey(key))return new Response("This organizer link is invalid.",{status:403,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
 const response=NextResponse.redirect(new URL("/organizer",url),303);
 response.cookies.set("thriller_organizer",key!,{httpOnly:true,secure:url.protocol==="https:",sameSite:"lax",path:"/",maxAge:60*60*24*90});
 response.headers.set("Cache-Control","private, no-store");response.headers.set("Referrer-Policy","no-referrer");return response;
}
