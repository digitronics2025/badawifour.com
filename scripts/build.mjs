import { mkdir, rm, writeFile, readFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

import { T } from '../src/i18n.mjs';
import { PRODUCTS, RETAILER as RETAILER_INFO } from '../src/catalog.mjs';
import { GUIDES } from '../src/content.mjs';

const OUT=fileURLToPath(new URL('../dist/',import.meta.url));
const BRAND_SOURCE=fileURLToPath(new URL('../src/brand/v1/',import.meta.url));
const BF65CINOX_SOURCE=fileURLToPath(new URL('../src/products/v1/bf65cinox/bf65cinox-master.png',import.meta.url));
const BF65CINOX_WIDTHS=[320,640,960,1122];
const ORIGIN='https://badawifour.com';
const PRODUCT_DATA=PRODUCTS[0];
const RETAILER=RETAILER_INFO.productUrl;
const WHATSAPP=RETAILER_INFO.whatsapp;
const PRODUCT=PRODUCT_DATA.media.product.map(media=>media.src);
const FOOD=PRODUCT_DATA.media.food;
const VIDEO=PRODUCT_DATA.media.video;
const LANGS=['fr','ar','en'];
const BUILD_DATE=new Date().toISOString().slice(0,10);
const BRAND_FILES=[
  'badawi-four-logo.svg',
  'badawi-four-logo-reversed.svg',
  'badawi-four-flame.svg',
  'badawi-four-lockup.svg',
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'maskable-icon-512x512-dark-bg.png'
];

const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const p=(l,x='')=>`/${l}/${x}`.replace(/\/{2,}/g,'/').replace(/(?<!\/)$/,'/');
const absolute=(l,x='')=>ORIGIN+p(l,x);
const wa=(l,context='product',product=PRODUCT_DATA)=>{
  const model=product?.model||PRODUCT_DATA.model;
  const messages=context==='general'?{
    fr:'Bonjour, je souhaite avoir plus d’informations sur BADAWI.',
    en:'Hello, I would like more information about BADAWI.',
    ar:'مرحبا، أريد معلومات عن BADAWI.'
  }:{
    fr:`Bonjour, je souhaite avoir plus d’informations sur BADAWI ${model}.`,
    en:`Hello, I would like more information about BADAWI ${model}.`,
    ar:`مرحبا، أريد معلومات عن BADAWI ${model}.`
  };
  return `${WHATSAPP.url}?text=${encodeURIComponent(messages[l]+'\n'+absolute(l,context==='product'?`products/${product.slug}/`:''))}`;
};
const whatsappIcon=()=>`<svg class="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;
const btn=(u,t,k='primary',a='')=>`<a class="btn ${k}" href="${u}" ${a}>${esc(t)}<span aria-hidden="true">↗</span></a>`;
const whatsappBtn=(l,context='product',k='whatsapp',extra='',product=PRODUCT_DATA)=>`<a class="btn ${k} whatsapp-btn" href="${wa(l,context,product)}" data-track="whatsapp_click" data-destination="Digitronics WhatsApp" ${extra}>${whatsappIcon()}<span>${esc(T[l].whatsapp)}</span><span class="btn-arrow" aria-hidden="true">↗</span></a>`;
const eyebrow=s=>`<p class="eyebrow">${esc(s)}</p>`;
const responsive=(media,alt,cls='',eager=false,sizes='100vw')=>{
  const src=typeof media==='string'?media:media.src;
  const srcset=typeof media==='string'?'':(media.srcset||[]).map(([w,u])=>`${u} ${w}w`).join(', ');
  return `<img${cls?` class="${cls}"`:''} src="${src}"${srcset?` srcset="${srcset}" sizes="${sizes}"`:''} alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''} referrerpolicy="no-referrer">`;
};
const img=(u,a,c='')=>responsive(u,a,c,false);
const logo=(l,context='header')=>context==='footer'
  ? `<a class="brand brand-footer" href="${p(l)}" aria-label="BADAWI FOUR"><img src="/brand/v1/badawi-four-logo-reversed.svg" width="1000" height="1000" alt=""></a>`
  : `<a class="brand brand-header" href="${p(l)}" aria-label="BADAWI FOUR"><img class="brand-lockup" src="/brand/v1/badawi-four-lockup.svg" width="1030" height="220" alt=""></a>`;
const langs=(l,path)=>`<div class="langs" aria-label="Language">${LANGS.map(x=>`<a href="${p(x,path)}" lang="${x}" ${l===x?'aria-current="page"':''}>${x==='ar'?'ع':x.toUpperCase()}</a>`).join('')}</div>`;
function header(l,current='',path=''){
  const t=T[l],paths=['products/','inspiration/','support/','about/','where-to-buy/','professionals/'];
  const skip=l==='ar'?'انتقل إلى المحتوى':l==='en'?'Skip to content':'Aller au contenu';
  const mobileHome=`<a ${path===''?'aria-current="page"':''} href="${p(l)}">${esc(t.home)}</a>`;
  const mobileNav=t.nav.map((n,i)=>`<a ${current===i?'aria-current="page"':''} href="${p(l,paths[i])}">${esc(n)}</a>`).join('');
  return `<header><a class="skip" href="#main">${skip}</a><div class="shell nav">${logo(l)}<nav aria-label="Main navigation">${t.nav.map((n,i)=>`<a ${current===i?'aria-current="page"':''} href="${p(l,paths[i])}">${esc(n)}</a>`).join('')}</nav>${langs(l,path)}<button class="menu" type="button" aria-expanded="false" aria-controls="mobile">${esc(t.menu)}</button></div><div id="mobile" hidden>${mobileHome}${mobileNav}</div></header>`;
}
function footer(l){
  const t=T[l];
  return `<footer><div class="shell foot"><div>${logo(l,'footer')}<p>${esc(t.hero)}</p></div><div><a href="${p(l,'products/')}">${esc(t.nav[0])}</a>${PRODUCTS.map(product=>`<a href="${p(l,`products/${product.slug}/`)}">${esc(product.model)}</a>`).join('')}<a href="${p(l,'support/')}">${esc(t.nav[2])}</a><a href="${p(l,'contact/')}">${l==='ar'?'اتصل بنا':'Contact'}</a></div><div><a href="${p(l,'privacy/')}">${esc(t.privacy)}</a><a href="${p(l,'legal/')}">${esc(t.legal)}</a><a href="${p(l,'professionals/')}">${esc(t.nav[5])}</a></div></div><div class="shell copy">© 2026 BADAWI FOUR · Casablanca, Morocco</div></footer>`;
}
function head(l,title,desc,path,image=PRODUCT[0],schema='',imageAlt='BADAWI BF65INOXP'){
  const url=absolute(l,path),t=T[l];
  const socialImage=image.startsWith('/')?`${ORIGIN}${image}`:image;
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}">${LANGS.map(x=>`<link rel="alternate" hreflang="${x}" href="${absolute(x,path)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${absolute('fr',path)}"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="preconnect" href="https://digitronics.ma" crossorigin><meta name="theme-color" content="#171817"><meta property="og:type" content="website"><meta property="og:site_name" content="BADAWI FOUR"><meta property="og:locale" content="${esc(t.locale)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${socialImage}"><meta property="og:image:alt" content="${esc(imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${socialImage}"><link rel="stylesheet" href="/assets/${CSS_FILE}"><script type="module" src="/assets/${JS_FILE}"></script>${schema?`<script type="application/ld+json">${schema}</script>`:''}`;
}
function imagePreload(path){
  const productSlug=/^products\/([^/]+)\/$/.exec(path)?.[1];
  const product=productSlug?PRODUCTS.find(item=>item.slug===productSlug):null;
  const media=path===''?FOOD[2]:product?.media.product[0]||(path==='about/'?FOOD[0]:null);
  if(!media)return '';
  const src=typeof media==='string'?media:media.src;
  const srcset=typeof media==='string'?'':(media.srcset||[]).map(([w,u])=>`${u} ${w}w`).join(', ');
  const sizes=product?'(max-width:900px) 100vw, 58vw':'100vw';
  return `<link rel="preload" as="image" href="${src}"${srcset?` imagesrcset="${srcset}" imagesizes="${sizes}"`:''} fetchpriority="high" referrerpolicy="no-referrer">`;
}
const page=(l,title,desc,path,body,current='',schema='',socialImage=PRODUCT[0],imageAlt='BADAWI BF65INOXP')=>`<!doctype html><html lang="${l}" dir="${T[l].dir}"><head>${head(l,title,desc,path,socialImage,schema,imageAlt)}${imagePreload(path)}</head><body>${header(l,current,path)}<main id="main">${body}</main>${footer(l)}${path?`<a class="float" data-track="whatsapp_click" data-destination="Digitronics WhatsApp" aria-label="${esc(T[l].whatsapp+' — Digitronics')}" href="${wa(l,'general')}" rel="noopener">${whatsappIcon()}</a>`:''}</body></html>`;


const localized=(l,values)=>values[l]||values.en||values.fr;
const productCopy=(l,product)=>product.content?.[l]||{
  name:`BADAWI ${product.model}`,
  short:T[l].productLead,
  description:T[l].productLead,
  metaTitle:T[l].productTitle,
  metaDescription:T[l].productLead
};
const productCard=(l,product)=>{
  const copy=productCopy(l,product);
  const discover=l==='ar'?'اكتشف المنتج':l==='en'?'Discover product':'Découvrir le produit';
  return `<article class="catalog-card"><a href="${p(l,`products/${product.slug}/`)}" data-track="product_discovery" data-product="${esc(product.model)}">${responsive(product.media.product[0],copy.name,'',false,'(max-width:620px) 100vw, 50vw')}</a><div><span class="eyebrow">BADAWI</span><h2>${esc(product.model)}</h2><p>${esc(copy.short)}</p><div class="chips"><span>${esc(product.widthLabel)}</span><span>${esc(product.finish)}</span></div>${trackedBtn(p(l,`products/${product.slug}/`),discover,'product_discovery',product.model,'dark',`data-product="${esc(product.model)}"`)}</div></article>`;
};
const trackedBtn=(u,t,event,destination,k='primary',extra='')=>btn(u,t,k,`data-track="${event}" data-destination="${esc(destination)}" ${extra}`);
function trustStrip(l){
  return `<div class="trust-strip"><div class="shell">${T[l].trust.map(item=>`<span>${esc(item)}</span>`).join('')}</div></div>`;
}
function guideCard(l,guide){
  return `<article class="guide-card"><span class="eyebrow">${l==='ar'?'دليل':l==='en'?'GUIDE':'GUIDE'}</span><h3>${esc(guide.title[l])}</h3><p>${esc(guide.description[l])}</p>${trackedBtn(p(l,`support/guides/${guide.slug}/`),T[l].readGuide,'guide_opened',guide.slug,'text',`data-guide="${esc(guide.slug)}"`)}</article>`;
}
function guidesSection(l,dark=false){
  const t=T[l];
  return `<section class="section ${dark?'dark':''}"><div class="shell"><div class="section-head"><div>${eyebrow(t.guideTitle)}<h2>${esc(t.guideTitle)}</h2></div></div><div class="guide-grid">${GUIDES.map(guide=>guideCard(l,guide)).join('')}</div></div></section>`;
}
function breadcrumb(l,items){
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item,index)=>item.url&&index<items.length-1?`<a href="${item.url}">${esc(item.label)}</a>`:`<span aria-current="page">${esc(item.label)}</span>`).join(' · ')}</nav>`;
}

