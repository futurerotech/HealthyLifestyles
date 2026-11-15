// Read-only inventory of candidate price sources for the meal-plan grocery estimate.
// Prints every current BLS AP U.S. city-average item and the raw USDA ERS fruit and
// vegetable price tables, so a human can match ingredients to the same food. It never
// writes anywhere and is never run at page build or in the browser.
const UA = { 'user-agent': 'HealthyLifeStyles price snapshot (hello@healthylifesstyles.com)' };
const BLS = 'https://download.bls.gov/pub/time.series/ap/';
export const ERS = {
  fruits: 'https://www.ers.usda.gov/media/6210/all-fruits-average-prices-csv-format.csv?v=63344',
  vegetables: 'https://www.ers.usda.gov/media/6240/all-vegetables-average-prices-csv-format.csv?v=29890',
};
const get = async (u) => { const r = await fetch(u, { headers: UA }); if (!r.ok) throw Error(`${u}: HTTP ${r.status}`); return r.text(); };
const tsv = (t) => t.trim().split('\n').map((l) => l.split('\t').map((c) => c.trim()));

async function blsCurrent() {
  const [items, series, data] = await Promise.all(['ap.item', 'ap.series', 'ap.data.0.Current'].map((f) => get(BLS + f)));
  const nameByCode = new Map(tsv(items).slice(1).map((r) => [r[0], r[1]]));
  const itemBySeries = new Map(tsv(series).slice(1).filter((r) => r[1] === '0000').map((r) => [r[0], r[2]]));
  const latest = new Map();
  for (const [id, year, period, value] of tsv(data).slice(1)) {
    if (!itemBySeries.has(id) || !/^M(0[1-9]|1[0-2])$/.test(period) || !(+value > 0)) continue;
    const k = +year * 12 + +period.slice(1);
    if (!latest.has(id) || k > latest.get(id).k) latest.set(id, { k, period: `${year}-${period.slice(1)}`, price: +value });
  }
  const newest = Math.max(...[...latest.values()].map((v) => v.k));
  return [...latest].filter(([, v]) => newest - v.k <= 3).map(([id, v]) => `${id}\t${v.period}\t${v.price}\t${nameByCode.get(itemBySeries.get(id))}`).sort();
}

async function main() {
  const bls = await blsCurrent();
  console.log(`[BLS_CURRENT] ${bls.length} items`);
  for (const l of bls) console.log('[BLS] ' + l);
  for (const [k, u] of Object.entries(ERS)) {
    const text = await get(u);
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    console.log(`[ERS_${k.toUpperCase()}] ${lines.length} lines`);
    for (const l of lines) console.log(`[ERS:${k}] ${l}`);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
