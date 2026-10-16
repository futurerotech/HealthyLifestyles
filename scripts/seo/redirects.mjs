export const LEGACY_REDIRECTS = {
  '/tools/body-fat-percentage-calculator': '/tools/body-fat-calculator',
  '/tools/how-much-protein-do-i-need': '/tools/protein-intake-calculator',
};

export function buildRedirects(docs, local = []) {
  const rules = new Map(local.map((r) => [r.source, { destination: r.destination, status: r.permanent ? 301 : 302 }]));
  for (const doc of docs) {
    if (!/^\/(?:[a-z0-9-]+\/?)+$/.test(doc.from || '') || doc.from.startsWith('/api/')) throw new Error(`Invalid redirect source: ${doc.from}`);
    const destination = new URL(doc.to, 'https://www.healthylifesstyles.com');
    if (!['http:', 'https:'].includes(destination.protocol) || destination.username || destination.password) throw new Error(`Invalid redirect destination for ${doc.from}`);
    rules.set(doc.from.replace(/\/$/, ''), { destination: doc.to, status: doc.type === '302' ? 302 : 301 });
  }
  for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) rules.set(from, { destination: to, status: 301 });
  for (const start of rules.keys()) {
    const visited = new Set();
    let path = start;
    while (rules.has(path)) {
      if (visited.has(path)) throw new Error(`Redirect cycle at ${start}`);
      visited.add(path);
      const url = new URL(rules.get(path).destination, 'https://www.healthylifesstyles.com');
      if (url.origin !== 'https://www.healthylifesstyles.com') break;
      path = url.pathname.replace(/\/$/, '') || '/';
    }
  }
  return Object.fromEntries(rules);
}

export async function fetchRedirectSnapshot(env) {
  if (env.CMS_DISABLE === '1') return null;
  const docs = [];
  for (let page = 1; ; page++) {
    try {
      const response = await fetch(`${(env.CMS_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/redirects?limit=100&page=${page}&depth=0`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.docs)) throw new Error('Invalid redirects response');
      docs.push(...data.docs);
      if (docs.length >= data.totalDocs) return docs;
      if (!data.docs.length) throw new Error('Incomplete redirects response');
    } catch (error) {
      if (env.VERCEL_ENV === 'production' && env.ALLOW_LOCAL_CONTENT_FALLBACK !== 'true') throw new Error(`CMS redirects unavailable: ${error.message}`);
      return null;
    }
  }
}
