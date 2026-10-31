// Run: node --experimental-vm-modules scripts/test-web-session.mjs
// Tests the actual API module with controlled network ordering, no real credentials/database.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../web/api.js',import.meta.url),'utf8');
const reply=(status,data)=>({status,ok:status>=200&&status<300,json:async()=>({success:status<300,data,message:'Service unavailable'})});
const tokens=name=>({accessToken:`access-${name}-test-only`,refreshToken:`refresh-${name}-test-only`});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function module(fetch,initialRefresh){
 const storage=new Map(initialRefresh?[['worksphere.refresh',initialRefresh]]:[]),events=[];
 const context=vm.createContext({fetch,FormData,Event,window:{dispatchEvent:e=>events.push(e.type)},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
 const code=new vm.SourceTextModule(source,{context});await code.link(()=>{throw new Error('Unexpected import');});await code.evaluate();return {api:code.namespace,storage,events};
}
test('logout discards a late response and never refreshes/replays the old request',async()=>{
 const pending=deferred(),calls=[];
 const m=await module(async(path)=>{calls.push(path);return path.endsWith('/login')?reply(200,tokens('A')):pending.promise;});
 await m.api.login('fixture-A','test-only-password');const request=m.api.api('/workplace/work',{method:'POST',body:{title:'Old actor'}});m.api.clearSession();pending.resolve(reply(401));
 await assert.rejects(request,/Phiên làm việc đã thay đổi/);assert.equal(calls.length,2);assert.equal(m.storage.size,0);
});
test('switching accounts cannot replay an old mutation with the new account',async()=>{
 const old=deferred(),calls=[];
 const m=await module(async(path,options)=>{calls.push({path,authorization:options.headers?.Authorization});if(path.endsWith('/login'))return reply(200,tokens(JSON.parse(options.body).login));return old.promise;});
 await m.api.login('A','test-only-password');const mutation=m.api.api('/workplace/work',{method:'POST',body:{title:'A work'}});await m.api.login('B','test-only-password');old.resolve(reply(401));
 await assert.rejects(mutation,/Phiên làm việc đã thay đổi/);assert.equal(calls.length,3);assert.equal(m.storage.get('worksphere.refresh'),tokens('B').refreshToken);
});
test('a late refresh from the previous account cannot overwrite the current tokens',async()=>{
 const old=deferred();let lastAuthorization;
 const m=await module(async(path,options)=>{if(path.endsWith('/refresh'))return old.promise;if(path.endsWith('/login'))return reply(200,tokens('B'));lastAuthorization=options.headers.Authorization;return reply(200,{ok:true});},tokens('A').refreshToken);
 const restoration=m.api.restore();await m.api.login('B','test-only-password');old.resolve(reply(200,tokens('A-new')));assert.equal(await restoration,false);
 await m.api.api('/workplace/context');assert.equal(lastAuthorization,`Bearer ${tokens('B').accessToken}`);assert.equal(m.storage.get('worksphere.refresh'),tokens('B').refreshToken);
});
test('concurrent expired requests share one refresh and retry with the rotated token',async()=>{
 const refresh=deferred(),started=deferred();let refreshCount=0;
 const m=await module(async(path,options)=>{
  if(path.endsWith('/login'))return reply(200,tokens('A'));
  if(path.endsWith('/refresh')){refreshCount++;started.resolve();return refresh.promise;}
  return options.headers.Authorization===`Bearer ${tokens('A2').accessToken}`?reply(200,{ok:true}):reply(401);
 });
 await m.api.login('A','test-only-password');const first=m.api.api('/workplace/context'),second=m.api.api('/workplace/work');await started.promise;refresh.resolve(reply(200,tokens('A2')));await Promise.all([first,second]);assert.equal(refreshCount,1);
});
test('temporary server outage during restore keeps the refresh token for retry',async()=>{
 const m=await module(async()=>reply(503),tokens('A').refreshToken);assert.equal(await m.api.restore(),false);assert.equal(m.storage.get('worksphere.refresh'),tokens('A').refreshToken);
});
