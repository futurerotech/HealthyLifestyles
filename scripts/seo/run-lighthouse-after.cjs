const { navigation } = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

async function run() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] })
  const urls = [
    { name: 'home', url: 'http://localhost:4321/' },
    { name: 'article', url: 'http://localhost:4321/wellness-hub/how-many-calories-to-lose-weight' },
    { name: 'tool', url: 'http://localhost:4321/tools/calorie-calculator' }
  ]
  const results = []
  for (const { name, url } of urls) {
    const runnerResult = await navigation(url, {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
      throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    })
    const lhr = runnerResult.lhr || runnerResult
    const audits = lhr.audits
    const perf = lhr.categories.performance
    results.push({
      name,
      score: Math.round(perf.score * 100),
      lcp: audits['largest-contentful-paint'].numericValue,
      cls: audits['cumulative-layout-shift'].numericValue,
      tbt: audits['total-blocking-time'].numericValue,
    })
    fs.writeFileSync(path.join(process.cwd(), 'lighthouse-after-' + name + '.json'), JSON.stringify(lhr, null, 2))
  }
  await chrome.kill()
  console.log(JSON.stringify(results, null, 2))
}
run().catch(err => { console.error(err); process.exit(1) })
