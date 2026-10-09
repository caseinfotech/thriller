import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {classes,checkInSchema,todaysClasses,easternDay,matchPerson} from '../lib/check-in.ts';
const people=[{id:'a',name:'Curtis Eldred',email:'curt@example.test',phone:'12695550100'},{id:'b',name:'Jewel Lynn Hurn',email:'jewel@example.test',phone:''},{id:'c',name:'Emmi Ryan',email:'',phone:''}];
test('only today’s class in Eastern time is offered',()=>{
 assert.equal(easternDay(new Date('2026-10-09T02:00:00Z')),'2026-10-08');
 assert.deepEqual(todaysClasses(new Date('2026-10-09T02:00:00Z')).map(c=>c.id),[classes[0].id]);
 assert.equal(todaysClasses(new Date('2026-10-09T12:00:00Z')).length,0);
 assert.equal(todaysClasses(new Date('2026-10-15T21:00:00Z'))[0].id,classes[1].id);
 assert.equal(checkInSchema.safeParse({action:'register',sessionId:classes[0].id,name:'New Person',email:'bad',phone:'123'}).success,false);
});
test('name matching handles formatting, middle names and nicknames without guessing typos',()=>{
 assert.equal(matchPerson(' CURTIS  ELDRED ',people).person.id,'a');
 assert.equal(matchPerson('Curt Eldred',people).person.id,'a');
 assert.equal(matchPerson('Jewel Hurn',people).person.id,'b');
 assert.equal(matchPerson('Emmi Ryan',people).person.id,'c');
 assert.equal(matchPerson('Curtis Eldredx',people).kind,'verify');
 assert.equal(matchPerson('Curt',people).kind,'verify');
 assert.equal(matchPerson('Curtis Eldredx',people,undefined,'269-555-0100').person.id,'a');
 assert.equal(matchPerson('Curtis Eldredx',people,'wrong@example.test').kind,'verify');
 assert.equal(matchPerson('New Person',people).kind,'new');
 assert.equal(matchPerson('Jewel Hurn',[...people,{id:'d',name:'Jewel Ann Hurn',email:'other@example.test',phone:''}]).kind,'verify');
});
test('migration seeds existing people into class 1, including name-only records, and scans remain idempotent',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE signups(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);');
 db.exec("INSERT INTO signups(id,name,email,phone) VALUES('old','Paper Person','',''),('duplicate','Paper Person','',''),('another','Other Person','other@example.test','');");
 db.exec(readFileSync(new URL('../drizzle/0002_little_sally_floyd.sql',import.meta.url),'utf8'));
 assert.equal(db.prepare('SELECT source FROM signups LIMIT 1').get().source,'existing');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM attendance').get().n,2);
 const insert=db.prepare('INSERT OR IGNORE INTO attendance(session_id,participant_email,signup_id) VALUES(?,?,?)');
 for(const c of classes){insert.run(c.id,'','duplicate');insert.run(c.id,'','duplicate');}
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM attendance WHERE signup_id=?').get('duplicate').n,4);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM attendance WHERE session_id=?').get(classes[0].id).n,2);
 db.close();
});
