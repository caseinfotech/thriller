import test from 'node:test';
import assert from 'node:assert/strict';
import { noticeSchema, uniqueRecipients, noticeEmails, pinDigest, matchesPin } from '../lib/notice-mailer.ts';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const valid={action:'send',pin:'123456',requestId:a,recipientIds:[a],subject:'Practice reminder',message:'Practice begins Thursday at five.'};
test('accepts registered IDs only and rejects extra recipient fields',()=>{
 assert.equal(noticeSchema.safeParse(valid).success,true);
 for(const changed of [{recipientIds:[a,a]},{recipientIds:[]},{recipientIds:['arbitrary@email.test']},{to:'arbitrary@email.test'},{subject:'Reminder\nBcc: other@email.test'},{pin:'12345'}])assert.equal(noticeSchema.safeParse({...valid,...changed}).success,false);
});
test('resolves only selected registrations, deduplicates addresses, and keeps retries deterministic',()=>{
 const rows=[{id:a,email:'B@EXAMPLE.TEST'},{id:b,email:'a@example.test'}];
 assert.deepEqual(uniqueRecipients(rows,[a,b]),uniqueRecipients([...rows].reverse(),[b,a]));
 assert.deepEqual(uniqueRecipients([{id:a,email:'person@example.test'},{id:b,email:'PERSON@example.test'}],[a,b]),['person@example.test']);
 assert.throws(()=>uniqueRecipients(rows,[a]));assert.throws(()=>uniqueRecipients([rows[0]],[b]));
});
test('every notice has exactly one private recipient and an event footer',()=>{
 const emails=noticeEmails(['a@example.test','b@example.test'],'noreply@nextdesign.dev','Reminder','Practice Thursday');
 assert.deepEqual(emails.map(e=>e.to),[['a@example.test'],['b@example.test']]);
 assert.ok(emails.every(e=>e.subject==='South Haven Thriller — Reminder'&&e.text.includes('https://tinyurl.com/sohathriller')));
 assert.ok(emails.every(e=>!('cc' in e)&&!('bcc' in e)));
});
test('validates the hashed PIN and rejects mismatches',async()=>{
 const hash=await pinDigest('123456');assert.equal(hash.length,64);
 assert.equal(await matchesPin('123456',hash),true);
 assert.equal(await matchesPin('123457',hash),false);assert.equal(await matchesPin('123456',''),false);
});
