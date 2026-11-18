import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  type DiaryEntry, SYMPTOMS, RED_FLAG_SYMPTOMS,
  MAX_FOODS_LENGTH, MAX_NOTES_LENGTH, localDateTime, parseLocalDateTime,
  validateDiaryInput, parseStoredDiary, hasRedFlag, detectDiaryPatterns,
} from '../../../src/lib/foodSymptomDiary.ts';

const meal = (id: string, datetime: string, foods: string): DiaryEntry => ({
  id, datetime, foods, symptoms: [], severity: 0, notes: '',
});
const symptom = (id: string, datetime: string, symptoms: string[]): DiaryEntry => ({
  id, datetime, foods: '', symptoms, severity: 2, notes: '',
});
const draft = (overrides: Partial<DiaryEntry> = {}) => ({
  datetime: '2026-06-01T10:00', foods: 'oats, milk',
  symptoms: ['Bloating'], severity: 2, notes: 'Test note', ...overrides,
});
const clock = new Date(2026, 5, 1, 11, 0);

test('local datetime uses calendar components, not UTC ISO text', () => {
  const d = new Date(2026, 5, 1, 10, 9);
  assert.equal(localDateTime(d), '2026-06-01T10:09');
  assert.equal(parseLocalDateTime(localDateTime(d))?.getTime(), d.getTime());
  assert.match(readFileSync(new URL('../../../src/islands/FoodSymptomDiary.tsx', import.meta.url),'utf8'),
    /const now = \(\) => localDateTime\(\)/);
});

test('invalid dates are rejected, including impossible calendar dates and malformed strings', () => {
  for (const date of ['', null, NaN, '2026-02-30T12:00',
    '1900-02-29T12:00', '2026-13-01T12:00', '2026-00-01T12:00',
    '2026-04-31T08:00', '2026-12-01T24:00', '2026-12-01T10:60',
    '2026-06-01', '2026-06-01T10:00Z', '0200-01-01T12:00']) {
    assert.equal(parseLocalDateTime(date), null, String(date));
  }
  assert.ok(parseLocalDateTime('2024-02-29T12:30'));
  assert.ok(parseLocalDateTime('2026-01-01T00:00'));
});

test('food-only, symptom-only and combined records are valid with correct severity', () => {
  assert.equal(validateDiaryInput(draft(),clock),null);
  assert.equal(validateDiaryInput(draft({foods:'',symptoms:['Nausea'],severity:1}),clock),null);
  assert.equal(validateDiaryInput(draft({foods:'milk',symptoms:[],severity:0}),clock),null);
  assert.match(validateDiaryInput(draft({foods:' ',symptoms:[],severity:0}),clock) ?? '', /Enter food/);
  assert.match(validateDiaryInput(draft({foods:'oats',symptoms:[],severity:2}),clock) ?? '', /severity/);
  assert.match(validateDiaryInput(draft({severity:0}),clock) ?? '', /severity/);
  assert.match(validateDiaryInput(draft({severity:6}),clock) ?? '', /severity/);
});

test('future, nonsensical and noninteger input is blocked at save', () => {
  assert.match(validateDiaryInput(draft({datetime:'2026-06-01T14:00'}),clock) ?? '',/future/);
  assert.match(validateDiaryInput(draft({datetime:'2026-02-31T10:00'}),clock) ?? '',/valid local date/);
  assert.match(validateDiaryInput(draft({severity:1.5}),clock) ?? '',/severity/);
  assert.equal(validateDiaryInput(draft({datetime:'2026-06-01T11:00'}),clock),null);
  assert.equal(validateDiaryInput(draft({datetime:'2026-05-01T11:00'}),clock),null);
});

test('text fields reject excess sizes without truncating saved data', () => {
  assert.equal(validateDiaryInput(draft({foods:'o'.repeat(MAX_FOODS_LENGTH),notes:'n'.repeat(MAX_NOTES_LENGTH)}),clock),null);
  assert.match(validateDiaryInput(draft({foods:'o'.repeat(MAX_FOODS_LENGTH+1)}),clock) ?? '',/500/);
  assert.match(validateDiaryInput(draft({notes:'n'.repeat(MAX_NOTES_LENGTH+1)}),clock) ?? '',/2,000/);
});