function home(l){
  const t=T[l];
  const organization={
    '@context':'https://schema.org','@type':'Organization',name:'BADAWI FOUR',url:ORIGIN,
    logo:`${ORIGIN}/brand/v1/badawi-four-logo.svg`,contactPoint:{'@type':'ContactPoint',telephone:WHATSAPP.display,contactType:'customer support'}
  };
  return page(l,`BADAWI — ${t.hero}`,t.intro,'',
    `<section class="hero"><div class="hero-bg">${responsive(FOOD[2],t.hero,'',true)}</div><div class="shade"></div><div class="shell hero-copy">${eyebrow('BADAWI')}<h1>${esc(t.hero)}</h1><p>${esc(t.intro)}</p><div class="actions">${trackedBtn(p(l,'products/bf65inoxp/'),t.discover,'product_discovery','BF65INOXP','primary','data-product="BF65INOXP"')}${trackedBtn(p(l,'where-to-buy/'),t.buy,'where_to_buy_opened','where-to-buy','ghost')}${whatsappBtn(l,'product','whatsapp','data-product="BF65INOXP" rel="noopener"')}</div></div></section>
    ${trustStrip(l)}
    <section class="section"><div class="shell"><div class="section-head"><div>${eyebrow(t.flag)}<h2>${esc(t.catalogTitle)}</h2></div></div><div class="catalog-grid home-products">${PRODUCTS.map(product=>productCard(l,product)).join('')}</div></div></section>
    <section class="section dark"><div class="shell">${eyebrow(l==='ar'?'على المائدة':l==='en'?'AT THE TABLE':'À TABLE')}<h2>${esc(t.emotion)}</h2><p class="lede light">${esc(t.emotionText)}</p><div class="food">${FOOD.map((src,i)=>img(src,[l==='ar'?'طبق مشوي':'Roast dish',l==='ar'?'من الفرن إلى المائدة':'From oven to table',l==='ar'?'مائدة مشتركة':'Shared table'][i])).join('')}</div></div></section>
    <section class="section warm"><div class="shell split"><div>${eyebrow(l==='ar'?'بعد الشراء':l==='en'?'AFTER PURCHASE':'APRÈS L’ACHAT')}<h2>${esc(t.supportTitle)}</h2><p class="lede">${esc(t.supportText)}</p>${btn(p(l,'support/'),t.nav[2],'dark')}</div><div class="support-links"><a href="${p(l,'support/register/')}">01 <b>${esc(t.register)}</b></a><a href="${p(l,'support/request/')}">02 <b>${esc(t.request)}</b></a><a href="${p(l,'where-to-buy/')}">03 <b>${esc(t.buy)}</b></a></div></div></section>
    ${guidesSection(l,false)}`,
    '',JSON.stringify(organization)
  );
}

