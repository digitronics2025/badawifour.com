import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { HOME } from '../src/i18n.mjs';
import { PRODUCTS } from '../src/catalog.mjs';

const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const distRoot=fileURLToPath(new URL('../dist/',import.meta.url));

const assets=[
  {name:'hero-kitchen',source:'hero-kitchen-master.png',width:1536,height:1024,sha256:'0786429FCACF033D184F39D187CFB879ACB168DBD6376655C995D017581B321E',widths:[640,960,1440,1536]},
  {name:'shared-table',source:'shared-table-master.png',width:1536,height:1024,sha256:'214FB28E4E4EE69552E0B1D8138E3B603ED4B64453A658636F2AA9799BE7FC2A',widths:[640,960,1440,1536]},
  {name:'prep-detail',source:'prep-detail-master.png',width:1122,height:1402,sha256:'A008D10FC300AAE175D2567A51E17C1DC9CE2D1B05A5A33BE033E16F34E10C21',widths:[640,960,1122]}
];

test('generated homepage artwork is versioned and builds deterministic responsive media', async () => {
  for(const asset of assets){
    const source=await readFile(projectRoot+`src/home/v1/${asset.source}`);
    assert.equal(createHash('sha256').update(source).digest('hex').toUpperCase(),asset.sha256);
    const sourceMetadata=await sharp(source).metadata();
    assert.equal(sourceMetadata.width,asset.width);
    assert.equal(sourceMetadata.height,asset.height);
    for(const width of asset.widths){
      const output=distRoot+`home/v1/${asset.name}-${width}.webp`;
      await access(output);
      const metadata=await sharp(output).metadata();
      assert.equal(metadata.format,'webp');
      assert.equal(metadata.width,width);
    }
  }
});

test('homepage presentation content is complete in French, English and Arabic', () => {
  const shape=(value)=>Array.isArray(value)
    ? value.map((item)=>typeof item==='object'&&item!==null?shape(item):typeof item)
    : typeof value==='object'&&value!==null
      ? Object.fromEntries(Object.entries(value).map(([key,item])=>[key,shape(item)]))
      : typeof value;
  assert.deepEqual(shape(HOME.en),shape(HOME.fr));
  assert.deepEqual(shape(HOME.ar),shape(HOME.fr));
  for(const locale of ['fr','en','ar']){
    const content=HOME[locale];
    assert.equal(content.heroSignals.length,3);
    assert.equal(content.trust.length,3);
    assert.equal(content.journeySteps.length,3);
    assert.equal(content.supportCards.length,4);
    assert.equal(content.faq.length,6);
    assert.ok(content.metaDescription.length<=160,`${locale} meta description should be concise`);
  }
});

test('homepages have a two-product hero, one catalog action and general Digitronics WhatsApp', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    assert.match(html,/class="home-hero"/);
    assert.match(html,/src="\/home\/v1\/hero-kitchen-1536\.webp"/);
    assert.match(html,new RegExp(`href="/${locale}/products/"[^>]*data-track="product_discovery"`));
    assert.equal((html.match(/class="home-hero-product /g)||[]).length,2);
    assert.match(html,/data-product="BF65INOXP"/);
    assert.match(html,/data-product="BF65CINOX"/);
    const hero=html.match(/<section class="home-hero">([\s\S]*?)<\/section>/)?.[1]||'';
    const whatsapp=hero.match(/href="(https:\/\/wa\.me\/[^\"]+)"/)?.[1];
    assert.ok(whatsapp,`${locale} hero WhatsApp should exist`);
    assert.doesNotMatch(decodeURIComponent(whatsapp),/BF65INOXP|BF65CINOX/);
    for(const signal of HOME[locale].heroSignals) assert.ok(hero.includes(signal));
    for(const item of HOME[locale].trust) assert.ok(html.includes(item));
  }
});

test('guided product cards use verified facts, live retailer fallbacks and model-specific WhatsApp', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const cards=[...html.matchAll(/<article class="catalog-card home-product-card"([\s\S]*?)<\/article>/g)].map(match=>match[0]);
    assert.equal(cards.length,2);
    for(const [index,product] of ['BF65INOXP','BF65CINOX'].entries()){
      const card=cards[index];
      const slug=product.toLowerCase();
      assert.ok(card.includes(product));
      assert.match(card,new RegExp(`data-retailer-live data-product-slug="${slug}"`));
      assert.ok(card.includes(HOME[locale].retailerFallback));
      assert.match(card,new RegExp(`href="https://wa\\.me/212664999733\\?text=[^"]+"[^>]*data-product="${product}"`));
      assert.ok(decodeURIComponent(card).includes(`BADAWI ${product}`));
    }
  }
});

