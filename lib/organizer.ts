import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export async function getOrganizer(){
 const user=await getChatGPTUser();
 const allowed=env.ORGANIZER_EMAIL?.trim().toLowerCase();
 return user&&allowed&&user.email.toLowerCase()===allowed?user:null;
}
export function signupDatabase(){if(!env.DB)throw new Error("Registration database unavailable");return env.DB;}
export type Signup={id:string;name:string;email:string;phone:string;created_at:string};