function productsPage(l){
  const t=T[l];
  return page(l,`${t.catalogTitle} — BADAWI`,t.catalogLead,'products/',
    `<section class="page-hero warm"><div class="shell">${eyebrow(t.nav[0])}<h1>${esc(t.catalogTitle)}</h1><p>${esc(t.catalogLead)}</p></div></section>
    <section class="section"><div class="shell"><div class="catalog-grid">${PRODUCTS.map(product=>productCard(l,product)).join('')}</div></div></section>`,0
  );
}

function bf65inoxpProduct(l){
  const t=T[l],facts=t.productFacts;
  const productSchema={
    '@context':'https://schema.org','@type':'Product',
    name:'BADAWI BF65INOXP',model:'BF65INOXP',brand:{'@type':'Brand',name:'BADAWI'},
    description:t.productLead,url:absolute(l,'products/bf65inoxp/'),image:PRODUCT,
    additionalProperty:[
      {'@type':'PropertyValue',name:l==='ar'?'النوع':l==='fr'?'Type':'Type',value:PRODUCT_DATA.verifiedFacts.type[l]},
      {'@type':'PropertyValue',name:l==='ar'?'التشطيب':l==='fr'?'Finition':'Finish',value:'Inox'},
      {'@type':'PropertyValue',name:l==='ar'?'الأبواب':l==='fr'?'Portes':'Doors',value:PRODUCT_DATA.verifiedFacts.doors[l]},
      {'@type':'PropertyValue',name:l==='ar'?'الأبعاد':l==='fr'?'Dimensions':'Dimensions',value:PRODUCT_DATA.verifiedFacts.dimensions[l]},
      {'@type':'PropertyValue',name:l==='ar'?'الوزن الصافي':l==='fr'?'Poids net':'Net weight',value:PRODUCT_DATA.verifiedFacts.weight[l]}
    ]
  };
  const breadcrumbSchema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'BADAWI',item:absolute(l)},
    {'@type':'ListItem',position:2,name:t.nav[0],item:absolute(l,'products/')},
    {'@type':'ListItem',position:3,name:'BF65INOXP',item:absolute(l,'products/bf65inoxp/')}
  ]};
  const media=PRODUCT_DATA.media.product;
  const labels={
    model:l==='ar'?'الموديل':l==='en'?'Model':'Modèle',
    type:l==='ar'?'النوع':l==='en'?'Type':'Type',
    finish:l==='ar'?'التشطيب':l==='en'?'Finish':'Finition',
    doors:l==='ar'?'الأبواب':l==='en'?'Doors':'Portes',
    installation:l==='ar'?'التركيب':l==='en'?'Installation':'Installation',
    dimensions:l==='ar'?'الأبعاد':l==='en'?'Dimensions':'Dimensions',
    weight:l==='ar'?'الوزن الصافي':l==='en'?'Net weight':'Poids net'
  };
  return page(l,t.productTitle,t.productLead,'products/bf65inoxp/',
    `<section class="product-hero"><div class="shell product-grid">
      <div class="gallery" data-gallery data-product="BF65INOXP"><div class="main">${responsive(media[0],'BADAWI BF65INOXP','gallery-current',true,'(max-width:900px) 100vw, 58vw')}</div>
      ${media.map((item,i)=>`<button type="button" data-thumb="${i}" aria-label="${esc((l==='ar'?'عرض صورة':l==='en'?'Show image':'Afficher l’image')+' '+(i+1))}">${responsive(item,`BF65INOXP ${i+1}`,'',false,'90px')}</button>`).join('')}</div>
      <div class="product-info">${breadcrumb(l,[{label:'BADAWI',url:p(l)},{label:t.nav[0],url:p(l,'products/')},{label:'BF65INOXP'}])}${eyebrow('BADAWI · BF65INOXP')}<h1>BF65INOXP</h1><h2>${esc(t.hero)}</h2><p>${esc(t.productLead)}</p>
      <div class="live live-card" data-retailer-live data-product-slug="bf65inoxp"><div><small>${esc(t.price)}</small><b data-price>—</b><span class="currency-hint">${esc(t.currencyHint)}</span></div><div><small>${esc(t.stock)}</small><b data-stock>—</b></div></div>
      <div class="actions vertical">${trackedBtn(RETAILER,t.retailer,'digitronics_click','Digitronics','primary','data-product="BF65INOXP" rel="noopener"')}${whatsappBtn(l,'product','dark','data-product="BF65INOXP" rel="noopener"')}</div></div>
    </div></section>
    ${trustStrip(l)}
    <section class="section"><div class="shell">${eyebrow(t.verified)}<h2>${esc(t.details)}</h2><div class="details">
      <article><span>01</span><h3>${esc(facts.finishTitle)}</h3><p>${esc(facts.finishText)}</p></article>
      <article><span>02</span><h3>${esc(facts.doorsTitle)}</h3><p>${esc(facts.doorsText)}</p></article>
      <article><span>03</span><h3>${esc(facts.controlsTitle)}</h3><p>${esc(facts.controlsText)}</p></article>
    </div></div></section>
    <section class="section video"><div class="shell"><video data-track-video controls playsinline preload="metadata" poster="${FOOD[2]}"><source src="${VIDEO}" type="video/mp4"><p>${l==='ar'?'تعذر تشغيل الفيديو.':l==='en'?'Video playback is unavailable.':'La vidéo ne peut pas être lue.'}</p></video></div></section>
    <section class="section dark"><div class="shell split"><div><h2>${esc(t.verified)}</h2><p class="lede light">${esc(t.specNote)}</p>${btn(p(l,'support/guides/before-installation/'),GUIDES[2].title[l],'ghost')}</div>
      <dl class="specs"><div><dt>${esc(labels.model)}</dt><dd>BF65INOXP</dd></div><div><dt>${esc(labels.type)}</dt><dd>${esc(PRODUCT_DATA.verifiedFacts.type[l])}</dd></div><div><dt>${esc(labels.finish)}</dt><dd>Inox</dd></div><div><dt>${esc(labels.doors)}</dt><dd>${esc(PRODUCT_DATA.verifiedFacts.doors[l])}</dd></div><div><dt>${esc(labels.installation)}</dt><dd>${l==='ar'?'غير مشمول':l==='en'?'Not included':'Non incluse'}</dd></div></dl>
    </div></section>
    <section class="section"><div class="shell narrow"><div class="section-head"><div>${eyebrow(l==='ar'?'أسئلة شائعة':l==='en'?'FAQ':'QUESTIONS FRÉQUENTES')}<h2>${l==='ar'?'إجابات واضحة قبل الشراء':l==='en'?'Clear answers before you buy':'Des réponses claires avant d’acheter'}</h2></div></div><div class="faq">${t.faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>
    <section class="section warm"><div class="shell split"><div><h2>${esc(t.supportTitle)}</h2><p class="lede">${esc(t.supportText)}</p></div><div class="actions vertical">${btn(p(l,'support/register/'),t.register,'dark')}${btn(p(l,'support/request/'),t.request,'ghost')}</div></div></section>
    <div class="mobile-buy"><span>BF65INOXP</span><a href="${RETAILER}" data-track="digitronics_click" data-destination="Digitronics" data-product="BF65INOXP" rel="noopener">${esc(t.buy)}</a></div>`,
    0,JSON.stringify([productSchema,breadcrumbSchema])
  );
}

