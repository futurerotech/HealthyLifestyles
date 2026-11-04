import test from 'node:test';
import assert from 'node:assert/strict';
import { needsPrimaryToolEmbed } from '../../../src/lib/article-primary-tool.mjs';

const canonical = slug => slug === 'old-bmi' ? 'bmi-calculator' : slug;
test('a primary calculator missing from the article requires the live embed', () => {
  assert.equal(needsPrimaryToolEmbed('bmi-calculator', [{ type: 'p', text: 'Intro' }], canonical), true);
  assert.equal(needsPrimaryToolEmbed('', [], canonical), false);
});
test('authored tool and CMS calculator blocks avoid duplicate primary calculators', () => {
  for (const block of [
    { type: 'tool', slug: 'old-bmi' },
    { type: 'cms', block: { blockType: 'calculatorEmbed', tool: { slug: 'bmi-calculator' } } },
    { type: 'cms', block: { blockType: 'toolEmbed', tool: 'old-bmi' } },
  ]) assert.equal(needsPrimaryToolEmbed('bmi-calculator', [block], canonical), false);
  assert.equal(needsPrimaryToolEmbed('bmi-calculator', [{ type: 'tool', slug: 'water' }], canonical), true);
});
