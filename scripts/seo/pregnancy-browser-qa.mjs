import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { join, resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { once } from 'node:events';

const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, ms = 12000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < ms) {
    try { last = await fn(); if (last) return last; } catch (error) { last = error.message; }
    await pause(80);
  }
  throw new Error(`${label} timed out: ${String(last)}`);
}

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon' };
export async function staticFixture(root) {
  root = resolve(root);
  const server = createServer(async (req, res) => {
    try {
      if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
      const path = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      let file = resolve(root, '.' + path);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404).end(); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

function browserPath() {
  const candidates = [];
  if (process.platform !== 'win32') return null;
  for (const root of [process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA]) {
    if (root) candidates.push(join(root,'Google','Chrome','Application','chrome.exe'),join(root,'Microsoft','Edge','Application','msedge.exe'));
  }
  return candidates.find(existsSync);
}

async function cdpConnection(url) {
  const socket = new WebSocket(url);
  const pending = new Map(); let seq = 0;
  const handlers = new Map();
  await new Promise((res, rej) => { socket.addEventListener('open', res, {once:true}); socket.addEventListener('error', rej, {once:true}); });
  socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const p = pending.get(msg.id); if (!p) return;
      pending.delete(msg.id); clearTimeout(p.timeout);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    } else if (msg.method) handlers.get(msg.method)?.(msg.params);
  });
  socket.addEventListener('close', () => { for (const p of pending.values()) { clearTimeout(p.timeout); p.reject(new Error('Browser CDP closed')); } pending.clear(); });
  function send(method, params = {}) { return new Promise((resolve,reject) => { const id=++seq; const timeout=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},10000); pending.set(id,{resolve,reject,timeout}); socket.send(JSON.stringify({id,method,params})); }); }
  return {send, on:(name, fn)=>handlers.set(name,fn), close:()=>socket.close()};
}