function inspiration(l){
  const t=T[l];
  const cards=[
    [FOOD[0],l==='fr'?'Doré et généreux':l==='ar'?'ذهبي وشهي':'Golden and generous'],
    [FOOD[1],l==='fr'?'Du four à la table':l==='ar'?'من الفرن إلى المائدة':'From oven to table'],
    [FOOD[2],l==='fr'?'Cuisine du quotidien':l==='ar'?'طبخ كل يوم':'Everyday cooking']
  ];
  return page(l,`${t.inspiration} — BADAWI`,t.inspirationLead,'inspiration/',
    `<section class="page-hero warm"><div class="shell">${eyebrow(t.nav[1])}<h1>${esc(t.inspiration)}</h1><p>${esc(t.inspirationLead)}</p></div></section>
    <section class="section"><div class="shell editorial">${cards.map(([im,tx],i)=>`<article>${img(im,tx)}<div><span>0${i+1}</span><h2>${esc(tx)}</h2></div></article>`).join('')}</div></section>
    ${guidesSection(l,true)}`,1
  );
}

function support(l){
  const t=T[l],sc=t.supportCards;
  return page(l,`BADAWI ${t.nav[2]}`,t.supportText,'support/',
    `<section class="page-hero dark"><div class="shell">${eyebrow(t.nav[2])}<h1>${esc(t.supportTitle)}</h1><p>${esc(t.supportText)}</p><div class="actions">${btn(p(l,'support/register/'),t.register)}${btn(p(l,'support/request/'),t.request,'ghost')}</div></div></section>
    <section class="section"><div class="shell cards">
      <article><span>01</span><h2>${esc(sc.documentsTitle)}</h2><p>${esc(sc.documentsText)}</p></article>
      <article><span>02</span><h2>${esc(sc.guidesTitle)}</h2><p>${esc(sc.guidesText)}</p></article>
      <article><span>03</span><h2>${esc(t.register)}</h2>${btn(p(l,'support/register/'),t.register,'text')}</article>
      <article><span>04</span><h2>${esc(t.request)}</h2>${btn(p(l,'support/request/'),t.request,'text')}</article>
    </div></section>
    ${guidesSection(l,false)}`,2
  );
}

function about(l){
  const t=T[l];
  const values={
    fr:[['Clarté','Des informations lisibles et vérifiables.'],['Utilité','Un support qui continue après l’achat.'],['Cuisine','Des produits au service des moments partagés.']],
    en:[['Clarity','Product information that is clear and verifiable.'],['Usefulness','Support that continues after purchase.'],['Cooking','Products made for shared moments around food.']],
    ar:[['الوضوح','معلومات واضحة وقابلة للتحقق.'],['الفائدة','دعم يستمر بعد الشراء.'],['المطبخ','منتجات لخدمة اللحظات المشتركة حول الطعام.']]
  }[l];
  return page(l,`BADAWI — ${t.about}`,t.aboutText,'about/',
    `<section class="image-hero">${responsive(FOOD[2],'','image-hero-bg',true)}<div class="image-hero-shade"></div><div class="shell image-hero-content">${eyebrow('BADAWI')}<h1>${esc(t.about)}</h1></div></section>
    <section class="section"><div class="shell prose"><p class="big">${esc(t.aboutText)}</p><p>${l==='fr'?'Notre approche privilégie des produits lisibles, une information claire et un support utile. Nous préférons publier moins de promesses, mais pouvoir les vérifier.':l==='ar'?'نفضل منتجات واضحة ومعلومات دقيقة ودعماً مفيداً. ننشر وعوداً أقل، لكن نحرص على أن تكون قابلة للتحقق.':'Our approach favors clear products, clear information and useful support. We would rather publish fewer claims and be able to verify them.'}</p><div class="values">${values.map(([h,b])=>`<article><h2>${esc(h)}</h2><p>${esc(b)}</p></article>`).join('')}</div></div></section>`,3
  );
}

