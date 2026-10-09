import { z } from "zod";
export const classes=[
 {id:"thriller-2026-week-1",title:"Class 1 · Learn the Blocks",date:"October 8",day:"2026-10-08"},
 {id:"thriller-2026-week-2",title:"Class 2 · Music + Timing",date:"October 15",day:"2026-10-15"},
 {id:"thriller-2026-week-3",title:"Class 3 · Formation + Technique",date:"October 22",day:"2026-10-22"},
 {id:"thriller-2026-week-4",title:"Class 4 · Dress Rehearsal",date:"October 29",day:"2026-10-29"},
];
export function easternDay(now=new Date()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Detroit',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');}
export function todaysClasses(now=new Date()){return classes.filter(c=>c.day===easternDay(now));}
const fields={sessionId:z.string().max(80),name:z.string().trim().min(2).max(120)};
export const checkInSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('checkin'),...fields,email:z.string().trim().email().max(254).optional(),phone:z.string().trim().max(30).optional()}).strict(),
 z.object({action:z.literal('register'),...fields,email:z.string().trim().email().max(254),phone:z.string().trim().max(30).regex(/^[+0-9() .-]+$/).refine(v=>v.replace(/\D/g,'').length>=7)}).strict(),
]);
export type Person={id:string;name:string;email:string;phone:string};
export function normalizeName(name:string){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,'').trim().replace(/\s+/g,' ');}
const aliases:Record<string,string>={curt:'curtis',mike:'michael',mikey:'michael',jess:'jessica',liz:'elizabeth',beth:'elizabeth',bob:'robert',rob:'robert',jim:'james',jimmy:'james',bill:'william',will:'william',joe:'joseph',kate:'katherine',katie:'katherine'};
function nameKey(name:string){const words=normalizeName(name).split(' ');return [(aliases[words[0]]||words[0]),words.length>1?words.at(-1):''].join(' ');}
function oneEdit(a:string,b:string){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,edits=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return edits+(i<a.length||j<b.length?1:0)<=1;}
export function matchPerson(name:string,rows:Person[],email?:string,phone?:string){
 const normalized=normalizeName(name),key=nameKey(name);
 const exact=rows.filter(p=>normalizeName(p.name)===normalized);
 const close=exact.length?exact:rows.filter(p=>nameKey(p.name)===key&&key.trim().includes(' '));
 const candidates=close.length?close:rows.filter(p=>{const a=nameKey(p.name).split(' '),b=key.split(' ');return a[0]===b[0]&&(!b[1]||oneEdit(a[1],b[1]));});
 const sorted=[...candidates].sort((a,b)=>a.id.localeCompare(b.id));
 if(email||phone){const verified=sorted.filter(p=>(email&&p.email.trim().toLowerCase()===email.trim().toLowerCase())||(phone&&p.phone.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'')===phone.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'')));if(verified.length)return {kind:'match' as const,person:verified[0]};return {kind:candidates.length?'verify' as const:'new' as const};}
 if(exact.length)return {kind:'match' as const,person:sorted[0]};
 if(close.length===1&&normalizeName(name).split(' ').length>1)return {kind:'match' as const,person:close[0]};
 return {kind:candidates.length?'verify' as const:'new' as const};
}
