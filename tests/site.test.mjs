import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import worker, { extractProduct, validateEmail, validatePhone } from '../src/worker.mjs';
import { GUIDES } from '../src/content.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
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

test('above-the-fold hero images are preloaded responsively', async () => {
  const home = await readFile(root + 'fr/index.html','utf8');
  const product = await readFile(root + 'fr/products/bf65inoxp/index.html','utf8');
  const about = await readFile(root + 'fr/about/index.html','utf8');
  assert.match(home,/<link rel="preload" as="image" href="https:\/\/digitronics\.ma\/landing\/badawi\/badawi-food-shared-table\.webp"[^>]*fetchpriority="high"/);
  assert.match(product,/<link rel="preload" as="image" href="https:\/\/digitronics\.ma\/r2\/products\/BF65INOXP\/[^\"]+\.w1080\.webp"[^>]*imagesrcset="[^"]+ 640w[^\"]*"[^>]*imagesizes="\(max-width:900px\) 100vw, 58vw"/);
  assert.match(about,/<link rel="preload" as="image" href="https:\/\/digitronics\.ma\/landing\/badawi\/badawi-food-roast-chicken\.webp"/);
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
  for (const file of ['favicon.svg','favicon.ico','apple-touch-icon.png','manifest.webmanifest','llms.txt','.well-known/security.txt','robots.txt']) {
    await access(root + file);
  }
  const manifest = JSON.parse(await readFile(root + 'manifest.webmanifest','utf8'));
  assert.equal(manifest.name,'BADAWI FOUR');
  assert.deepEqual(manifest.icons.map(({sizes,purpose})=>[sizes,purpose]),[
    ['192x192','any'],
    ['512x512','any'],
    ['512x512','maskable']
  ]);
  for (const icon of manifest.icons) await access(root + icon.src.slice(1));
  const robots = await readFile(root + 'robots.txt','utf8');
  assert.match(robots,/Disallow: \/api\//);
});

test('pages use the official BADAWI FOUR identity assets and metadata', async () => {
  const html = await readFile(root + 'fr/index.html','utf8');
  assert.match(html, /href="\/favicon\.ico" sizes="any"/);
  assert.match(html, /href="\/favicon\.svg" type="image\/svg\+xml"/);
  assert.match(html, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
  assert.match(html, /property="og:site_name" content="BADAWI FOUR"/);
  assert.match(html, /\/brand\/v1\/badawi-four-lockup\.svg/);
  assert.match(html, /\/brand\/v1\/badawi-four-flame\.svg/);
  assert.match(html, /\/brand\/v1\/badawi-four-logo-reversed\.svg/);
  assert.doesNotMatch(html, /viewBox="0 0 32 40"/);
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  const organization = JSON.parse(match[1]);
  assert.equal(organization.name,'BADAWI FOUR');
  assert.equal(organization.logo,'https://badawifour.com/brand/v1/badawi-four-logo.svg');
  assert.match(await readFile(root + 'index.html','utf8'), /<title>BADAWI FOUR<\/title>/);
  assert.match(await readFile(root + '404.html','utf8'), /<title>404 — BADAWI FOUR<\/title>/);
  assert.match(await readFile(root + 'llms.txt','utf8'), /^# BADAWI FOUR$/m);
});

test('localized brand links have stable dimensions and accessible names', async () => {
  for (const language of languages) {
    const html = await readFile(root + language + '/index.html','utf8');
    assert.match(html, new RegExp(`<a class="brand brand-header" href="/${language}/" aria-label="BADAWI FOUR">`));
    assert.match(html, /<source media="\(max-width:620px\)" srcset="\/brand\/v1\/badawi-four-flame\.svg">/);
    assert.match(html, /class="brand-lockup"[^>]+width="1030" height="220" alt=""/);
    assert.match(html, new RegExp(`<a class="brand brand-footer" href="/${language}/" aria-label="BADAWI FOUR">`));
    assert.match(html, /badawi-four-logo-reversed\.svg" width="1000" height="1000" alt=""/);
  }
  const css = await readFile(root + 'assets/site.css','utf8');
  assert.match(css, /\.brand-header\{width:164px;height:36px\}/);
  assert.match(css, /\.brand-header picture\{display:block;width:164px;height:35px\}/);
  assert.match(css, /\.brand-header picture,\.brand-header \.brand-lockup\{width:34px;height:34px\}/);
});

test('BF65INOXP structured data retains BADAWI as the product brand', async () => {
  const html = await readFile(root + 'en/products/bf65inoxp/index.html','utf8');
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  const data = JSON.parse(match[1]);
  assert.equal(data[0].brand.name,'BADAWI');
});

test('worker canonicalizes HTTP and www in one redirect', async () => {
  for (const input of [
    'http://badawifour.com/ar/products/bf65inoxp/?source=test',
    'http://www.badawifour.com/ar/products/bf65inoxp/?source=test',
    'https://www.badawifour.com/ar/products/bf65inoxp/?source=test'
  ]) {
    const response = await worker.fetch(new Request(input),{});
    assert.equal(response.status,301);
    assert.equal(response.headers.get('location'),'https://badawifour.com/ar/products/bf65inoxp/?source=test');
  }
});

test('generated pages reference fingerprinted assets', async () => {
  const html = await readFile(root + 'fr/index.html','utf8');
  const css = html.match(/href="\/assets\/(site\.[a-f0-9]{12}\.css)"/);
  const js = html.match(/src="\/assets\/(site\.[a-f0-9]{12}\.js)"/);
  assert.ok(css, 'fingerprinted CSS should be referenced');
  assert.ok(js, 'fingerprinted JavaScript should be referenced');
  await access(root + 'assets/' + css[1]);
  await access(root + 'assets/' + js[1]);
});

test('privacy page discloses first-party measurement', async () => {
  const html = await readFile(root + 'en/privacy/index.html','utf8');
  assert.match(html,/Raw IP addresses are not stored/);
  assert.match(html,/approximately 13 months/);
});

test('generated pages do not expose Cloudflare deployment credentials', async () => {
  const html = await readFile(root + 'fr/index.html','utf8');
  const script = html.match(/src="\/assets\/(site\.[a-f0-9]{12}\.js)"/);
  assert.ok(script, 'fingerprinted JavaScript should be referenced');
  const js = await readFile(root + 'assets/' + script[1],'utf8');
  assert.doesNotMatch(html,/CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(js,/CLOUDFLARE_API_TOKEN/);
});