function where(l){
  const t=T[l];
  return page(l,`${t.buy} — BADAWI`,t.whereText,'where-to-buy/',
    `<section class="page-hero warm"><div class="shell">${eyebrow(t.buy)}<h1>${esc(t.where)}</h1><p>${esc(t.whereText)}</p></div></section>
    <section class="section"><div class="shell retailer retailer-rich">
      <div><span class="eyebrow">${l==='ar'?'نقطة البيع الحالية':l==='en'?'CURRENT RETAILER':'POINT DE VENTE ACTUEL'}</span><h2>${esc(RETAILER_INFO.name)}</h2><p>${esc(RETAILER_INFO.address)}</p><a class="inline-link" href="${RETAILER_INFO.mapUrl}" rel="noopener">${l==='ar'?'فتح الموقع على الخريطة':l==='en'?'Open location on map':'Ouvrir l’emplacement sur la carte'}</a><div class="retailer-trust">${t.trust.map(item=>`<span>✓ ${esc(item)}</span>`).join('')}</div></div>
      <div class="where-products">${PRODUCTS.map(product=>`<article><h3>${esc(product.model)}</h3><div class="live live-card" data-retailer-live data-product-slug="${esc(product.slug)}"><div><small>${esc(t.price)}</small><b data-price>—</b><span class="currency-hint">${esc(t.currencyHint)}</span></div><div><small>${esc(t.stock)}</small><b data-stock>—</b></div></div><div class="actions vertical">${trackedBtn(product.retailer.productUrl,t.retailer,'digitronics_click','Digitronics','dark',`data-product="${esc(product.model)}" rel="noopener"`)}${whatsappBtn(l,'product','ghost',`data-product="${esc(product.model)}" rel="noopener"`,product)}</div></article>`).join('')}</div>
    </div></section>`,4
  );
}

const requiredMark=(required)=>required?'<span class="required-mark" aria-hidden="true"> *</span>':'';
const field=(label,name,type='text',extra='')=>{
  const required=/\brequired\b/.test(extra);
  return `<label><span>${esc(label)}${requiredMark(required)}</span><input name="${name}" type="${type}" ${required?'aria-required="true"':''} ${extra}></label>`;
};
const textarea=(label,name)=>`<label class="full"><span>${esc(label)}${requiredMark(true)}</span><textarea name="${name}" rows="5" required aria-required="true" maxlength="3000"></textarea></label>`;
const select=(label,name,options,extra='')=>{
  const required=/\brequired\b/.test(extra);
  return `<label><span>${esc(label)}${requiredMark(required)}</span><select name="${name}" ${required?'aria-required="true"':''} ${extra}>${options.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select></label>`;
};
function formPage(l,type,title,lead,fields,current=5){
  const t=T[l];
  const path=type==='contact'?'contact/':type==='professionals'?'professionals/':`support/${type==='registration'?'register':'request'}/`;
  return page(l,`${title} — BADAWI`,lead,path,
    `<section class="page-hero warm"><div class="shell">${breadcrumb(l,[{label:'BADAWI',url:p(l)},...(type==='registration'||type==='support'?[{label:t.nav[2],url:p(l,'support/')}]:[]),{label:title}])}<h1>${esc(title)}</h1><p>${esc(lead)}</p></div></section>
    <section class="section"><div class="shell form-layout"><form data-api-form="${type}" aria-describedby="required-note" data-success-prefix="${esc(t.formSuccess)}" data-error-message="${esc(t.formError)}" enctype="multipart/form-data"><input type="hidden" name="locale" value="${l}"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="started_at" value=""><p id="required-note" class="required-note">${l==='ar'?'* حقل مطلوب':l==='en'?'* Required field':'* Champ obligatoire'}</p>${fields}<label class="consent"><input type="checkbox" name="privacy_consent" value="1" required aria-required="true"><span>${esc(t.labels.privacyConsent)}<span class="required-mark" aria-hidden="true"> *</span> <a class="inline-link" href="${p(l,'privacy/')}" target="_blank" rel="noopener">${esc(t.privacy)}</a></span></label><button class="btn dark" type="submit">${esc(t.send)} <span aria-hidden="true">↗</span></button><p data-form-status role="status" aria-live="polite"></p></form><aside><h2>WhatsApp</h2>${whatsappBtn(l,'general','dark','rel="noopener"')}<p>${esc(WHATSAPP.display)}</p><p class="muted">${esc(t.supportText)}</p></aside></div></section>`,
    current
  );
}
function registration(l){
  const t=T[l],x=t.labels;
  const productOptions=PRODUCTS.map(product=>[product.model,product.model]);
  const fields=field(x.firstName,'first_name','text','required autocomplete="given-name" maxlength="80"')+
    field(x.lastName,'last_name','text','required autocomplete="family-name" maxlength="80"')+
    field(x.phone,'phone','tel','required autocomplete="tel" inputmode="tel" maxlength="30"')+
    field(x.email,'email','email','autocomplete="email" maxlength="160"')+
    select(x.model,'model',productOptions,'required')+
    field(x.serial,'serial_number','text','maxlength="100"')+
    field(x.purchaseDate,'purchase_date','date')+
    field(x.retailer,'retailer','text','value="Digitronics" maxlength="120"')+
    field(x.invoice,'invoice_reference','text','maxlength="120"')+
    field(x.receipt,'receipt','file','accept="image/jpeg,image/png,image/webp,application/pdf"')+
    `<label class="consent full"><input type="checkbox" name="marketing_consent" value="1"><span>${esc(x.marketingConsent)}</span></label>`;
  return formPage(l,'registration',t.register,t.supportText,fields,2);
}
function request(l){
  const t=T[l],x=t.labels;
  const productOptions=PRODUCTS.map(product=>[product.model,product.model]);
  const fields=field(x.name,'name','text','required autocomplete="name" maxlength="120"')+
    field(x.phone,'phone','tel','required autocomplete="tel" inputmode="tel" maxlength="30"')+
    field(x.email,'email','email','autocomplete="email" maxlength="160"')+
    select(x.model,'model',productOptions,'required')+
    field(x.serial,'serial_number','text','maxlength="100"')+
    select(x.category,'category',[[ 'product',x.productInfo],['installation',x.installation],['order',x.order],['other',x.other]],'required')+
    textarea(x.description,'description')+
    field(x.attachment,'attachment','file','accept="image/jpeg,image/png,image/webp"');
  return formPage(l,'support',t.request,t.supportText,fields,2);
}
function pros(l){
  const t=T[l],x=t.labels;
  const fields=field(x.company,'company','text','required autocomplete="organization" maxlength="160"')+
    field(x.contactName,'contact_name','text','required autocomplete="name" maxlength="120"')+
    field(x.country,'country','text','autocomplete="country-name" maxlength="100"')+
    field(x.phone,'phone','tel','required autocomplete="tel" inputmode="tel" maxlength="30"')+
    field(x.email,'email','email','autocomplete="email" maxlength="160"')+
    select(x.businessType,'business_type',[[ 'distributor',x.distributor],['retailer',x.retailerBusiness],['hospitality',x.hospitality],['industrial',x.industrial],['project',x.project],['other',x.other]],'required')+
    textarea(x.message,'message');
  return formPage(l,'professionals',t.pros,t.prosText,fields,5);
}
function contact(l){
  const t=T[l],x=t.labels;
  const fields=field(x.name,'name','text','required autocomplete="name" maxlength="120"')+
    field(x.phone,'phone','tel','autocomplete="tel" inputmode="tel" maxlength="30"')+
    field(x.email,'email','email','autocomplete="email" maxlength="160"')+
    field(x.subject,'subject','text','required maxlength="160"')+
    textarea(x.message,'message');
  return formPage(l,'contact',t.contact,t.contactText,fields,'');
}

