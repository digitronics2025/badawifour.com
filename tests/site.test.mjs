import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import worker, { extractProduct, validateEmail, validatePhone, validateProductModel } from '../src/worker.mjs';
import { GUIDES } from '../src/content.mjs';
import { PRODUCTS, RETAILER } from '../src/catalog.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const languages = ['fr','ar','en'];
const routes = [
  '',
  'products/',
  ...PRODUCTS.map((product)=>`products/${product.slug}/`),
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

test('BF65CINOX source is approved and builds deterministic responsive assets', async () => {
  const source = await readFile(projectRoot + 'src/products/v1/bf65cinox/bf65cinox-master.png');
  assert.equal(createHash('sha256').update(source).digest('hex').toUpperCase(),'8F6E7419DBFB0DBC89DDB7441CCD43B43423C5320FC7EBCD7DC5F7601C4ED92A');
  const expected = new Map([[320,400],[640,800],[960,1200],[1122,1402]]);
  for (const [width,height] of expected) {
    const path = root + `products/v1/bf65cinox/bf65cinox-${width}.webp`;
    await access(path);
    const metadata = await sharp(path).metadata();
    assert.equal(metadata.format,'webp');
    assert.equal(metadata.width,width);
    assert.equal(metadata.height,height);
  }
});

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

test('BF65CINOX is published in every locale with verified-only product data', async () => {
  const expected={
    fr:['Cuisinière à gaz','4 feux','60 × 60 × 90 cm'],
    ar:['طباخة غاز','4 شعلات','60 × 60 × 90 سم'],
    en:['Gas cooker','4 burners','60 × 60 × 90 cm']
  };
  for(const language of languages){
    const html=await readFile(root+`${language}/products/bf65cinox/index.html`,'utf8');
    assert.match(html,new RegExp(`rel="canonical" href="https://badawifour\\.com/${language}/products/bf65cinox/"`));
    assert.match(html,/\/products\/v1\/bf65cinox\/bf65cinox-1122\.webp/);
    assert.match(html,/imagesrcset="[^\"]*bf65cinox-320\.webp 320w[^\"]*bf65cinox-1122\.webp 1122w"/);
    for(const value of expected[language]) assert.ok(html.includes(value),`${language} should contain ${value}`);
    const json=html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    const data=JSON.parse(json[1]);
    assert.equal(data[0].model,'BF65CINOX');
    assert.equal(data[0].brand.name,'BADAWI');
    assert.equal(data[0].image[0],'https://badawifour.com/products/v1/bf65cinox/bf65cinox-1122.webp');
    assert.equal('offers' in data[0],false);
    assert.equal(data[1]['@type'],'BreadcrumbList');
  }
});

test('home, catalog, footer, sitemap and discovery expose both products', async () => {
  for(const language of languages){
    for(const route of ['','products/']){
      const html=await readFile(root+`${language}/${route}index.html`,'utf8');
      for(const product of PRODUCTS){
        assert.match(html,new RegExp(`href="/${language}/products/${product.slug}/"`));
        assert.ok(html.includes(product.model));
      }
    }
  }
  const sitemap=await readFile(root+'sitemap.xml','utf8');
  const discovery=await readFile(root+'llms.txt','utf8');
  assert.match(sitemap,/badawifour\.com\/fr\/products\/bf65cinox\//);
  assert.match(discovery,/BF65CINOX: four-burner gas cooker/);
});

test('every WhatsApp button targets the verified Digitronics number', async () => {
  assert.equal(RETAILER.whatsapp.url,`https://wa.me/${RETAILER.whatsapp.number}`);
  for (const language of languages) {
    for (const route of routes) {
      const path = root + language + '/' + route + 'index.html';
      const html = await readFile(path,'utf8');
      const links = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"?]+)[^"]*"/g)].map((match)=>match[1]);
      assert.ok(links.length > 0,`${path} should include a WhatsApp link`);
      for (const link of links) assert.equal(link,RETAILER.whatsapp.url,path);
      assert.doesNotMatch(html,/data-track="whatsapp_click" data-destination="whatsapp"/);
      assert.match(html,/<svg class="whatsapp-icon"[^>]+aria-hidden="true"/);
      assert.doesNotMatch(html,/>WA<\/a>/);
    }
  }
});

test('product WhatsApp links carry the correct localized model and page', async () => {
  for(const language of languages){
    const html=await readFile(root+`${language}/products/bf65cinox/index.html`,'utf8');
    const href=html.match(/class="btn dark whatsapp-btn" href="([^"]+)"/)?.[1];
    assert.ok(href,`${language} product WhatsApp link should exist`);
    const decoded=decodeURIComponent(href);
    assert.match(decoded,/BADAWI BF65CINOX/);
    assert.match(decoded,new RegExp(`https://badawifour\\.com/${language}/products/bf65cinox/`));
  }
});

