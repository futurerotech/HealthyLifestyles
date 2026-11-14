import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const env: Record<string, string> = {};
(globalThis as any).__subscriptionTestEnv = env;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
    return next(specifier, context);
  },
  load(url, context, next) {
    const result = next(url, context);
    if (url.includes('/src/') && result.source) {
      return { ...result, source: String(result.source).replaceAll('import.meta.env', '(globalThis as any).__subscriptionTestEnv') };
    }
    return result;
  },
});
const subscribe = (await import('../src/pages/api/subscribe.ts')).POST;
const push = (await import('../src/pages/api/push-subscribe.ts')).POST;
const lead = (await import('../src/pages/api/lead.ts')).POST;
const originalFetch = globalThis.fetch;

test('lead rejects cross-site, null, localhost, and missing Origins before CMS delivery', async () => {
  const body = JSON.stringify({ email: 'user@example.com' });
  for (const origin of ['https://attacker.example', 'https://www.healthylifesstyles.com.attacker.example', 'http://localhost:4321', 'null', '']) {
    const headers = new Headers({ 'Content-Type': 'text/plain' });
    if (origin) headers.set('Origin', origin);
    const response = await lead({
      request: new Request('https://www.healthylifesstyles.com/api/lead', { method: 'POST', headers, body }),
    } as any);
    assert.equal(response.status, 403, origin || 'missing Origin');
    assert.deepEqual(await response.json(), { ok: false, error: 'Origin not allowed.' });
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(calls.length, 0, 'Denied origin must never reach CMS or webhook I/O');
  }
  const allowed = await lead(request({ email: 'user@example.com' }));
  assert.equal(allowed.status, 200);
  assert.equal(calls[0]?.url, 'https://cms.example.test/api/subscribers');
});

test('server delivery configuration uses env or authenticated CMS and public config strips secrets', async () => {
  const config = await import('../src/lib/lead-config.ts');
  env.N8N_WEBHOOK_URL = 'https://workflow.example.test/lead';
  env.N8N_API_KEY = 'workflow-test';
  assert.equal(typeof config.getLeadDeliveryConfig, 'function');
  assert.deepEqual(await config.getLeadDeliveryConfig(), { n8nWebhookUrl: env.N8N_WEBHOOK_URL, n8nApiKey: 'workflow-test' });
  assert.equal(calls.length, 0);
  delete env.N8N_WEBHOOK_URL;
  delete env.N8N_API_KEY;
  respond = async () => Response.json({ enabled: true, offers: [], successMessage: 'Saved', n8nWebhookUrl: 'https://workflow.example.test/lead', n8nApiKey: 'cms-workflow-test' });
  assert.equal((await config.getLeadDeliveryConfig())?.n8nApiKey, 'cms-workflow-test');
  assert.equal(new Headers(calls.at(-1)!.init.headers).get('authorization'), 'users API-Key admin-test');
  const publicConfig = await config.getLeadGenConfig();
  assert.equal(publicConfig && 'n8nWebhookUrl' in publicConfig, false);
  assert.equal(publicConfig && 'n8nApiKey' in publicConfig, false);
  const count = calls.length;
  delete env.CMS_API_KEY;
  assert.equal(await config.getLeadDeliveryConfig(), null);
  assert.equal(calls.length, count);
});

test('lead waits for CMS acceptance and never forwards or succeeds on CMS failure', async () => {
  let release!: (response: Response) => void;
  respond = () => new Promise(resolve => { release = resolve; });
  let settled = false;
  const pending = Promise.resolve(lead(request({ email: 'a@b.com' }))).then(response => { settled = true; return response; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1, 'No config lookup or forwarding before save');
  assert.equal(settled, false);
  release(Response.json({ message: 'private-upstream-secret' }, { status: 403 }));
  const response = await pending;
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false, error: 'Unable to save subscription. Please try again.' });
  assert.equal(calls.length, 1);
  respond = async () => { throw new Error('private-upstream-secret'); };
  assert.equal((await lead(request({ email: 'a@b.com' }))).status, 502);
});