function simple(l,key){
  const t=T[l],title=t[key],path=key==='privacy'?'privacy/':'legal/';
  const privacy={
    fr:[
      ['Données que nous collectons','Lorsque vous nous contactez, demandez de l’assistance ou enregistrez un produit, nous collectons les informations que vous fournissez dans le formulaire. Les preuves d’achat et photos sont conservées dans un stockage privé lorsqu’elles sont jointes.'],
      ['Pourquoi nous les utilisons','Ces données servent à traiter votre demande, enregistrer votre produit et fournir l’assistance. Les messages marketing ne sont envoyés que si vous choisissez séparément de les recevoir.'],
      ['Mesure des conversions','Le site enregistre des événements fonctionnels limités, par exemple un clic vers un revendeur ou l’achèvement d’un formulaire. Nous n’enregistrons pas l’adresse IP brute dans ces événements et nous n’utilisons pas de cookie publicitaire pour cette mesure interne.'],
      ['Conservation et sécurité','Les événements techniques sont supprimés automatiquement après environ 13 mois. Les dossiers d’assistance et d’enregistrement sont conservés aussi longtemps que nécessaire pour le service et les obligations applicables. Les pièces jointes sont stockées dans un espace privé.'],
      ['Vos demandes','Pour une question relative à vos données, utilisez la page Contact en indiquant clairement l’objet de votre demande.']
    ],
    en:[
      ['Data we collect','When you contact us, request support or register a product, we collect the information you provide in the form. Proof of purchase and support photos are stored privately when attached.'],
      ['Why we use it','We use this data to process requests, register products and provide support. Marketing messages are only sent when you separately choose to receive them.'],
      ['Conversion measurement','The site records limited first-party functional events, such as a retailer click or successful form submission. Raw IP addresses are not stored in these event records and this internal measurement does not use advertising cookies.'],
      ['Retention and security','Technical event records are automatically removed after approximately 13 months. Support and registration records are kept as long as reasonably necessary for service and applicable obligations. Attachments are stored privately.'],
      ['Your requests','For a data-related request, use the Contact page and clearly state the purpose of your request.']
    ],
    ar:[
      ['البيانات التي نجمعها','عند التواصل معنا أو طلب الدعم أو تسجيل منتج، نجمع المعلومات التي تدخلها في النموذج. تحفظ إثباتات الشراء وصور الدعم في مساحة تخزين خاصة عند إرفاقها.'],
      ['لماذا نستخدمها','نستخدم البيانات لمعالجة الطلبات وتسجيل المنتجات وتقديم الدعم. لا ترسل رسائل تسويقية إلا إذا اخترت بشكل منفصل تلقيها.'],
      ['قياس التحويلات','يسجل الموقع أحداثاً وظيفية محدودة مثل الضغط على رابط البائع أو إتمام نموذج بنجاح. لا نخزن عنوان IP الخام ضمن سجلات هذه الأحداث ولا نستخدم ملفات تعريف ارتباط إعلانية لهذا القياس الداخلي.'],
      ['الاحتفاظ والأمان','تحذف سجلات الأحداث التقنية تلقائياً بعد نحو 13 شهراً. تحفظ سجلات الدعم والتسجيل للمدة اللازمة للخدمة والالتزامات المطبقة. تحفظ المرفقات بشكل خاص.'],
      ['طلباتك','لطلب متعلق ببياناتك استخدم صفحة الاتصال واشرح موضوع الطلب بوضوح.']
    ]
  };
  const legal={
    fr:[
      ['Éditeur','BADAWI est une marque présentée depuis Casablanca, Maroc. Le site officiel badawifour.com fournit des informations de marque, produit et assistance.'],
      ['Vente et paiement','Les achats actuellement proposés via le site sont redirigés vers Digitronics, qui confirme le prix, le stock, la livraison et les conditions de commande. BADAWI ne traite pas directement le paiement sur ce site.'],
      ['Informations produit','Nous publions uniquement les caractéristiques que nous pouvons vérifier. Les dimensions produit 65 × 55 × 55 cm et le poids net de 12 kg sont documentés. Les dégagements d’installation, exigences de raccordement et autres données non validées doivent être confirmés avant installation.'],
      ['Installation','L’installation du BF65INOXP n’est pas incluse. Les conditions applicables sont confirmées lors de l’achat.']
    ],
    en:[
      ['Publisher','BADAWI is a brand presented from Casablanca, Morocco. The official badawifour.com site provides brand, product and support information.'],
      ['Sales and payment','Purchases currently offered through this site are handed off to Digitronics, which confirms price, stock, delivery and order terms. BADAWI does not directly process payment on this site.'],
      ['Product information','We publish product characteristics only when they can be verified. Product dimensions of 65 × 55 × 55 cm and a 12 kg net weight are documented. Installation clearances, connection requirements and other unvalidated technical data must be confirmed before installation.'],
      ['Installation','BF65INOXP installation is not included. Applicable conditions are confirmed when purchasing.']
    ],
    ar:[
      ['الناشر','BADAWI علامة تقدم من الدار البيضاء، المغرب. يوفر الموقع الرسمي badawifour.com معلومات عن العلامة والمنتج والدعم.'],
      ['البيع والدفع','عمليات الشراء المعروضة حالياً عبر الموقع تنتقل إلى Digitronics الذي يؤكد السعر والمخزون والتوصيل وشروط الطلب. لا يعالج موقع BADAWI الدفع مباشرة.'],
      ['معلومات المنتج','ننشر مواصفات المنتج فقط عندما نستطيع التحقق منها. أبعاد المنتج الموثقة هي 65 × 55 × 55 سم والوزن الصافي 12 كغ. يجب تأكيد مسافات التركيب ومتطلبات التوصيل وأي بيانات تقنية غير موثقة قبل التركيب.'],
      ['التركيب','تركيب BF65INOXP غير مشمول. يتم تأكيد الشروط المطبقة عند الشراء.']
    ]
  };
  const sections=(key==='privacy'?privacy:legal)[l];
  return page(l,`${title} — BADAWI`,sections[0][1],path,
    `<section class="page-hero warm"><div class="shell"><h1>${esc(title)}</h1><p>${esc(sections[0][1])}</p></div></section><section class="section"><div class="shell prose legal-copy">${sections.map(([h,b])=>`<section><h2>${esc(h)}</h2><p>${esc(b)}</p></section>`).join('')}<p class="muted">${l==='ar'?'آخر تحديث: '+BUILD_DATE:l==='en'?'Last updated: '+BUILD_DATE:'Dernière mise à jour : '+BUILD_DATE}</p></div></section>`
  );
}

