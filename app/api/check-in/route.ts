import {env} from 'cloudflare:workers';
import {signupDatabase} from '../../../lib/organizer';
import {sitesOrigin} from '../../../lib/sites-backend';
import {checkInSchema,todaysClasses,matchPerson,type Person} from '../../../lib/check-in';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function proxy(method:string,body?:unknown){const token=process.env.SITES_SERVICE_TOKEN;if(!token)return reply({error:'Check-in is temporarily unavailable.'},503);const r=await fetch(sitesOrigin+'/api/check-in',{method,headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+token},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.headers.get('content-type')?.includes('application/json'))throw new Error();return reply(await r.json(),r.status);}
export async function GET(){try{return env.SITES_BACKEND?await proxy('GET'):reply({classes:todaysClasses()});}catch{return reply({error:'Check-in is temporarily unavailable.'},503);}}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin){try{if(new URL(origin).host!==(request.headers.get('host')??new URL(request.url).host))return reply({error:'Use the event check-in page.'},403);}catch{return reply({error:'Invalid origin.'},403);}}
 let input;try{const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);input=checkInSchema.safeParse(JSON.parse(raw));}catch{return reply({error:'Check your details.'},400);}if(!input.success)return reply({error:'Enter your name and valid contact details when requested.'},400);
 try{
  if(env.SITES_BACKEND)return await proxy('POST',input.data);
  const session=todaysClasses().find(c=>c.id===input.data.sessionId);if(!session)return reply({error:'This class is not available for check-in today.'},403);
  const db=signupDatabase(),{name,email,phone}=input.data;
  let rows=(await db.prepare('SELECT id,name,email,phone FROM signups').all<Person>()).results;
  let match=matchPerson(name,rows,email,phone);
  if(match.kind==='verify')return reply({status:'verify',session});
  if(match.kind==='new'){
   if(input.data.action!=='register')return reply({status:'register',session});
   const normalizedEmail=email!.trim().toLowerCase();
   const existing=rows.find(p=>p.email.trim().toLowerCase()===normalizedEmail);
   if(existing)return reply({error:'That email is already registered. Use the name on that signup.'},409);
   await db.prepare("INSERT INTO signups(id,name,email,phone,source) SELECT ?,?,?,?,'check_in' WHERE NOT EXISTS(SELECT 1 FROM signups WHERE LOWER(TRIM(email))=?)").bind(crypto.randomUUID(),name,normalizedEmail,phone!,normalizedEmail).run();
   rows=(await db.prepare('SELECT id,name,email,phone FROM signups').all<Person>()).results;match=matchPerson(name,rows,normalizedEmail,phone);
  }
  if(match.kind!=='match')return reply({error:'Ask the organizer to help match your registration.'},409);
  // Duplicate records with the same full name share the oldest canonical ID used by the baseline migration.
  const person=match.person;const canonical=await db.prepare('SELECT MIN(id) AS id FROM signups WHERE LOWER(TRIM(name))=LOWER(TRIM(?))').bind(person.name).first<{id:string}>();const id=canonical?.id||person.id;
  await db.prepare('INSERT OR IGNORE INTO attendance(session_id,participant_email,signup_id) VALUES(?,?,?)').bind(session.id,person.email.trim().toLowerCase(),id).run();
  const count=(await db.prepare('SELECT COUNT(*) AS count FROM attendance WHERE signup_id=?').bind(id).first<{count:number}>())?.count??0;
  return reply({status:'checked_in',session,attendanceCount:count});
 }catch{console.error('Check-in unavailable');return reply({error:'Check-in is temporarily unavailable. Retrying will not count the class twice.'},503);}
}