test('localized comparison exposes verified values and explicit unknowns', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const comparison=html.match(/<section class="section home-comparison">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.ok(comparison.includes('BF65INOXP'));
    assert.ok(comparison.includes('BF65CINOX'));
    assert.ok(comparison.includes('65 × 55 × 55'));
    assert.ok(comparison.includes('60 × 60 × 90'));
    assert.ok(comparison.includes('12'));
    assert.ok(comparison.includes(HOME[locale].notPublished));
    assert.equal((comparison.match(/<dl>/g)||[]).length,2);
  }
});

test('editorial brand story uses localized safe copy and local shared-table media', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const story=html.match(/<section class="section home-story">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.ok(story.includes(HOME[locale].storyTitle));
    assert.ok(story.includes(HOME[locale].storyText));
    assert.ok(story.includes(HOME[locale].storyNote));
    assert.match(story,/src="\/home\/v1\/shared-table-1536\.webp"/);
    assert.match(story,/loading="lazy"/);
  }
});

test('verified detail panels label the applicable model', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const section=html.match(/<section class="section home-details">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.equal((section.match(/class="verified-detail"/g)||[]).length,4);
    assert.match(section,/BF65INOXP · BF65CINOX/);
    assert.equal((section.match(/<p>BF65INOXP<\/p>/g)||[]).length,2);
    assert.equal((section.match(/<p>BF65CINOX<\/p>/g)||[]).length,1);
    assert.ok(section.includes(PRODUCTS[0].verifiedFacts.doors[locale]));
    assert.ok(section.includes(PRODUCTS[0].verifiedFacts.controls[locale]));
    assert.ok(section.includes(PRODUCTS[1].verifiedFacts.burners[locale]));
  }
});

test('homepage video is controlled, non-autoplay and progressively deferred', async () => {
  const script=await readFile(projectRoot+'src/site.js','utf8');
  assert.match(script,/const homeVideo=\$\('\[data-home-video\]'\)/);
  assert.match(script,/IntersectionObserver/);
  assert.match(script,/source\.src=source\.dataset\.src/);
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const section=html.match(/<section class="section home-video">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.match(section,/<video data-home-video data-track-video controls playsinline preload="none"/);
    assert.doesNotMatch(section,/<video[^>]*autoplay/);
    assert.match(section,/<source data-src="https:\/\/digitronics\.ma\/landing\/badawi\/badawi-four-showcase\.mp4"/);
    assert.ok(section.includes(HOME[locale].videoFallback));
  }
});

test('cooking inspiration mosaic combines approved and generated media', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const section=html.match(/<section class="section home-inspiration">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.equal((section.match(/<figure>/g)||[]).length,4);
    assert.match(section,/src="\/home\/v1\/prep-detail-1122\.webp"/);
    assert.match(section,new RegExp(`href="/${locale}/inspiration/"`));
    for(const caption of HOME[locale].inspirationCaptions) assert.ok(section.includes(caption));
  }
});

test('buying journey explains selection, retailer confirmation and support', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const section=html.match(/<section class="section home-journey">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.equal((section.match(/<li>/g)||[]).length,3);
    for(const [,title,text] of HOME[locale].journeySteps){
      assert.ok(section.includes(title));
      assert.ok(section.includes(text));
    }
  }
});

test('final offer and mobile sticky action use general Digitronics conversion paths', async () => {
  const script=await readFile(projectRoot+'src/site.js','utf8');
  assert.match(script,/const homeSticky=\$\('\[data-home-sticky\]'\)/);
  assert.match(script,/homeSticky\.hidden=heroVisible\|\|finalOfferVisible/);
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const offer=html.match(/<section class="section home-conversion"([\s\S]*?)<\/section>/)?.[0]||'';
    assert.ok(offer.includes(HOME[locale].ctaTitle));
    assert.match(offer,new RegExp(`href="/${locale}/products/"`));
    assert.match(offer,new RegExp(`href="/${locale}/where-to-buy/"`));
    const offerWhatsapp=offer.match(/href="(https:\/\/wa\.me\/[^\"]+)"/)?.[1]||'';
    assert.ok(offerWhatsapp);
    assert.doesNotMatch(decodeURIComponent(offerWhatsapp),/BF65INOXP|BF65CINOX/);
    assert.match(html,/class="home-sticky-cta" data-home-sticky hidden/);
    assert.ok(html.includes(HOME[locale].stickyLabel));
  }
});

test('support area links registration, requests, care and installation guidance', async () => {
  const routes=['support/register/','support/request/','support/guides/clean-inox-glass/','support/guides/before-installation/'];
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const section=html.match(/<section class="section home-support">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.equal((section.match(/class="home-support-grid"/g)||[]).length,1);
    for(const route of routes) assert.match(section,new RegExp(`href="/${locale}/${route}"`));
    for(const [title,text] of HOME[locale].supportCards){
      assert.ok(section.includes(title));
      assert.ok(section.includes(text));
    }
  }
});

