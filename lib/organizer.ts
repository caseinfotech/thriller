import { env } from "cloudflare:workers";
import { headers, cookies } from "next/headers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export function organizerAccessKey(){return env.SITES_BACKEND?process.env.ORGANIZER_ACCESS_KEY:env.ORGANIZER_ACCESS_KEY;}
export async function validOrganizerKey(value:string|null|undefined){
 const expected=organizerAccessKey();if(!value||!expected)return false;
 const [a,b]=await Promise.all([value,expected].map(v=>crypto.subtle.digest("SHA-256",new TextEncoder().encode(v))));
 const left=new Uint8Array(a),right=new Uint8Array(b);let difference=0;for(let i=0;i<left.length;i++)difference|=left[i]^right[i];return difference===0;
}
export async function getOrganizer(){
 const requestHeaders=await headers();
 const key=env.SITES_BACKEND?(await cookies()).get("thriller_organizer")?.value:requestHeaders.get("x-organizer-key");
 if(await validOrganizerKey(key))return {userId:"organizer-link",displayName:"Organizer",email:"",fullName:null};
 if(env.SITES_BACKEND)return null;
 const user=await getChatGPTUser();const allowed=env.ORGANIZER_EMAIL?.trim().toLowerCase();
 return user&&allowed&&user.email.toLowerCase()===allowed?user:null;
}
export function signupDatabase(){if(!env.DB)throw new Error("Registration database unavailable");return env.DB;}
export type Signup={id:string;name:string;email:string;phone:string;created_at:string;source?:string;attendance_count?:number};