function guidePage(l,guide){
  const t=T[l];
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:guide.title[l],description:guide.description[l],inLanguage:l,author:{'@type':'Organization',name:'BADAWI FOUR'},publisher:{'@type':'Organization',name:'BADAWI FOUR'},dateModified:BUILD_DATE,mainEntityOfPage:absolute(l,`support/guides/${guide.slug}/`)});
  return page(l,`${guide.title[l]} — BADAWI`,guide.description[l],`support/guides/${guide.slug}/`,
    `<article class="article-page"><section class="page-hero warm"><div class="shell">${breadcrumb(l,[{label:'BADAWI',url:p(l)},{label:t.nav[2],url:p(l,'support/')},{label:guide.title[l]}])}${eyebrow(t.guideTitle)}<h1>${esc(guide.title[l])}</h1><p>${esc(guide.description[l])}</p></div></section><section class="section"><div class="shell prose article-body">${guide.sections[l].map(([h,b],index)=>`<section><span class="eyebrow">0${index+1}</span><h2>${esc(h)}</h2><p>${esc(b)}</p></section>`).join('')}<div class="article-cta">${btn(p(l,'support/'),t.backToSupport,'dark')}${btn(p(l,'support/request/'),t.request,'ghost')}</div></div></section></article>`,2,schema
  );
}

const CSS=await readFile(new URL('../src/site.css',import.meta.url),'utf8');
const JS=await readFile(new URL('../src/site.js',import.meta.url),'utf8');
const CSS_FILE=`site.${createHash('sha256').update(CSS).digest('hex').slice(0,12)}.css`;
const JS_FILE=`site.${createHash('sha256').update(JS).digest('hex').slice(0,12)}.js`;

async function write(rel,data){
  const file=join(OUT,rel);
  await mkdir(dirname(file),{recursive:true});
  await writeFile(file,data);
}

function standardProduct(l,product){
  const t=T[l],copy=productCopy(l,product),media=product.media.product;
  const path=`products/${product.slug}/`;
  const propertyNames={
    type:l==='ar'?'النوع':l==='en'?'Type':'Type',
    burners:copy.factLabels[0],
    finish:copy.factLabels[1],
    dimensions:copy.factLabels[2]
  };
  const productSchema={
    '@context':'https://schema.org','@type':'Product',
    name:copy.name,model:product.model,brand:{'@type':'Brand',name:'BADAWI'},
    description:copy.description,url:absolute(l,path),image:media.map(item=>item.src.startsWith('/')?`${ORIGIN}${item.src}`:item.src),
    additionalProperty:Object.entries(product.verifiedFacts).map(([key,value])=>({
      '@type':'PropertyValue',name:propertyNames[key]||key,value:value[l]
    }))
  };
  const breadcrumbSchema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'BADAWI',item:absolute(l)},
    {'@type':'ListItem',position:2,name:t.nav[0],item:absolute(l,'products/')},
    {'@type':'ListItem',position:3,name:product.model,item:absolute(l,path)}
  ]};
  const details=copy.facts.map((fact,index)=>`<article><span>0${index+1}</span><h3>${esc(copy.factLabels[index])}</h3><p>${esc(fact)}</p></article>`).join('');
  return page(l,copy.metaTitle,copy.metaDescription,path,
    `<section class="product-hero"><div class="shell product-grid">
      <div class="gallery single-product-image" data-gallery data-product="${esc(product.model)}"><div class="main">${responsive(media[0],copy.name,'gallery-current',true,'(max-width:900px) 100vw, 58vw')}</div></div>
      <div class="product-info">${breadcrumb(l,[{label:'BADAWI',url:p(l)},{label:t.nav[0],url:p(l,'products/')},{label:product.model}])}${eyebrow(`BADAWI · ${product.model}`)}<h1>${esc(product.model)}</h1><h2>${esc(product.verifiedFacts.type[l])}</h2><p>${esc(copy.description)}</p>
      <div class="live live-card" data-retailer-live data-product-slug="${esc(product.slug)}"><div><small>${esc(t.price)}</small><b data-price>—</b><span class="currency-hint">${esc(t.currencyHint)}</span></div><div><small>${esc(t.stock)}</small><b data-stock>—</b></div></div>
      <p class="availability-note">${esc(copy.availability)}</p><div class="actions vertical">${trackedBtn(product.retailer.productUrl,t.retailer,'digitronics_click','Digitronics','primary',`data-product="${esc(product.model)}" rel="noopener"`)}${whatsappBtn(l,'product','dark',`data-product="${esc(product.model)}" rel="noopener"`,product)}</div></div>
    </div></section>
    ${trustStrip(l)}
    <section class="section"><div class="shell">${eyebrow(t.verified)}<h2>${esc(t.details)}</h2><div class="details">${details}</div></div></section>
    <section class="section dark"><div class="shell split"><div><h2>${esc(t.verified)}</h2><p class="lede light">${esc(copy.description)}</p></div><dl class="specs">${copy.facts.map((fact,index)=>`<div><dt>${esc(copy.factLabels[index])}</dt><dd>${esc(fact)}</dd></div>`).join('')}</dl></div></section>
    <section class="section warm"><div class="shell split"><div><h2>${esc(t.supportTitle)}</h2><p class="lede">${esc(t.supportText)}</p></div><div class="actions vertical">${btn(p(l,'support/register/'),t.register,'dark')}${btn(p(l,'support/request/'),t.request,'ghost')}</div></div></section>
    <div class="mobile-buy"><span>${esc(product.model)}</span><a href="${product.retailer.productUrl}" data-track="digitronics_click" data-destination="Digitronics" data-product="${esc(product.model)}" rel="noopener">${esc(t.buy)}</a></div>`,
    0,JSON.stringify([productSchema,breadcrumbSchema]),media[0].src,copy.name
  );
}

function productPage(l,product){
  return product.slug==='bf65inoxp'?bf65inoxpProduct(l):standardProduct(l,product);
}