test('invalid subscription payloads are rejected before contacting CMS', async () => {
  const malformed = [null, [], 'text', { email: 'not-email' }, { email: 'a@b.com', name: {} }, { email: 'a'.repeat(255) + '@b.com' }];
  for (const [handler, bodies] of [
    [subscribe, [...malformed, { email: 'a@b.com', interests: 'all' }, { email: 'a@b.com', metadata: [] }, { email: 'a@b.com', source: {} }]],
    [lead, [...malformed, { email: 'a@b.com', offer: {} }, { email: 'a@b.com', tool: 1 }, { email: 'a@b.com', sourcePage: 'x'.repeat(2049) }]],
    [push, [null, [], {}, { ...pushBody, endpoint: 'http://push.example.test/x' }, { ...pushBody, endpoint: 'https://user:pass@push.example.test/x' }, { ...pushBody, keys: { auth: 12, p256dh: {} } }, { ...pushBody, keys: { auth: 'bad!', p256dh: 'x' } }]],
  ] as const) {
    for (const body of bodies) {
      assert.equal((await handler(request(body))).status, 400, JSON.stringify(body));
    }
    assert.equal((await handler({ request: new Request('https://site.test', { method: 'POST', headers: { Origin: 'https://www.healthylifesstyles.com' }, body: '{' }) } as any)).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('all create routes fail closed without explicit CMS URL and internal key', async () => {
  for (const key of ['CMS_URL', 'INTERNAL_API_KEY']) {
    const saved = env[key];
    for (const value of ['', '   ']) {
      env[key] = value;
      for (const [handler, body] of [[subscribe, { email: 'a@b.com' }], [push, pushBody], [lead, { email: 'a@b.com' }]] as const) {
        const response = await handler(request(body));
        assert.equal(response.status, 503);
        assert.equal((await response.json()).ok, false);
        assert.equal(calls.length, 0);
      }
    }
    env[key] = saved;
  }
});
let calls: { url: string; init: RequestInit }[];
let respond: (url: string, init: RequestInit) => Promise<Response>;
beforeEach(() => {
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, { CMS_URL: 'https://cms.example.test', INTERNAL_API_KEY: 'internal-test', CMS_API_KEY: 'admin-test' });
  calls = [];
  respond = async () => Response.json({ doc: { id: 'saved' } }, { status: 201 });
  globalThis.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return respond(String(url), init); };
});
afterEach(() => { globalThis.fetch = originalFetch; });
const request = (body: unknown) => ({ request: new Request('https://www.healthylifesstyles.com/api/test', { method: 'POST', headers: { Origin: 'https://www.healthylifesstyles.com' }, body: JSON.stringify(body) }) }) as any;
const pushBody = { endpoint: 'https://push.example.test/send/id', keys: { auth: 'a'.repeat(22), p256dh: 'B'.repeat(87) } };

test('subscription proxies authenticate CMS creates with the internal key only', async () => {
  for (const [handler, body] of [[subscribe, { email: 'user@example.com' }], [push, pushBody]] as const) {
    assert.equal((await handler(request(body))).status, 200);
    const headers = new Headers(calls.at(-1)!.init.headers);
    assert.equal(headers.get('x-internal-key'), 'internal-test');
    assert.equal(headers.get('authorization'), null);
  }
});

const unsubscribe = (await import('../src/pages/api/unsubscribe.ts')).POST;
const UNIQUE = () => Response.json({ errors: [{ message: 'The following field is invalid: email', data: { errors: [{ path: 'email', message: 'Value must be unique' }] } }] }, { status: 400 });

test('an existing address gets the same answer as a new signup and is never forwarded again', async () => {
  env.N8N_WEBHOOK_URL = 'https://workflow.example.test/lead';
  respond = async (url) => (url.endsWith('/api/subscribers') ? UNIQUE() : Response.json({ ok: true }));
  const fresh = await subscribe(request({ email: 'a@b.com' }));
  assert.equal(fresh.status, 200);
  assert.deepEqual(await fresh.json(), { ok: true });
  const leadDup = await lead(request({ email: 'a@b.com' }));
  assert.equal(leadDup.status, 200);
  assert.deepEqual(await leadDup.json(), { ok: true, message: 'Subscribed!' });
  assert.equal(calls.filter((c) => c.url.startsWith('https://workflow.example.test')).length, 0, 'duplicate must not re-enter email automation');
  delete env.N8N_WEBHOOK_URL;
});

test('subscribe never echoes upstream error text', async () => {
  respond = async () => Response.json({ message: 'private-upstream-secret' }, { status: 500 });
  const r = await subscribe(request({ email: 'a@b.com' }));
  assert.equal(r.status, 502);
  assert.doesNotMatch(await r.text(), /private-upstream-secret/);
  respond = async () => { throw new Error('private-upstream-secret'); };
  const r2 = await subscribe(request({ email: 'a@b.com' }));
  assert.equal(r2.status, 502);
  assert.doesNotMatch(await r2.text(), /private-upstream-secret/);
});

test('unsubscribe proxy: first-party origin, token shape check, generic answers, no email anywhere', async () => {
  const token = 'v1.' + 'a'.repeat(60) + '.' + 'b'.repeat(43);
  const cross = await unsubscribe({ request: new Request('https://www.healthylifesstyles.com/api/unsubscribe', { method: 'POST', headers: { Origin: 'https://attacker.example' }, body: JSON.stringify({ token }) }) } as any);
  assert.equal(cross.status, 403);
  for (const bad of [{}, { token: 1 }, { token: 'v1.x.y' }, { token: 'a@b.com' }]) assert.equal((await unsubscribe(request(bad))).status, 400);
  assert.equal(calls.length, 0, 'malformed tokens never reach the CMS');
  respond = async () => Response.json({ ok: true, message: 'cms text' });
  const ok = await unsubscribe(request({ token }));
  assert.equal(ok.status, 200);
  assert.equal(calls.at(-1)!.url, 'https://cms.example.test/api/subscriber-unsubscribe');
  assert.deepEqual(JSON.parse(String(calls.at(-1)!.init.body)), { token });
  assert.equal(new Headers(calls.at(-1)!.init.headers).get('x-internal-key'), null, 'the token is the only credential');
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  respond = async () => Response.json({ ok: false }, { status: 400 });
  assert.equal((await unsubscribe(request({ token }))).status, 400);
  respond = async () => new Response('not found', { status: 404 });
  assert.equal((await unsubscribe(request({ token }))).status, 503, 'CMS without the endpoint is reported as unavailable, not as success');
  respond = async () => { throw new Error('down'); };
  assert.equal((await unsubscribe(request({ token }))).status, 503);
  env.CMS_URL = '';
  assert.equal((await unsubscribe(request({ token }))).status, 503);
});