const slug = 'pregnancy-weight-gain-calculator';
export async function verifyPregnancyBrowser(root, { executable = browserPath(), linuxTest = false } = {}) {
  if (!executable || !existsSync(executable)) throw new Error('BLOCKED: no existing local Chrome or Edge installation found; no browser installed.');
  const {server, origin} = await staticFixture(root);
  const profile = await mkdtemp(join(tmpdir(), 'hls-pregnancy-browser-'));
  const args = ['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--disable-component-update','--disable-extensions','--disable-default-apps','--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','about:blank'];
  if (linuxTest && process.platform !== 'win32') args.unshift('--no-sandbox');
  const child = spawn(executable,args,{stdio:'ignore',windowsHide:true});
  let launchError; child.on('error',e=>{launchError=e.message});
  let cdp;
  const results=[];
  try {
    const port = await until(async()=>{if(launchError)throw Error(launchError); const p=await readFile(join(profile,'DevToolsActivePort'),'utf8');return Number(p.split(/\r?\n/)[0])||false},'browser port');
    const page = await until(async()=> (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(p=>p.type==='page'&&p.webSocketDebuggerUrl),'page target');
    cdp=await cdpConnection(page.webSocketDebuggerUrl);
    const send=cdp.send;
    cdp.on('Fetch.requestPaused',p=>{const allow=p.request.url.startsWith(origin+'/');void send(allow?'Fetch.continueRequest':'Fetch.failRequest',allow?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}).catch(()=>{});});
    await send('Fetch.enable',{patterns:[{urlPattern:'http://*'},{urlPattern:'https://*'}]});
    await send('Page.enable'); await send('Runtime.enable');
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
    const js = (fn, ...args) => evaluate(`(${fn.toString()})(${args.map(a=>JSON.stringify(a)).join(',')})`);
    const wait = (fn,label,...args)=>until(()=>js(fn,...args),label);
    const snapshot = ()=>js(()=>{const c=document.querySelector('.calc');const r=c?.querySelector('.calc__result-in');return {valid:!!r,warning:!!c?.textContent.includes('Seek immediate medical care'),primary:r?.querySelector('.calc__value')?.textContent??'',rows:Array.from(r?.querySelectorAll('.calc__rows .calc__row')??[],n=>[n.querySelector('dt')?.textContent,n.querySelector('dd')?.textContent]),gauge:!!c?.querySelector('.gauge'),error:c?.querySelector('.calc__error')?.textContent??'',note:r?.querySelector('.calc__note')?.textContent??''};});
    const set = (key,value)=>js((slug,key,value)=>{const el=document.getElementById(`calc-${slug}-${key}`);if(!el)throw Error(`Missing field ${key}`);el.value=value;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));return true;},slug,key,value);
    const units=label=>js(label=>{const b=Array.from(document.querySelectorAll('.calc [aria-label="Unit system"] button')).find(x=>x.textContent.trim()===label);if(!b)throw Error('Missing unit '+label);b.click();return true;},label);
    async function result(expect,label) {
      const r=await until(async()=>{const r=await snapshot();return r.valid===expect.valid && (!expect.primary||r.primary===expect.primary)&&(!expect.rows||expect.rows.every(([k,v])=>r.rows.some(([key,val])=>key===k&&val.includes(v)))) ? r : false;},label);
      assert.equal(r.warning,true,label+' warning'); assert.equal(r.gauge,false,label+' no gauge'); return r;
    }
    const change='Measured weight change', bmi='Pre-pregnancy BMI (category uses unrounded BMI)', week='Second/third-trimester weekly reference rate', first='First-trimester total reference (not a weekly target)';
    const desktop=[];
    for(const [path,embedded] of [[`/tools/${slug}`,false],['/wellness-hub/pregnancy-weight-gain-calculator-healthy-range-guide',true]]) {
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
      const nav=await send('Page.navigate',{url:origin+path}); if(nav.errorText)throw Error('Local navigation failed: '+nav.errorText);
      try { await wait((slug,embedded,path)=>{if(location.pathname.replace(/\/$/,'')!==path)return false;const c=document.querySelector(embedded?`.wh-embed[data-tool="${slug}"] .calc`:'.calc');if(!c||document.querySelectorAll('.calc').length!==1)return false;c.scrollIntoView({block:'center'});const island=c.closest('astro-island');return !!island&&!island.hasAttribute('ssr')&&document.readyState!=='loading';},'hydrated calculator',slug,embedded,path); } catch(e) { const state=await js(()=>({path:location.pathname,ready:document.readyState,calculators:document.querySelectorAll('.calc').length,islands:document.querySelectorAll('astro-island').length,ssr:document.querySelectorAll('astro-island[ssr]').length,title:document.title})); throw Error(e.message+' '+JSON.stringify(state)); }
      const initial=await result({valid:false},'initial unconfirmed');assert.match(initial.error,/Confirm that you are carrying one baby/);
      assert.equal(await js(slug=>document.getElementById(`calc-${slug}-pregnancyType`).value,slug),'unconfirmed');
      await js(()=>{const c=document.querySelector('.calc');window.__hlsRangeSamples=[];window.__hlsRangeObserver=new MutationObserver(()=>{const v=c.querySelector('.calc__value')?.textContent;if(v)window.__hlsRangeSamples.push(v)});window.__hlsRangeObserver.observe(c,{subtree:true,childList:true,characterData:true});});
      await set('pregnancyType','singleton');await result({valid:true,primary:'11.5–16 kg'},'singleton default');
      await pause(650);const samples=await js(()=>{window.__hlsRangeObserver.disconnect();return window.__hlsRangeSamples});
      assert.ok(samples.length>0&&samples.every(v=>v==='11.5–16 kg'),'The reference range must not animate through inaccurate values: '+JSON.stringify(samples));
      // Set fields sequentially and wait for the actual render after each event.
      await set('weight','68.1');await result({valid:true,primary:'7–11.5 kg'},'metric cutoff');
      await set('height','165');await set('current','65.1');await result({valid:true,primary:'7–11.5 kg',rows:[[bmi,'Overweight'],[change,'-3 kg']]},'metric signed change');
      const a=await snapshot();
      await units('Imperial');const b=await result({valid:true,primary:'15–25 lb',rows:[[bmi,'Overweight'],[change,'-6.6 lb'],[week,'0.5–0.7 lb/week']]},'imperial same BMI');
      for(let i=0;i<2;i++){await units('Metric');await result({valid:true,primary:'7–11.5 kg',rows:[[change,'-3 kg'],[bmi,'Overweight']]},'metric return');await units('Imperial');await result({valid:true,primary:'15–25 lb',rows:[[bmi,'Overweight']]},'imperial return');}
      await set('weight','145');await result({valid:true,primary:'25–35 lb',rows:[[bmi,'Normal weight']]},'edited imperial weight');
      await set('height_in','');await result({valid:false},'blank inches');await set('height_in','5');await result({valid:true},'valid restored height');
      await units('Metric');await result({valid:true},'return metric');await set('height','165');await set('weight','68.1');await result({valid:true,primary:'7–11.5 kg'},'explicit metric height');
      await set('week','13');await result({valid:true,rows:[[first,'0.5–2 kg']]},'week 13');await set('week','14');await result({valid:true,rows:[[week,'0.23–0.33 kg/week']]},'week 14');
      await set('week','14.5');await result({valid:false},'fractional week');await set('week','41');const late=await result({valid:true},'week 41');assert.match(late.note,/no separate target for weeks 41–42/i);
      await set('pregnancyType','multiple-or-unknown');await result({valid:false},'multiples blocked');await set('pregnancyType','unconfirmed');await result({valid:false},'unknown blocked');await set('pregnancyType','singleton');await result({valid:true},'confirmed again');
      await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true,screenWidth:375,screenHeight:812});
      await js(()=>{document.querySelector('.calc').scrollIntoView({block:'start'});});
      await wait(()=>{const c=document.querySelector('.calc'),r=c.getBoundingClientRect();return Math.abs(innerWidth-375)<=2&&r.width>0&&r.left>=-1&&r.right<=innerWidth+1&&c.scrollWidth<=c.clientWidth+2&&Array.from(c.querySelectorAll('input,select')).every(e=>e.getBoundingClientRect().width>0);},'mobile control layout');
      await js(slug=>document.getElementById(`calc-${slug}-pregnancyType`).focus(),slug);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      await wait(slug=>document.activeElement.id===`calc-${slug}-weight`,'keyboard focus order',slug);
      desktop.push({a,b});results.push({path,pass:true});
    }
    assert.deepEqual(desktop[0],desktop[1],'Standalone and embedded calculator outputs differ');
    console.log('PREGNANCY_BROWSER_QA: '+JSON.stringify({pass:true,pages:results,parity:true,mobile:true,keyboard:true}));
    return results;
  } finally {cdp?.close();child.kill();server.closeAllConnections?.();await new Promise(r=>server.close(r));}
}