test('listed symptoms and exact choices only; no duplicate or forged labels', () => {
  assert.ok(SYMPTOMS.includes('Bloating'));
  assert.ok(RED_FLAG_SYMPTOMS.includes('Trouble breathing'));
  for (const list of [['Bloating','Bloating'],['__proto__'],['Bloating; Nausea'],['unknown']]) {
    assert.match(validateDiaryInput(draft({symptoms:list}),clock) ?? '',/listed symptoms/);
  }
  assert.ok(hasRedFlag(['Trouble breathing']));
  assert.ok(hasRedFlag(['Hives (widespread)']));
  assert.equal(hasRedFlag(['Bloating']),false);
});

test('compatible valid legacy entries load without destructive migration', () => {
  const entries=[meal('id1','2026-06-01T10:00','milk'),symptom('id2','2026-06-01T11:00',['Bloating'])];
  assert.deepEqual(parseStoredDiary(JSON.parse(JSON.stringify(entries))),entries);
  assert.deepEqual(parseStoredDiary([]),[]);
  // Old UTC-as-local timestamps may look future-shifted: preserve, do not change.
  assert.deepEqual(parseStoredDiary([meal('id3','2026-11-18T23:59','oats')])?.length,1);
});

test('invalid stored JSON shape never becomes a partial replacement diary', () => {
  const good=meal('id1','2026-06-01T10:00','milk');
  for (const invalid of [null, 'text', {}, [null], [good,{...good,id:'id2',symptoms:null}],
    [good,{...good,id:'id2',datetime:'2026-02-30T10:00'}],
    [good,{...good,id:'id2',severity:4}],
    [good,{...good,id:'id2',foods:'a'.repeat(MAX_FOODS_LENGTH+1)}],
    [good,good], [good,{...good,id:'id2',symptoms:['__proto__'],severity:2}]]) {
    assert.equal(parseStoredDiary(invalid),null,JSON.stringify(invalid)?.slice(0,70));
  }
});

test('same-entry food and symptoms do not establish temporal order or patterns', () => {
  const a=draft({id:'a'}),b=draft({id:'b',datetime:'2026-06-02T10:00'});
  assert.deepEqual(detectDiaryPatterns([a as DiaryEntry,b as DiaryEntry]),[]);
  assert.deepEqual(detectDiaryPatterns([
    meal('a','2026-06-01T10:00','milk'),
    symptom('b','2026-06-01T10:00',['Bloating']),
    symptom('c','2026-06-01T10:00',['Bloating']),
  ]),[]);
});

test('a food logged before two distinct symptom times within six hours yields only a timing observation', () => {
  const r=detectDiaryPatterns([
    meal('a','2026-06-01T10:00','Milk, milk ; Oats'),
    symptom('b','2026-06-01T11:00',['Bloating']),
    symptom('c','2026-06-01T12:00',['Bloating']),
  ]);
  assert.deepEqual(r,[
    {food:'Milk',symptom:'Bloating',count:2},
    {food:'Oats',symptom:'Bloating',count:2},
  ]);
});

test('one symptom after multiple meals cannot be inflated into a repeated pattern', () => {
  assert.deepEqual(detectDiaryPatterns([
    meal('a','2026-06-01T09:00','milk'),
    meal('b','2026-06-01T10:00','MILK'),
    symptom('c','2026-06-01T11:00',['Bloating']),
  ]),[]);
});

test('duplicate symptom entries at identical times count as one occurrence', () => {
  assert.deepEqual(detectDiaryPatterns([
    meal('a','2026-06-01T09:00','milk'),
    symptom('b','2026-06-01T11:00',['Bloating']),
    symptom('c','2026-06-01T11:00',['Bloating']),
  ]),[]);
});

test('out-of-window, future food, and reversed order cannot create inferred pairing', () => {
  assert.deepEqual(detectDiaryPatterns([
    meal('a','2026-06-01T09:00','milk'),
    symptom('b','2026-06-01T15:01',['Bloating']),
    symptom('c','2026-06-01T19:00',['Bloating']),
  ]),[]);
  assert.deepEqual(detectDiaryPatterns([
    symptom('a','2026-06-01T09:00',['Bloating']),
    symptom('b','2026-06-01T10:00',['Bloating']),
    meal('c','2026-06-01T11:00','milk'),
  ]),[]);
  const exact=detectDiaryPatterns([
    meal('a','2026-06-01T09:00','milk'),
    symptom('b','2026-06-01T15:00',['Bloating']),
    symptom('c','2026-06-01T14:00',['Bloating']),
  ]);
  assert.equal(exact[0]?.count,2);
});