async function buildBf65cinoxAssets(){
  const source=await readFile(BF65CINOX_SOURCE);
  const digest=createHash('sha256').update(source).digest('hex').toUpperCase();
  if(digest!=='8F6E7419DBFB0DBC89DDB7441CCD43B43423C5320FC7EBCD7DC5F7601C4ED92A') throw new Error(`BF65CINOX source checksum mismatch: ${digest}`);
  const metadata=await sharp(source).metadata();
  if(metadata.width!==1122||metadata.height!==1402) throw new Error(`BF65CINOX source dimensions changed: ${metadata.width}x${metadata.height}`);
  for(const width of BF65CINOX_WIDTHS){
    const image=await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:82,effort:6}).toBuffer();
    await write(`products/v1/bf65cinox/bf65cinox-${width}.webp`,image);
  }
}

await rm(OUT,{recursive:true,force:true});
await mkdir(OUT,{recursive:true});
await write(`assets/${CSS_FILE}`,CSS);
await write(`assets/${JS_FILE}`,JS);
// Keep stable aliases for older cached HTML while new pages use fingerprints.
await write('assets/site.css',CSS);
await write('assets/site.js',JS);
await buildBf65cinoxAssets();
for(const file of BRAND_FILES){
  const target=join(OUT,'brand','v1',file);
  await mkdir(dirname(target),{recursive:true});
  await copyFile(join(BRAND_SOURCE,file),target);
}
await copyFile(join(BRAND_SOURCE,'favicon.svg'),join(OUT,'favicon.svg'));
await copyFile(join(BRAND_SOURCE,'favicon.ico'),join(OUT,'favicon.ico'));
await copyFile(join(BRAND_SOURCE,'apple-touch-icon.png'),join(OUT,'apple-touch-icon.png'));

const localizedRoutes=[
  '',
  'products/',
  ...PRODUCTS.map(product=>`products/${product.slug}/`),
  'inspiration/',
  'support/',
  'support/register/',
  'support/request/',
  ...GUIDES.map(guide=>`support/guides/${guide.slug}/`),
  'about/',
  'where-to-buy/',
  'professionals/',
  'contact/',
  'privacy/',
  'legal/'
];

for(const l of LANGS){
  await write(`${l}/index.html`,home(l));
  await write(`${l}/products/index.html`,productsPage(l));
  for(const product of PRODUCTS) await write(`${l}/products/${product.slug}/index.html`,productPage(l,product));
  await write(`${l}/inspiration/index.html`,inspiration(l));
  await write(`${l}/support/index.html`,support(l));
  await write(`${l}/support/register/index.html`,registration(l));
  await write(`${l}/support/request/index.html`,request(l));
  for(const guide of GUIDES) await write(`${l}/support/guides/${guide.slug}/index.html`,guidePage(l,guide));
  await write(`${l}/about/index.html`,about(l));
  await write(`${l}/where-to-buy/index.html`,where(l));
  await write(`${l}/professionals/index.html`,pros(l));
  await write(`${l}/contact/index.html`,contact(l));
  await write(`${l}/privacy/index.html`,simple(l,'privacy'));
  await write(`${l}/legal/index.html`,simple(l,'legal'));
}

await write('index.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/fr/"><link rel="canonical" href="https://badawifour.com/fr/"><title>BADAWI FOUR</title></head><body><a href="/fr/">BADAWI FOUR</a></body></html>');
await write('404.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="stylesheet" href="/assets/site.css"><title>404 — BADAWI FOUR</title></head><body><main id="main"><section class="page-hero dark"><div class="shell"><p class="eyebrow">BADAWI FOUR</p><h1>404</h1><p>Page introuvable · Page not found · الصفحة غير موجودة</p><a class="btn primary" href="/fr/">BADAWI FOUR <span aria-hidden="true">↗</span></a></div></section></main></body></html>');

await write('manifest.webmanifest',JSON.stringify({
  name:'BADAWI FOUR',
  short_name:'BADAWI FOUR',
  description:'BADAWI — La cuisine qui rassemble.',
  start_url:'/fr/',
  scope:'/',
  display:'standalone',
  background_color:'#fffdfa',
  theme_color:'#171817',
  icons:[
    {src:'/brand/v1/android-chrome-192x192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'/brand/v1/android-chrome-512x512.png',sizes:'512x512',type:'image/png',purpose:'any'},
    {src:'/brand/v1/maskable-icon-512x512-dark-bg.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
  ]
},null,2));

const urls=LANGS.flatMap(l=>localizedRoutes.map(route=>absolute(l,route)));
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${url}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await write('robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${ORIGIN}/sitemap.xml\n`);
await write('llms.txt',`# BADAWI FOUR\n\nOfficial BADAWI FOUR website for BADAWI appliances: ${ORIGIN}\n\n## Current verified products\n- BF65INOXP: 65 cm gas oven, inox finish, two glazed front doors. Installation is not included. Verified physical data: 65 × 55 × 55 cm; net weight 12 kg.\n- BF65CINOX: four-burner gas cooker, inox finish. Verified physical data: 60 × 60 × 90 cm (width × depth × height).\n- Exact gas connections, capacities and other unverified technical characteristics are intentionally not claimed until validated.\n\n## Languages\n- French: ${ORIGIN}/fr/\n- Arabic: ${ORIGIN}/ar/\n- English: ${ORIGIN}/en/\n\n## Support\n- Product registration and support are available under each language's /support/ section.\n- Current retailer: Digitronics.\n`);
await write('.well-known/security.txt',`Contact: ${ORIGIN}/en/contact/\nCanonical: ${ORIGIN}/.well-known/security.txt\nExpires: 2027-09-19T00:00:00Z\nPreferred-Languages: en, fr, ar\nPolicy: ${ORIGIN}/en/privacy/\n`);
await write('_headers',`/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; img-src 'self' https://digitronics.ma data:; media-src 'self' https://digitronics.ma; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; script-src 'self' https://static.cloudflareinsights.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me https://digitronics.ma; upgrade-insecure-requests

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/brand/v1/*
  Cache-Control: public, max-age=31536000, immutable

/products/v1/*
  Cache-Control: public, max-age=31536000, immutable

/favicon.svg
  Cache-Control: public, max-age=86400

/favicon.ico
  Cache-Control: public, max-age=86400

/apple-touch-icon.png
  Cache-Control: public, max-age=86400

/manifest.webmanifest
  Cache-Control: public, max-age=3600
`);

console.log(`Built ${urls.length} localized pages with ${GUIDES.length} guides`);
