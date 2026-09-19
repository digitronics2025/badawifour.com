import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { extractProduct } from '../src/worker.mjs';

const root = new URL('../dist/', import.meta.url).pathname;
const pages = [
  'fr/index.html','ar/index.html','en/index.html',
  'fr/products/bf65inoxp/index.html','ar/products/bf65inoxp/index.html','en/products/bf65inoxp/index.html',
  'fr/support/register/index.html','fr/support/request/index.html','fr/professionals/index.html'
];

test('core pages are generated', async () => {
  for (const page of pages) await access(root + page);
});

test('localized pages contain canonical and hreflang', async () => {
  const html = await readFile(root + 'fr/products/bf65inoxp/index.html','utf8');
  assert.match(html, /rel="canonical"/);
  assert.match(html, /hreflang="ar"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /BF65INOXP/);
});

test('Arabic is RTL', async () => {
  const html = await readFile(root + 'ar/index.html','utf8');
  assert.match(html, /<html lang="ar" dir="rtl">/);
});

test('product parser handles structured price and availability', () => {
  const parsed = extractProduct('<script>{"price":"999","availability":"InStock"}</script>');
  assert.equal(parsed.price, 999);
  assert.equal(parsed.in_stock, true);
});

test('robots and sitemap are generated', async () => {
  const sitemap = await readFile(root + 'sitemap.xml','utf8');
  assert.match(sitemap, /badawifour\.com\/fr\/products\/bf65inoxp\//);
  assert.match(sitemap, /badawifour\.com\/ar\//);
  assert.match(sitemap, /badawifour\.com\/en\//);
});