test('homepages include a localized WhatsApp call to action', async () => {
  for (const language of languages) {
    const html = await readFile(root + language + '/index.html','utf8');
    assert.match(html,/class="btn whatsapp home-hero-whatsapp whatsapp-btn" href="https:\/\/wa\.me\/212664999733\?text=/);
    assert.match(html,/data-track="whatsapp_click" data-destination="Digitronics WhatsApp"/);
    const hero=html.match(/<section class="home-hero">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.doesNotMatch(hero,/data-product="BF65INOXP"[^>]*href="https:\/\/wa\.me/);
    assert.doesNotMatch(html,/class="float"/,'homepage should not duplicate the hero WhatsApp action');
  }
});

test('mobile navigation becomes visible when the menu is expanded', async () => {
  const css = await readFile(projectRoot + 'src/site.css','utf8');
  assert.match(css,/@media\(max-width:900px\)\{[\s\S]*?#mobile:not\(\[hidden\]\)\{display:block\}/);
});

test('mobile navigation starts with a localized homepage link', async () => {
  const labels = {fr:'Accueil',ar:'الرئيسية',en:'Home'};
  for (const language of languages) {
    const html = await readFile(root + language + '/index.html','utf8');
    assert.match(html,new RegExp(`<div id="mobile" hidden><a aria-current="page" href="/${language}/">${labels[language]}</a>`));
  }
});

test('product cards keep media and calls to action aligned across image shapes', async () => {
  const css = await readFile(projectRoot + 'src/site.css','utf8');
  assert.match(css,/\.catalog-card\{display:grid;grid-template-rows:auto 1fr;/);
  assert.match(css,/\.catalog-card>a:first-child\{[^}]*aspect-ratio:4\/3;[^}]*min-height:0;[^}]*overflow:hidden/);
  assert.match(css,/\.catalog-card>a:first-child img\{[^}]*min-height:0;[^}]*object-fit:contain/);
  assert.match(css,/\.catalog-card>div\{display:flex;flex-direction:column;align-items:flex-start;/);
  assert.match(css,/\.catalog-card \.btn\{margin-top:auto\}/);
});

test('removed service-coverage claims stay absent from source and generated pages', async () => {
  const removedTerms = [
    new RegExp(['warr','ant(?:y|ies)'].join(''),'iu'),
    new RegExp(['gar','antie(?:s)?'].join(''),'iu'),
    new RegExp(['ض','مان'].join(''),'u')
  ];
  const files = ['src/catalog.mjs','src/i18n.mjs','scripts/build.mjs'];
  for (const file of files) {
    const content = await readFile(projectRoot + file,'utf8');
    for (const term of removedTerms) assert.doesNotMatch(content,term,file);
  }
  for (const language of languages) {
    for (const route of routes) {
      const path = root + language + '/' + route + 'index.html';
      const content = await readFile(path,'utf8');
      for (const term of removedTerms) assert.doesNotMatch(content,term,path);
    }
  }
  const discovery = await readFile(root + 'llms.txt','utf8');
  for (const term of removedTerms) assert.doesNotMatch(discovery,term,'llms.txt');
});

test('above-the-fold hero images are preloaded responsively', async () => {
  const home = await readFile(root + 'fr/index.html','utf8');
  const product = await readFile(root + 'fr/products/bf65inoxp/index.html','utf8');
  const about = await readFile(root + 'fr/about/index.html','utf8');
  assert.match(home,/<link rel="preload" as="image" href="\/home\/v1\/hero-kitchen-1536\.webp"[^>]*imagesrcset="[^"]+ 640w[^\"]*1536\.webp 1536w"[^>]*fetchpriority="high"/);
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
  assert.equal(parsed.availability,'in_stock');
  const order=extractProduct('<script>{"price":"1999","availability":"OutOfStock"}</script><span>Disponible sur commande</span>');
  assert.equal(order.availability,'on_order');
  assert.equal(order.in_stock,null);
});

test('product forms expose only the catalog model allowlist', async () => {
  assert.equal(validateProductModel('bf65inoxp'),'BF65INOXP');
  assert.equal(validateProductModel('BF65CINOX'),'BF65CINOX');
  assert.throws(()=>validateProductModel('BF65UNKNOWN'),/invalid_model/);
  for(const route of ['support/register/','support/request/']){
    const html=await readFile(root+`en/${route}index.html`,'utf8');
    assert.match(html,/<select name="model"[^>]*required/);
    for(const product of PRODUCTS) assert.match(html,new RegExp(`<option value="${product.model}">${product.model}</option>`));
  }
});

test('retailer API allowlists products, separates slugs and reports on-order', async () => {
  const unknown=await worker.fetch(new Request('https://badawifour.com/api/retailer/unknown'),{});
  assert.equal(unknown.status,404);
  const previousCaches=globalThis.caches;
  const previousFetch=globalThis.fetch;
  const keys=[];
  globalThis.caches={default:{match:async()=>null,put:async(key)=>keys.push(key.url)}};
  globalThis.fetch=async()=>new Response('<script>{"price":"1999","availability":"OutOfStock"}</script><div>Sur commande</div>');
  try{
    const response=await worker.fetch(new Request('https://badawifour.com/api/retailer/bf65cinox'),{});
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.model,'BF65CINOX');
    assert.equal(data.slug,'bf65cinox');
    assert.equal(data.price,1999);
    assert.equal(data.availability,'on_order');
    assert.equal(data.in_stock,null);
    assert.deepEqual(keys,['https://badawifour.com/__cache/retailer/bf65cinox']);
  }finally{
    globalThis.fetch=previousFetch;
    if(previousCaches===undefined) delete globalThis.caches;
    else globalThis.caches=previousCaches;
  }
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
  assert.doesNotMatch(html, /\/brand\/v1\/badawi-four-flame\.svg/);
  assert.match(html, /\/brand\/v1\/badawi-four-logo-reversed\.svg/);
  assert.doesNotMatch(html, /viewBox="0 0 32 40"/);
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  const graph = JSON.parse(match[1]);
  const organization = graph['@graph'].find((item)=>item['@type']==='Organization');
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
    assert.doesNotMatch(html, /<source media=/);
    assert.match(html, /class="brand-lockup"[^>]+width="1030" height="220" alt=""/);
    assert.match(html, new RegExp(`<a class="brand brand-footer" href="/${language}/" aria-label="BADAWI FOUR">`));
    assert.match(html, /badawi-four-logo-reversed\.svg" width="1000" height="1000" alt=""/);
  }
  const css = await readFile(root + 'assets/site.css','utf8');
  assert.match(css, /\.brand-header\{width:164px;height:36px\}/);
  assert.match(css, /\.brand-header\{width:clamp\(120px,28vw,150px\);height:clamp\(26px,6vw,32px\)\}/);
  assert.match(css, /\.brand-header \.brand-lockup\{width:100%;height:100%\}/);
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
