import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

// Local source browser QA only. No deployed Preview, CMS writes, external browser service or paid API.
const host = '127.0.0.1';
const delay = ms => new Promise(ok => setTimeout(ok, ms));
const freePort = () => new Promise((ok,fail) => {
  const s = createServer(); s.on('error',fail);
  s.listen(0,host,()=>{const n=s.address().port;s.close(()=>ok(n));});
});
async function until(fn, label, timeout=65000) {
  const deadline=Date.now()+timeout; let last;
  while(Date.now()<deadline) {
    try { const value=await fn(); if(value)return value; }
    catch(e){last=e;}
    await delay(200);
  }
  throw Error('Timeout '+label+(last?' : '+String(last).slice(0,180):''));
}
function findChrome() {
  for(const name of [process.env.CHROME_PATH,'google-chrome','google-chrome-stable','chromium','chromium-browser']) {
    if(!name)continue;
    const r=spawnSync('which',[name],{encoding:'utf8'});
    if(r.status===0)return r.stdout.trim();
    if(name.startsWith('/'))return name;
  }
  throw Error('Chrome/Chromium not installed on CI');
}
function connect(wsUrl) {
  const ws=new WebSocket(wsUrl),inflight=new Map();let next=0;
  const ready=new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true});});
  ws.addEventListener('message',event=>{
    const msg=JSON.parse(event.data);
    const p=inflight.get(msg.id);if(!p)return;
    inflight.delete(msg.id);
    msg.error?p.fail(Error(JSON.stringify(msg.error))):p.ok(msg.result);
  });
  return {async send(method,params={},sessionId){
    await ready;const id=++next;
    return new Promise((ok,fail)=>{inflight.set(id,{ok,fail});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  },close(){ws.close();}};
}
test('real Astro Push-Up page: interactive inputs, sex reference, desktop and 390px mobile', {timeout:185000}, async()=>{
  const port=await freePort(),chromePort=await freePort(),profile=mkdtempSync(join(tmpdir(),'hls-push-up-qa-'));
  const log=[];let astro,chrome,cdp;
  try {
    astro=spawn('npm',['run','dev','--','--host',host,'--port',String(port)],{
      env:{...process.env,CMS_DISABLE:'1',CMS_URL:'http://127.0.0.1:9',INDEXNOW_DISABLE:'true',VERCEL_ENV:'development'},
      stdio:['ignore','pipe','pipe'],detached:true
    });
    for(const stream of [astro.stdout,astro.stderr])stream.on('data',d=>{log.push(String(d));if(log.length>30)log.shift();});
    const origin='http://'+host+':'+port;
    await until(async()=>{
      if(astro.exitCode!==null)throw Error('Astro exited '+astro.exitCode);
      const r=await fetch(origin+'/tools/push-up-test-calculator');return r.ok;
    },'offline Astro tool response',80000);
    chrome=spawn(findChrome(),[
      '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
      '--no-first-run','--no-default-browser-check','--disable-background-networking',
      '--remote-debugging-port='+chromePort,'--user-data-dir='+profile,'about:blank'
    ],{stdio:'ignore'});
    const info=await until(async()=>{
      if(chrome.exitCode!==null)throw Error('Chrome exited '+chrome.exitCode);
      const r=await fetch('http://'+host+':'+chromePort+'/json/version');
      return r.ok?r.json():null;
    },'Chrome remote debugger',25000);
    cdp=connect(info.webSocketDebuggerUrl);
    const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
    const send=(method,params={})=>cdp.send(method,params,sessionId);
    const js=async expression=>{
      const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(x.exceptionDetails)throw Error(JSON.stringify(x.exceptionDetails).slice(0,400));
      return x.result.value;
    };
    await send('Runtime.enable');await send('Page.enable');
    const viewport=(width,height,mobile)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await viewport(390,844,true);
    const nav=await send('Page.navigate',{url:origin+'/tools/push-up-test-calculator'});
    assert.ok(!nav.errorText,'local Chrome navigation '+nav.errorText);
    await until(()=>js("location.pathname==='/tools/push-up-test-calculator'&&!!document.querySelector('.tool__calc')"),'tool DOM');
    await js("document.querySelector('.tool__calc').scrollIntoView({block:'center'})");
    await until(()=>js("(()=>{const island=document.querySelector('.tool__calc astro-island');return !!island&&!island.hasAttribute('ssr')&&!!document.getElementById('calc-push-up-test-calculator-pushups');})()"),'actual client:visible hydration (Astro ssr attribute removed)',65000);
    const snapshot=()=>js("(()=>{const r=document.querySelector('.tool__calc .calc');const b=r.getBoundingClientRect();return {badge:r.querySelector('.calc__badge')?.textContent?.trim()??'',error:r.querySelector('.calc__error')?.textContent?.trim()??'',text:r.textContent.replace(/\\s+/g,' ').trim().slice(0,1600),w:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,left:b.left,right:b.right};})()");
    const input=async(key,value)=>{
      const id='calc-push-up-test-calculator-'+key;
      const exp="(()=>{const e=document.getElementById("+JSON.stringify(id)+");if(!e)return false;"+
        "Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+JSON.stringify(String(value))+");"+
        "e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()";
      assert.equal(await js(exp),true,'field '+key);
    };
    const hasBadge=b=>until(async()=>(await snapshot()).badge===b,'badge '+b,8000);
    await input('age',30);await input('pushups',22);
    await hasBadge('Very good');
    await input('pushups',20);await hasBadge('Good');
    assert.match((await snapshot()).text,/standard push-ups \(toes\)/);
    assert.equal(await js("(()=>{const b=[...document.querySelectorAll('.tool__calc .seg[aria-label=\"Sex\"] button')].find(x=>x.textContent.trim()==='Female');if(!b)return false;b.click();return true;})()"),true);
    await hasBadge('Very good');
    assert.match((await snapshot()).text,/modified push-ups \(knees\)/);
    await input('age',19);await hasBadge('Not graded for this age');
    await input('age',30);await input('pushups',20.5);
    await until(async()=>/whole number/i.test((await snapshot()).error),'fractional rep rejected',8000);
    await input('pushups',0);await hasBadge('Poor');
    await input('pushups',201);await until(async()=>!!(await snapshot()).error,'over-200 rejected',8000);
    await input('pushups',20);await input('plank',60);await hasBadge('Very good');
    assert.match((await snapshot()).text,/Optional plank hold \(not graded\).*60 sec/);
    const mobile=await snapshot();
    if(mobile.scroll>mobile.client+1) {
      const offenders=await js("(()=>{const w=document.documentElement.clientWidth;return [...document.body.querySelectorAll('*')].filter(e=>!e.closest('.mobile-panel,.mobile-overlay,.mega')).map(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {tag:e.tagName.toLowerCase(),className:String(e.className||'').slice(0,110),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),scrollWidth:e.scrollWidth,overflowX:cs.overflowX,position:cs.position};}).filter(e=>e.right>w+1&&e.width>0).sort((a,b)=>b.right-a.right).slice(0,20);})()");
      console.error('[PUSHUP_MOBILE_OFFENDERS] '+JSON.stringify(offenders));
    }
    assert.ok(mobile.scroll<=mobile.client+1,'390px page overflow '+JSON.stringify(mobile));
    assert.ok(mobile.left>=-1&&mobile.right<=mobile.w+1,'390px calculator fit');
    assert.equal(await js("(()=>{const e=document.getElementById('calc-push-up-test-calculator-pushups');e.focus();return document.activeElement===e;})()"),true,'keyboard focus');
    await viewport(1440,900,false);
    const desktop=await snapshot();
    assert.equal(desktop.badge,'Very good');
    assert.ok(desktop.scroll<=desktop.client+1,'desktop horizontal overflow');
    assert.ok(desktop.right<=desktop.w+1,'desktop calculator fit');
    console.log('[PUSHUP_BROWSER_QA] PASS: original Astro + Preact offline UI, male20=Good, female20=Very-good, age19=ungraded, decimal/201 errors, zero=Poor, optional plank, keyboard focus, 390x844 and 1440x900 fit. CMS article was NOT changed.');
  } catch(e) {
    console.error('[PUSHUP_BROWSER_QA] FAIL '+String(e));
    console.error('[PUSHUP_ASTRO_LOG] '+log.join('').slice(-2500));
    throw e;
  } finally {
    cdp?.close();
    if(chrome?.pid){chrome.kill('SIGTERM');await new Promise(ok=>{if(chrome.exitCode!==null)return ok();chrome.once('exit',ok);setTimeout(ok,1600);});}
    if(astro?.pid){try{process.kill(-astro.pid,'SIGTERM');}catch{astro.kill('SIGTERM');}}
    await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});
  }
});