test('red-flag symptoms never become food-associated pattern suggestions', () => {
  assert.deepEqual(detectDiaryPatterns([
    meal('a','2026-06-01T09:00','peanut'),
    symptom('b','2026-06-01T10:00',['Trouble breathing']),
    symptom('c','2026-06-01T11:00',['Trouble breathing']),
  ]),[]);
  assert.deepEqual(detectDiaryPatterns([
    {...meal('a','2026-06-01T09:00','peanut'),symptoms:['Hives (widespread)'],severity:4},
    symptom('b','2026-06-01T10:00',['Bloating']),
    symptom('c','2026-06-01T11:00',['Bloating']),
  ]),[]);
});

test('UI shows local timestamp, privacy/storage status, allergy emergency and submit guards', () => {
  const ui=readFileSync(new URL('../../../src/islands/FoodSymptomDiary.tsx',import.meta.url),'utf8');
  assert.match(ui,/validateDiaryInput\(draft\)/);
  assert.match(ui,/parseStoredDiary\(JSON.parse\(raw\)\)/);
  assert.match(ui,/storageState !== 'ready'/);
  assert.match(ui,/setStorageState\('invalid'\)/);
  assert.match(ui,/window.addEventListener\('storage', onStorage\)/);
  assert.match(ui,/localStorage.removeItem\(STORE\)/);
  assert.match(ui,/maxLength=\{MAX_FOODS_LENGTH\}/);
  assert.match(ui,/maxLength=\{MAX_NOTES_LENGTH\}/);
  assert.match(ui,/max=\{now\(\)\}/);
  assert.match(ui,/aria-pressed=\{selectedSymptoms.includes\(sym\)\}/);
  assert.match(ui,/prescribed epinephrine/);
  assert.doesNotMatch(ui,/new Date\(\)\.toISOString\(\)\.slice\(0, 16\)/);
  assert.doesNotMatch(ui,/const PATTERN_WINDOW_HOURS/);
  assert.doesNotMatch(ui,/\bfetch\(|navigator\.sendBeacon|XMLHttpRequest/);
});

test('print view keeps warning banner, preserves separate confidential copy and allows multiple pages', () => {
  const css=readFileSync(new URL('../../../src/styles/diary.css',import.meta.url),'utf8');
  const print=css.slice(css.indexOf('@media print'),css.indexOf('/* ── Dark mode'));
  assert.match(print,/\.diary__emergency \{[\s\S]*?display: block !important/);
  assert.match(print,/\.diary__print-confidential \{[\s\S]*?display: block/);
  assert.match(print,/\.diary__timeline \{[\s\S]*?break-inside: auto/);
  assert.doesNotMatch(print,/\.diary__emergency \{\s*display: none/);
  const ui=readFileSync(new URL('../../../src/islands/FoodSymptomDiary.tsx',import.meta.url),'utf8');
  assert.match(ui,/onClick=\{\(\) => window\.print\(\)\}/);
  assert.match(ui,/Sensitive personal health diary/);
});

test('standalone Astro tool, authoritative content and related catalogue remain connected', () => {
  const route=readFileSync(new URL('../../../src/pages/tools/food-symptom-diary.astro',import.meta.url),'utf8');
  const layout=readFileSync(new URL('../../../src/components/ToolPageLayout.astro',import.meta.url),'utf8');
  const engine=readFileSync(new URL('../../../src/lib/toolEngine.ts',import.meta.url),'utf8');
  const catalog=readFileSync(new URL('../../../src/data/tools.ts',import.meta.url),'utf8');
  assert.match(route,/getTool\('food-symptom-diary'\)/);
  assert.match(layout,/engine === 'diary' && <FoodSymptomDiary client:load/);
  assert.match(engine,/'food-symptom-diary': 'diary'/);
  assert.match(catalog,/browser-local meal and symptom timeline/);
  const page=readFileSync(new URL('../../../src/data/nutrition-content.ts',import.meta.url),'utf8');
  const a=page.indexOf("'food-symptom-diary': {");
  assert.ok(a>0);
  const sub=page.slice(a,a+12000);
  assert.match(sub,/six-hour lookback/);
  assert.match(sub,/localStorage/);
  assert.match(sub,/Older timestamps remain as originally entered/);
  assert.match(sub,/https:\/\/www.fda.gov\/food\/nutrition-food-labeling-and-critical-foods\/food-allergies/);
  assert.match(sub,/https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC4241964\//);
  assert.match(sub,/https:\/\/developer.mozilla.org\/en-US\/docs\/Web\/API\/Web_Storage_API/);
  assert.doesNotMatch(sub,/one-page summary|Nothing is sent to a server/);
});
