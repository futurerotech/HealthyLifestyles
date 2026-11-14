// Builds the dated, source-attributed BLS average-price snapshot used by the meal-plan
// grocery estimate (Phase 5 Candidate 1). Reads the official BLS flat files (public
// domain, U.S. government work), U.S. city average (area 0000) only, and prints JSON.
// A human reviews the output and commits it as src/data/bls-price-snapshot.json.
// Never run at page build or in the browser.
const BASE = 'https://download.bls.gov/pub/time.series/ap/';
const UA = { 'user-agent': 'HealthyLifeStyles price snapshot (hello@healthylifesstyles.com)' };
// Exact BLS item names to capture (ap.item). Anything not found is reported, not guessed.
export const ITEMS = {
  eggs: 'Eggs, grade A, large, per doz.',
  milk: 'Milk, fresh, whole, fortified, per gal. (3.8 lit)',
  breadWhole: 'Bread, whole wheat, pan, per lb. (453.6 gm)',
  rice: 'Rice, white, long grain, uncooked, per lb. (453.6 gm)',
  pasta: 'Spaghetti and macaroni, per lb. (453.6 gm)',
  groundBeef: 'Ground beef, 100% beef, per lb. (453.6 gm)',
  sirloin: 'Steak, sirloin, USDA Choice, boneless, per lb. (453.6 gm)',
  chickenBreast: 'Chicken breast, boneless, per lb. (453.6 gm)',
  porkChops: 'Chops, boneless, per lb. (453.6 gm)',
  cheddar: 'Cheddar cheese, natural, per lb. (453.6 gm)',
  butter: 'Butter, salted, grade AA, stick, per lb. (453.6 gm)',
  bananas: 'Bananas, per lb. (453.6 gm)',
  apples: 'Apples, Red Delicious, per lb. (453.6 gm)',
  lemons: 'Lemons, per lb. (453.6 gm)',
  potatoes: 'Potatoes, white, per lb. (453.6 gm)',
  tomatoes: 'Tomatoes, field grown, per lb. (453.6 gm)',
  lettuce: 'Lettuce, iceberg, per lb. (453.6 gm)',
  romaine: 'Lettuce, romaine, per lb. (453.6 gm)',
  peppers: 'Peppers, sweet, per lb. (453.6 gm)',
  broccoli: 'Broccoli, per lb. (453.6 gm)',
  carrots: 'Carrots, short trimmed and topped, per lb. (453.6 gm)',
  peanutButter: 'Peanut butter, creamy, all sizes, per lb. (453.6 gm)',
};
const tsv = (t) => t.trim().split('\n').map((l) => l.split('\t').map((c) => c.trim()));
export const unitOf = (name) => (/per doz/.test(name) ? 'dozen' : /per gal/.test(name) ? 'gallon' : /per lb/.test(name) ? 'lb' : /per 12 oz/.test(name) ? '12oz' : null);

async function get(f) { const r = await fetch(BASE + f, { headers: UA }); if (!r.ok) throw Error(`${f}: HTTP ${r.status}`); return r.text(); }
async function main() {
  const [items, series, data] = await Promise.all(['ap.item', 'ap.series', 'ap.data.0.Current'].map(get));
  const codeByName = new Map(tsv(items).slice(1).map((r) => [r[1], r[0]]));
  const seriesByItem = new Map(tsv(series).slice(1).filter((r) => r[1] === '0000').map((r) => [r[2], r[0]]));
  const latest = new Map();
  for (const [id, year, period, value] of tsv(data).slice(1)) {
    if (!/^M(0[1-9]|1[0-2])$/.test(period) || value === '-' || value === '') continue;
    const key = year + period; const cur = latest.get(id);
    if (!cur || key > cur.key) latest.set(id, { key, year: +year, month: +period.slice(1), price: +value });
  }
  const out = [], missing = [];
  for (const [key, name] of Object.entries(ITEMS)) {
    const code = codeByName.get(name), sid = code && seriesByItem.get(code), v = sid && latest.get(sid);
    if (!v) { missing.push(name); continue; }
    out.push({ key, blsItem: name, seriesId: sid, unit: unitOf(name), period: `${v.year}-${String(v.month).padStart(2, '0')}`, price: v.price });
  }
  console.log('[BLS_SNAPSHOT] ' + JSON.stringify({ source: 'U.S. Bureau of Labor Statistics, CPI Average Price Data (AP), U.S. city average; public domain', sourceUrl: BASE, retrieved: new Date().toISOString().slice(0, 10), items: out, missing }));
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
