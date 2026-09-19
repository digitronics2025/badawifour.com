import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { extractProduct, validateEmail, validatePhone } from '../src/worker.mjs';
import { GUIDES } from '../src/content.mjs';

const root = new URL('../dist/', import.meta.url).pathname;
const languages = ['fr','ar','en'];
const routes = [
  '',
  'products/',
  'products/bf65inoxp/',
  'inspiration/',
  'support/',
  'support/register/',
  'support/request/',
  ...GUIDES.map((guide)=>`support/guides/${guide.slug}/`),
  'about/',
  'where-to-buy/',
  'professionals/',
  'contact/',
  'privacy/',
  'legal/'
];

test('all localized pages are generated', async () => {
  for (const language of languages) {
    for (const route of routes) {
      const path = root + language + '/' + route + 'index.html';
      await access(path);
    }
  }
});

test('product page has canonical, same-path hreflang and parseable JSON-LD', async () => {
  const html = await readFile(root + 'fr/products/bf65inoxp/index.html','utf8');
  assert.match(html, /rel="canonical" href="https:\/\/badawifour\.com\/fr\/products\/bf65inoxp\/"/);
  assert.match(html, /hreflang="ar" href="https:\/\/badawifour\.com\/ar\/products\/bf65inoxp\/"/);
  assert.match(html, /hreflang="en" href="https:\/\/badawifour\.com\/en\/products\/bf65inoxp\/"/);
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  assert.ok(match, 'JSON-LD should exist');
  const data = JSON.parse(match[1]);
  assert.ok(Array.isArray(data));
  assert.equal(data[0]['@type'],'Product');
  assert.equal(data[0].model,'BF65INOXP');
});

test('Arabic pages are RTL and Arabic forms are localized', async () => {
  const home = await readFile(root + 'ar/index.html','utf8');
  const form = await readFile(root + 'ar/support/register/index.html','utf8');
  assert.match(home, /<html lang="ar" dir="rtl">/);
  assert.match(form, /الرقم التسلسلي/);
  assert.doesNotMatch(form, />First name</);
  assert.doesNotMatch(form, />Last name</);
});

test('form timing is initialized by the browser, not frozen at build time', async () => {
  const html = await readFile(root + 'fr/support/register/index.html','utf8');
  assert.match(html, /name="started_at" value=""/);
  assert.match(html, /data-api-form="registration"/);
});

test('product parser handles structured price and availability', () => {
  const parsed = extractProduct('<script>{"price":"999","availability":"InStock"}</script>');
  assert.equal(parsed.price, 999);
  assert.equal(parsed.in_stock, true);
});

test('server validators reject malformed contact data', () => {
  assert.equal(validateEmail('name@example.com'),'name@example.com');
  assert.throws(()=>validateEmail('not-an-email'),/invalid_email/);
  assert.equal(validatePhone('+212 664 999 733'),'+212 664 999 733');
  assert.throws(()=>validatePhone('123'),/invalid_phone/);
});

test('sitemap includes catalog and guides in every language', async () => {
  const sitemap = await readFile(root + 'sitemap.xml','utf8');
  const count = (sitemap.match(/<url>/g)||[]).length;
  assert.equal(count,languages.length * routes.length);
  assert.match(sitemap, /badawifour\.com\/fr\/products\//);
  assert.match(sitemap, /badawifour\.com\/ar\/support\/guides\/before-installation\//);
  assert.match(sitemap, /badawifour\.com\/en\/support\/guides\/clean-inox-glass\//);
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});

test('discovery, manifest and security artifacts exist', async () => {
  for (const file of ['favicon.svg','manifest.webmanifest','llms.txt','.well-known/security.txt','robots.txt']) {
    await access(root + file);
  }
  const manifest = JSON.parse(await readFile(root + 'manifest.webmanifest','utf8'));
  assert.equal(manifest.name,'BADAWI');
  const robots = await readFile(root + 'robots.txt','utf8');
  assert.match(robots,/Disallow: \/api\//);
});

test('privacy page discloses first-party measurement', async () => {
  const html = await readFile(root + 'en/privacy/index.html','utf8');
  assert.match(html,/Raw IP addresses are not stored/);
  assert.match(html,/approximately 13 months/);
});

test('generated pages do not expose Cloudflare deployment credentials', async () => {
  const html = await readFile(root + 'fr/index.html','utf8');
  const js = await readFile(root + 'assets/site.js','utf8');
  assert.doesNotMatch(html,/CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(js,/CLOUDFLARE_API_TOKEN/);
});
