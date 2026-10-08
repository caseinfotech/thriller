import { env } from "cloudflare:workers";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getOrganizer, type Signup } from "../../lib/organizer";
import { registrationPage } from "../../lib/organizer-data";
import { Download, Moon, Users } from "lucide-react";
export const dynamic="force-dynamic";
export default async function Organizer({searchParams}:{searchParams:Promise<{page?:string}>}){
 if(!env.SITES_BACKEND)await requireChatGPTUser("/organizer");
 const owner=await getOrganizer();
 if(!owner)return <main className="organizer"><a href="/">Back to the event</a><h1>Organizer access only</h1><p>Open your private organizer link to view registrations without signing in.</p></main>;
 const params=await searchParams;let page=Math.max(1,Math.min(100000,Math.floor(Number(params.page)||1)));
 let rows:Signup[]=[];let total=0;let unavailable=false;
 try{const result=await registrationPage(page);rows=result.rows;total=result.total;page=result.page;}catch(e){console.error("Organizer dashboard unavailable");unavailable=true;}
 return <main className="organizer"><header className="organizer-header"><a className="brand" href="/"><Moon size={23}/><span>SOUTH HAVEN <b>THRILLER FLASH MOB</b></span></a><a href="/">View event page</a></header><div className="organizer-heading"><div><p className="eyebrow">PRIVATE · ORGANIZER ONLY</p><h1>Who’s joining the mob?</h1><p className="organizer-subtitle">Your event registrations, all in one place.</p></div>{!unavailable&&total>0&&<a className="export-button" href="/api/organizer/export"><Download size={19}/> Download CSV</a>}</div>
 {unavailable?<div className="organizer-empty" role="alert"><h2>Registrations are temporarily unavailable</h2><p>Please refresh the page in a moment.</p><a href="/organizer">Try again</a></div>:<><div className="signup-count"><Users size={22}/><strong>{total}</strong><span>{total===1?"participant registered":"participants registered"}</span></div>{total===0?<div className="organizer-empty"><h2>The mob starts here.</h2><p>No registrations yet. New signups will appear here after they’re submitted.</p><a href="/organizer">Refresh registrations</a></div>:<><div className="table-wrap"><table><caption className="sr-only">Thriller Flash Mob registrations</caption><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Signed up</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.email}</td><td>{row.phone}</td><td>{new Intl.DateTimeFormat("en-US",{timeZone:"America/Detroit",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(row.created_at.replace(" ","T")+"Z"))}</td></tr>)}</tbody></table></div><nav className="pagination" aria-label="Registration pages"><span>Showing {(page-1)*50+1}–{Math.min(page*50,total)} of {total}</span><div>{page>1&&<a href={"/organizer?page="+(page-1)}>Previous</a>}{page*50<total&&<a href={"/organizer?page="+(page+1)}>Next</a>}<a href={"/organizer?page="+page}>Refresh</a></div></nav></>}</>}
 <p className="organizer-privacy">Anyone with the private organizer link can view and export these registrations. Signup times are shown in Eastern Time.</p><footer><span>By Next Design</span></footer></main>;
}
