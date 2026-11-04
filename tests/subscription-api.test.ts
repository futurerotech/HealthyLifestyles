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
const leadOptions = (await import('../src/pages/api/lead.ts')).OPTIONS;
const recipe = (await import('../src/pages/api/analyze-recipe.ts')).POST;
const originalFetch = globalThis.fetch;
const originalVercelEnv = process.env.VERCEL_ENV;

test('lead preflight permits only configured origins without contacting CMS', async () => {
  assert.equal(typeof leadOptions, 'function');
  for (const [origin, allowed] of [['https://www.healthylifesstyles.com', true], ['https://attacker.example', false]] as const) {
    const response = await leadOptions({ request: new Request('https://www.healthylifesstyles.com/api/lead', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } }) } as any);
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), allowed ? origin : null);
    assert.match(response.headers.get('vary') || '', /origin/i);
  }
  assert.equal(calls.length, 0);
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
    assert.equal((await handler({ request: new Request('https://site.test', { method: 'POST', body: '{' }) } as any)).status, 400);
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
  process.env.VERCEL_ENV = 'production';
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, { CMS_URL: 'https://cms.example.test', INTERNAL_API_KEY: 'internal-test', CMS_API_KEY: 'admin-test' });
  calls = [];
  respond = async () => Response.json({ doc: { id: 'saved' } }, { status: 201 });
  globalThis.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return respond(String(url), init); };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
});
const request = (body: unknown) => ({ request: new Request('https://www.healthylifesstyles.com/api/test', { method: 'POST', body: JSON.stringify(body) }) }) as any;
const pushBody = { endpoint: 'https://push.example.test/send/id', keys: { auth: 'a'.repeat(22), p256dh: 'B'.repeat(87) } };

test('nonproduction and unknown environments make zero CMS or webhook requests despite credentials and spoofed headers', async () => {
  env.N8N_WEBHOOK_URL = 'https://workflow.example.test/lead';
  env.N8N_API_KEY = 'workflow-test';
  for (const target of ['preview', 'development', 'unknown', '']) {
    if (target) process.env.VERCEL_ENV = target; else delete process.env.VERCEL_ENV;
    for (const [handler, body] of [[subscribe, { email: 'user@example.com' }], [lead, { email: 'user@example.com' }], [push, pushBody], [recipe, { text: 'one cup of oats', servings: 1 }]] as const) {
      const req = new Request('https://www.healthylifesstyles.com/api/test', { method: 'POST', headers: { Origin: 'https://www.healthylifesstyles.com', Host: 'www.healthylifesstyles.com', Cookie: 'role=admin', 'x-vercel-env': 'production' }, body: JSON.stringify(body) });
      assert.equal((await handler({ request: req } as any)).status, 503, target || 'missing');
      assert.equal(calls.length, 0);
    }
  }
  process.env.VERCEL_ENV = 'preview';
  const preflight = await leadOptions({ request: new Request('https://site.test/api/lead', { method: 'OPTIONS', headers: { Origin: 'https://www.healthylifesstyles.com' } }) } as any);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://www.healthylifesstyles.com');
  assert.equal(calls.length, 0);
});

test('recipe analysis retains production forwarding', async () => {
  respond = async () => Response.json({ ok: true });
  assert.equal((await recipe(request({ text: 'one cup of oats', servings: 1 }))).status, 200);
  assert.match(calls[0]!.url, /\/api\/analyze-recipe$/);
});

test('subscription proxies authenticate CMS creates with the internal key only', async () => {
  for (const [handler, body] of [[subscribe, { email: 'user@example.com' }], [push, pushBody]] as const) {
    assert.equal((await handler(request(body))).status, 200);
    const headers = new Headers(calls.at(-1)!.init.headers);
    assert.equal(headers.get('x-internal-key'), 'internal-test');
    assert.equal(headers.get('authorization'), null);
  }
});
