import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import sharp from 'sharp';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { GET } = await import('../src/pages/api/result-image.ts');
const request = (params) => GET({ url: new URL(`https://example.invalid/api/result-image?${new URLSearchParams(params)}`) });

test('share endpoint renders valid 1200x630 PNG from escaped SVG text', async () => {
  const response = await request({ value: '24.5', tool: 'BMI & health <guide>', label: 'A result', category: 'Health', color: '#16a34a' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
});
test('share endpoint rejects a missing result and oversized rendering input', async () => {
  assert.equal((await request({})).status, 400);
  assert.equal((await request({ value: 'x'.repeat(65) })).status, 400);
  assert.equal((await request({ value: '1', tool: 'x'.repeat(121) })).status, 400);
});

test('category text remains within its badge on the rendered PNG', async () => {
  const category = 'Healthy';
  const plain = await request({ value: '24.5' });
  const labelled = await request({ value: '24.5', category });
  const [a, b] = await Promise.all([plain, labelled].map(async r =>
    sharp(Buffer.from(await r.arrayBuffer())).removeAlpha().raw().toBuffer()));
  const width = category.length * 30 * 0.7 + 56;
  const left = Math.floor((1200 - width) / 2);
  const right = Math.ceil((1200 + width) / 2);
  let changedOutsideBadge = 0;
  for (let y = 495; y < 530; y++) {
    for (let x = 0; x < 1200; x++) {
      if (x >= left && x <= right) continue;
      const i = (y * 1200 + x) * 3;
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changedOutsideBadge++;
    }
  }
  assert.equal(changedOutsideBadge, 0, 'category text must not spill outside its badge');
});