test('visible buying FAQ matches localized FAQPage structured data', async () => {
  for(const locale of ['fr','en','ar']){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const section=html.match(/<section class="section home-faq">([\s\S]*?)<\/section>/)?.[1]||'';
    assert.equal((section.match(/<details>/g)||[]).length,HOME[locale].faq.length);
    const json=html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    assert.ok(json);
    const data=JSON.parse(json);
    const faq=data['@graph'].find(item=>item['@type']==='FAQPage');
    assert.equal(faq.mainEntity.length,HOME[locale].faq.length);
    for(const [index,[question,answer]] of HOME[locale].faq.entries()){
      assert.ok(section.includes(question));
      assert.ok(section.includes(answer));
      assert.equal(faq.mainEntity[index].name,question);
      assert.equal(faq.mainEntity[index].acceptedAnswer.text,answer);
    }
  }
});

test('footer provides localized product, buying, support, language and legal navigation', async () => {
  for(const locale of Object.keys(HOME)){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    const footer=html.match(/<footer>([\s\S]*?)<\/footer>/)?.[1]||'';
    assert.ok(footer.includes(HOME[locale].footerExplore));
    assert.ok(footer.includes(HOME[locale].footerHelp));
    assert.match(footer,/BF65INOXP/);
    assert.match(footer,/BF65CINOX/);
    assert.match(footer,/Digitronics/);
    assert.match(footer,new RegExp(`href="/${locale}/support/register/"`));
    assert.match(footer,/href="\/(fr|ar|en)\/privacy\/"/);
    assert.match(footer,/href="\/(fr|ar|en)\/legal\/"/);
    for(const language of Object.keys(HOME))assert.match(footer,new RegExp(`href="/${language}/"`));
  }
});

test('homepage motion is progressive and respects reduced-motion preferences', async () => {
  const script=await readFile(projectRoot+'src/site.js','utf8');
  const css=await readFile(projectRoot+'src/site.css','utf8');
  assert.match(script,/:scope > section\.section/);
  assert.match(script,/prefers-reduced-motion: reduce/);
  assert.match(script,/dataset\.motionReady='true'/);
  assert.match(css,/data-motion-ready=true/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(script,/document\.documentElement\.classList\.add\('js'\)/);
  assert.match(css,/#mobile\[hidden\]\{display:block!important;position:absolute/);
  assert.match(css,/\.js #mobile\[hidden\]\{display:none!important\}/);
});

test('homepage SEO, social image, preload, schema, tracking and cache interfaces are consistent', async () => {
  const headers=await readFile(distRoot+'_headers','utf8');
  assert.match(headers,/\/home\/v1\/\*[\s\S]*max-age=31536000, immutable/);
  for(const locale of Object.keys(HOME)){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    assert.ok(html.includes(`<title>${HOME[locale].metaTitle}</title>`));
    assert.ok(html.includes(`content="${HOME[locale].metaDescription}"`));
    assert.match(html,/property="og:image" content="https:\/\/badawifour\.com\/home\/v1\/hero-kitchen-1536\.webp"/);
    assert.match(html,/name="twitter:image" content="https:\/\/badawifour\.com\/home\/v1\/hero-kitchen-1536\.webp"/);
    assert.match(html,/rel="preload" as="image" href="\/home\/v1\/hero-kitchen-1536\.webp"/);
    assert.match(html,/imagesrcset="\/home\/v1\/hero-kitchen-640\.webp 640w,[^"]+1536\.webp 1536w"/);
    const json=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
    for(const type of ['Organization','WebSite','ItemList','FAQPage'])assert.ok(json['@graph'].some(item=>item['@type']===type));
    assert.ok((html.match(/data-track="/g)||[]).length>=12);
  }
});

test('homepage excludes unsupported product and service claims in every language', async () => {
  const prohibited=[
    /culinary excellence/i,/perfect(?:ion)?/i,/large capacity/i,/ergonomic/i,/gas efficiency/i,
    /economical gas/i,/dark blue/i,/built to last/i,/durab(?:le|ility)/i,/stain resistance/i,
    /rapid heating/i,/even(?:ly)? cook/i,/fair pric/i,/affordab/i,/guaranteed results/i,/warranty/i,
    /excellence culinaire/i,/grande capacité/i,/ergonom/i,/efficacité.*gaz/i,/bleu foncé/i,
    /longévité/i,/résist.*tache/i,/chauffage rapide/i,/cuisson uniforme/i,/prix juste/i,/garantie/i,
    /التميز في الطهي/i,/سعة كبيرة/i,/مريح/i,/كفاءة الغاز/i,/الأزرق الداكن/i,/متانة/i,
    /مقاومة البقع/i,/تسخين سريع/i,/طهي متساو/i,/سعر عادل/i,/ضمان/i
  ];
  for(const locale of Object.keys(HOME)){
    const html=await readFile(distRoot+`${locale}/index.html`,'utf8');
    for(const pattern of prohibited)assert.doesNotMatch(html,pattern,`${locale}: ${pattern}`);
  }
});
