import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { T } from '../src/i18n.mjs';
import { PRODUCTS, RETAILER as RETAILER_INFO } from '../src/catalog.mjs';
import { GUIDES } from '../src/content.mjs';

const OUT=new URL('../dist/',import.meta.url).pathname;
const ORIGIN='https://badawifour.com';
const PRODUCT_DATA=PRODUCTS[0];
const RETAILER=RETAILER_INFO.productUrl;
const PHONE=RETAILER_INFO.phone;
const PRODUCT=PRODUCT_DATA.media.product.map(media=>media.src);
const FOOD=PRODUCT_DATA.media.food;
const VIDEO=PRODUCT_DATA.media.video;
const LANGS=['fr','ar','en'];
const BUILD_DATE=new Date().toISOString().slice(0,10);

const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const p=(l,x='')=>`/${l}/${x}`.replace(/\/{2,}/g,'/').replace(/(?<!\/)$/,'/');
const absolute=(l,x='')=>ORIGIN+p(l,x);
const wa=(l,context='product')=>{
  const messages={
    fr:context==='general'?'Bonjour, je souhaite avoir plus d’informations sur BADAWI.':"Bonjour, je souhaite avoir plus d’informations sur BADAWI BF65INOXP.",
    en:context==='general'?'Hello, I would like more information about BADAWI.':'Hello, I would like more information about BADAWI BF65INOXP.',
    ar:context==='general'?'مرحبا، أريد معلومات عن BADAWI.':'مرحبا، أريد معلومات عن BADAWI BF65INOXP.'
  };
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(messages[l]+'\n'+absolute(l,context==='product'?'products/bf65inoxp/':''))}`;
};
const btn=(u,t,k='primary',a='')=>`<a class="btn ${k}" href="${u}" ${a}>${esc(t)}<span aria-hidden="true">↗</span></a>`;
const eyebrow=s=>`<p class="eyebrow">${esc(s)}</p>`;
const responsive=(media,alt,cls='',eager=false,sizes='100vw')=>{
  const src=typeof media==='string'?media:media.src;
  const srcset=typeof media==='string'?'':(media.srcset||[]).map(([w,u])=>`${u} ${w}w`).join(', ');
  return `<img${cls?` class="${cls}"`:''} src="${src}"${srcset?` srcset="${srcset}" sizes="${sizes}"`:''} alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''} referrerpolicy="no-referrer">`;
};
const img=(u,a,c='')=>responsive(u,a,c,false);
const logo=l=>`<a class="brand" href="${p(l)}" aria-label="BADAWI"><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M17 1c2 8-4 10 1 16 1-5 5-7 6-11 7 8 9 17 5 25-3 6-8 9-14 9C7 40 1 34 1 26 1 17 8 12 17 1Z" fill="currentColor"/><path d="M16 20c3 4 4 7 2 11-1 2-3 4-6 4-4 0-7-3-7-7 0-5 4-8 8-12-1 4 0 6 3 8 0-2 0-3 0-4Z" fill="#fff" opacity=".85"/></svg><span>BADAWI</span></a>`;
const langs=(l,path)=>`<div class="langs" aria-label="Language">${LANGS.map(x=>`<a href="${p(x,path)}" lang="${x}" ${l===x?'aria-current="page"':''}>${x==='ar'?'ع':x.toUpperCase()}</a>`).join('')}</div>`;
function header(l,current='',path=''){
  const t=T[l],paths=['products/','inspiration/','support/','about/','where-to-buy/','professionals/'];
  const skip=l==='ar'?'انتقل إلى المحتوى':l==='en'?'Skip to content':'Aller au contenu';
  return `<header><a class="skip" href="#main">${skip}</a><div class="shell nav">${logo(l)}<nav aria-label="Main navigation">${t.nav.map((n,i)=>`<a ${current===i?'aria-current="page"':''} href="${p(l,paths[i])}">${esc(n)}</a>`).join('')}</nav>${langs(l,path)}<button class="menu" type="button" aria-expanded="false" aria-controls="mobile">${esc(t.menu)}</button></div><div id="mobile" hidden>${t.nav.map((n,i)=>`<a href="${p(l,paths[i])}">${esc(n)}</a>`).join('')}</div></header>`;
}
function footer(l){
  const t=T[l];
  return `<footer><div class="shell foot"><div>${logo(l)}<p>${esc(t.hero)}</p></div><div><a href="${p(l,'products/')}">${esc(t.nav[0])}</a><a href="${p(l,'products/bf65inoxp/')}">BF65INOXP</a><a href="${p(l,'support/')}">${esc(t.nav[2])}</a><a href="${p(l,'contact/')}">${l==='ar'?'اتصل بنا':'Contact'}</a></div><div><a href="${p(l,'privacy/')}">${esc(t.privacy)}</a><a href="${p(l,'legal/')}">${esc(t.legal)}</a><a href="${p(l,'professionals/')}">${esc(t.nav[5])}</a></div></div><div class="shell copy">© 2026 BADAWI · Casablanca, Morocco</div></footer>`;
}
function head(l,title,desc,path,image=PRODUCT[0],schema=''){
  const url=absolute(l,path),t=T[l];
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}">${LANGS.map(x=>`<link rel="alternate" hreflang="${x}" href="${absolute(x,path)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${absolute('fr',path)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest"><link rel="preconnect" href="https://digitronics.ma" crossorigin><meta name="theme-color" content="#171817"><meta property="og:type" content="website"><meta property="og:site_name" content="BADAWI"><meta property="og:locale" content="${esc(t.locale)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="BADAWI BF65INOXP"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${image}"><link rel="stylesheet" href="/assets/site.css"><script type="module" src="/assets/site.js"></script>${schema?`<script type="application/ld+json">${schema}</script>`:''}`;
}
const page=(l,title,desc,path,body,current='',schema='')=>`<!doctype html><html lang="${l}" dir="${T[l].dir}"><head>${head(l,title,desc,path,PRODUCT[0],schema)}</head><body>${header(l,current,path)}<main id="main">${body}</main>${footer(l)}<a class="float" data-track="whatsapp_click" data-destination="whatsapp" aria-label="${esc(T[l].whatsapp)}" href="${wa(l,'general')}" rel="noopener">WA</a></body></html>`;


const localized=(l,values)=>values[l]||values.en||values.fr;
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
    '@context':'https://schema.org','@type':'Organization',name:'BADAWI',url:ORIGIN,
    logo:`${ORIGIN}/favicon.svg`,contactPoint:{'@type':'ContactPoint',telephone:RETAILER_INFO.phoneDisplay,contactType:'customer support'}
  };
  return page(l,`BADAWI — ${t.hero}`,t.intro,'',
    `<section class="hero"><div class="hero-bg">${responsive(FOOD[2],t.hero,'',true)}</div><div class="shade"></div><div class="shell hero-copy">${eyebrow('BADAWI')}<h1>${esc(t.hero)}</h1><p>${esc(t.intro)}</p><div class="actions">${trackedBtn(p(l,'products/bf65inoxp/'),t.discover,'product_discovery','BF65INOXP','primary','data-product="BF65INOXP"')}${trackedBtn(p(l,'where-to-buy/'),t.buy,'where_to_buy_opened','where-to-buy','ghost')}</div></div></section>
    ${trustStrip(l)}
    <section class="section"><div class="shell split"><div class="product-card">${responsive(PRODUCT_DATA.media.product[1],'BADAWI BF65INOXP','',false,'(max-width:900px) 100vw, 55vw')}</div><div>${eyebrow(t.flag)}<h2>BF65INOXP</h2><p class="lede">${esc(t.flagText)}</p><div class="chips"><span>BF65INOXP</span><span>65 cm</span><span>INOX</span></div>${trackedBtn(p(l,'products/bf65inoxp/'),t.discover,'product_discovery','BF65INOXP','dark','data-product="BF65INOXP"')}</div></div></section>
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
    <section class="section"><div class="shell"><div class="catalog-grid">${PRODUCTS.map(product=>`<article class="catalog-card"><a href="${p(l,`products/${product.slug}/`)}" data-track="product_discovery" data-product="${esc(product.model)}">${responsive(product.media.product[0],`BADAWI ${product.model}`,'',false,'(max-width:620px) 100vw, 33vw')}</a><div><span class="eyebrow">BADAWI</span><h2>${esc(product.model)}</h2><p>${esc(t.productLead)}</p><div class="chips"><span>${esc(product.widthLabel)}</span><span>${esc(product.finish)}</span></div>${trackedBtn(p(l,`products/${product.slug}/`),t.discover,'product_discovery',product.model,'dark',`data-product="${esc(product.model)}"`)}</div></article>`).join('')}</div></div></section>`,0
  );
}

function product(l){
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
    warranty:l==='ar'?'الضمان':l==='en'?'Warranty':'Garantie',
    installation:l==='ar'?'التركيب':l==='en'?'Installation':'Installation',
    dimensions:l==='ar'?'الأبعاد':l==='en'?'Dimensions':'Dimensions',
    weight:l==='ar'?'الوزن الصافي':l==='en'?'Net weight':'Poids net'
  };
  return page(l,t.productTitle,t.productLead,'products/bf65inoxp/',
    `<section class="product-hero"><div class="shell product-grid">
      <div class="gallery" data-gallery><div class="main">${responsive(media[0],'BADAWI BF65INOXP','gallery-current',true,'(max-width:900px) 100vw, 58vw')}</div>
      ${media.map((item,i)=>`<button type="button" data-thumb="${i}" aria-label="${esc((l==='ar'?'عرض صورة':l==='en'?'Show image':'Afficher l’image')+' '+(i+1))}">${responsive(item,`BF65INOXP ${i+1}`,'',false,'90px')}</button>`).join('')}</div>
      <div class="product-info">${breadcrumb(l,[{label:'BADAWI',url:p(l)},{label:t.nav[0],url:p(l,'products/')},{label:'BF65INOXP'}])}${eyebrow('BADAWI · BF65INOXP')}<h1>BF65INOXP</h1><h2>${esc(t.hero)}</h2><p>${esc(t.productLead)}</p>
      <div class="live live-card" data-retailer-live><div><small>${esc(t.price)}</small><b data-price>—</b><span class="currency-hint">${esc(t.currencyHint)}</span></div><div><small>${esc(t.stock)}</small><b data-stock>—</b></div></div>
      <div class="actions vertical">${trackedBtn(RETAILER,t.retailer,'digitronics_click','Digitronics','primary','data-product="BF65INOXP" rel="noopener"')}${trackedBtn(wa(l,'product'),t.whatsapp,'whatsapp_click','whatsapp','dark','data-product="BF65INOXP" rel="noopener"')}</div></div>
    </div></section>
    ${trustStrip(l)}
    <section class="section"><div class="shell">${eyebrow(t.verified)}<h2>${esc(t.details)}</h2><div class="details">
      <article><span>01</span><h3>${esc(facts.finishTitle)}</h3><p>${esc(facts.finishText)}</p></article>
      <article><span>02</span><h3>${esc(facts.doorsTitle)}</h3><p>${esc(facts.doorsText)}</p></article>
      <article><span>03</span><h3>${esc(facts.controlsTitle)}</h3><p>${esc(facts.controlsText)}</p></article>
    </div></div></section>
    <section class="section video"><div class="shell"><video data-track-video controls playsinline preload="metadata" poster="${FOOD[2]}"><source src="${VIDEO}" type="video/mp4"><p>${l==='ar'?'تعذر تشغيل الفيديو.':l==='en'?'Video playback is unavailable.':'La vidéo ne peut pas être lue.'}</p></video></div></section>
    <section class="section dark"><div class="shell split"><div><h2>${esc(t.verified)}</h2><p class="lede light">${esc(t.specNote)}</p>${btn(p(l,'support/guides/before-installation/'),GUIDES[2].title[l],'ghost')}</div>
      <dl class="specs"><div><dt>${esc(labels.model)}</dt><dd>BF65INOXP</dd></div><div><dt>${esc(labels.type)}</dt><dd>${esc(PRODUCT_DATA.verifiedFacts.type[l])}</dd></div><div><dt>${esc(labels.finish)}</dt><dd>Inox</dd></div><div><dt>${esc(labels.doors)}</dt><dd>${esc(PRODUCT_DATA.verifiedFacts.doors[l])}</dd></div><div><dt>${esc(labels.warranty)}</dt><dd>${l==='ar'?'سنة واحدة':l==='en'?'1 year':'1 an'}</dd></div><div><dt>${esc(labels.installation)}</dt><dd>${l==='ar'?'غير مشمول':l==='en'?'Not included':'Non incluse'}</dd></div></dl>
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
      <article><span>01</span><h2>${esc(sc.warrantyTitle)}</h2><p>${esc(sc.warrantyText)}</p></article>
      <article><span>02</span><h2>${esc(sc.documentsTitle)}</h2><p>${esc(sc.documentsText)}</p></article>
      <article><span>03</span><h2>${esc(sc.guidesTitle)}</h2><p>${esc(sc.guidesText)}</p></article>
      <article><span>04</span><h2>${esc(t.register)}</h2>${btn(p(l,'support/register/'),t.register,'text')}</article>
      <article><span>05</span><h2>${esc(t.request)}</h2>${btn(p(l,'support/request/'),t.request,'text')}</article>
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
      <div><div class="live live-card" data-retailer-live><div><small>${esc(t.price)}</small><b data-price>—</b><span class="currency-hint">${esc(t.currencyHint)}</span></div><div><small>${esc(t.stock)}</small><b data-stock>—</b></div></div><div class="actions vertical">${trackedBtn(RETAILER,t.retailer,'digitronics_click','Digitronics','dark','data-product="BF65INOXP" rel="noopener"')}${trackedBtn(wa(l,'product'),t.whatsapp,'whatsapp_click','whatsapp','ghost','data-product="BF65INOXP" rel="noopener"')}</div></div>
    </div></section>`,4
  );
}

const field=(label,name,type='text',extra='')=>`<label><span>${esc(label)}</span><input name="${name}" type="${type}" ${extra}></label>`;
const textarea=(label,name)=>`<label class="full"><span>${esc(label)}</span><textarea name="${name}" rows="5" required maxlength="3000"></textarea></label>`;
const select=(label,name,options,extra='')=>`<label><span>${esc(label)}</span><select name="${name}" ${extra}>${options.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select></label>`;
function formPage(l,type,title,lead,fields,current=5){
  const t=T[l];
  const path=type==='contact'?'contact/':type==='professionals'?'professionals/':`support/${type==='registration'?'register':'request'}/`;
  return page(l,`${title} — BADAWI`,lead,path,
    `<section class="page-hero warm"><div class="shell">${breadcrumb(l,[{label:'BADAWI',url:p(l)},...(type==='registration'||type==='support'?[{label:t.nav[2],url:p(l,'support/')}]:[]),{label:title}])}<h1>${esc(title)}</h1><p>${esc(lead)}</p></div></section>
    <section class="section"><div class="shell form-layout"><form data-api-form="${type}" data-success-prefix="${esc(t.formSuccess)}" data-error-message="${esc(t.formError)}" enctype="multipart/form-data"><input type="hidden" name="locale" value="${l}"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="started_at" value="">${fields}<label class="consent"><input type="checkbox" name="privacy_consent" value="1" required><span>${esc(t.labels.privacyConsent)} <a class="inline-link" href="${p(l,'privacy/')}" target="_blank" rel="noopener">${esc(t.privacy)}</a></span></label><button class="btn dark" type="submit">${esc(t.send)} <span aria-hidden="true">↗</span></button><p data-form-status role="status" aria-live="polite"></p></form><aside><h2>WhatsApp</h2>${trackedBtn(wa(l,'general'),'WhatsApp','whatsapp_click','support-whatsapp','dark','rel="noopener"')}<p>${esc(RETAILER_INFO.phoneDisplay)}</p><p class="muted">${esc(t.supportText)}</p></aside></div></section>`,
    current
  );
}
function registration(l){
  const t=T[l],x=t.labels;
  const fields=field(x.firstName,'first_name','text','required autocomplete="given-name" maxlength="80"')+
    field(x.lastName,'last_name','text','required autocomplete="family-name" maxlength="80"')+
    field(x.phone,'phone','tel','required autocomplete="tel" inputmode="tel" maxlength="30"')+
    field(x.email,'email','email','autocomplete="email" maxlength="160"')+
    field(x.model,'model','text','required value="BF65INOXP" readonly')+
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
  const fields=field(x.name,'name','text','required autocomplete="name" maxlength="120"')+
    field(x.phone,'phone','tel','required autocomplete="tel" inputmode="tel" maxlength="30"')+
    field(x.email,'email','email','autocomplete="email" maxlength="160"')+
    field(x.model,'model','text','required value="BF65INOXP" readonly')+
    field(x.serial,'serial_number','text','maxlength="100"')+
    select(x.category,'category',[[ 'product',x.productInfo],['warranty',x.warranty],['installation',x.installation],['order',x.order],['other',x.other]],'required')+
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
      ['Conservation et sécurité','Les événements techniques sont supprimés automatiquement après environ 13 mois. Les dossiers d’assistance et d’enregistrement sont conservés aussi longtemps que nécessaire pour le service, la garantie et les obligations applicables. Les pièces jointes sont stockées dans un espace privé.'],
      ['Vos demandes','Pour une question relative à vos données, utilisez la page Contact en indiquant clairement l’objet de votre demande.']
    ],
    en:[
      ['Data we collect','When you contact us, request support or register a product, we collect the information you provide in the form. Proof of purchase and support photos are stored privately when attached.'],
      ['Why we use it','We use this data to process requests, register products and provide support. Marketing messages are only sent when you separately choose to receive them.'],
      ['Conversion measurement','The site records limited first-party functional events, such as a retailer click or successful form submission. Raw IP addresses are not stored in these event records and this internal measurement does not use advertising cookies.'],
      ['Retention and security','Technical event records are automatically removed after approximately 13 months. Support and registration records are kept as long as reasonably necessary for service, warranty and applicable obligations. Attachments are stored privately.'],
      ['Your requests','For a data-related request, use the Contact page and clearly state the purpose of your request.']
    ],
    ar:[
      ['البيانات التي نجمعها','عند التواصل معنا أو طلب الدعم أو تسجيل منتج، نجمع المعلومات التي تدخلها في النموذج. تحفظ إثباتات الشراء وصور الدعم في مساحة تخزين خاصة عند إرفاقها.'],
      ['لماذا نستخدمها','نستخدم البيانات لمعالجة الطلبات وتسجيل المنتجات وتقديم الدعم. لا ترسل رسائل تسويقية إلا إذا اخترت بشكل منفصل تلقيها.'],
      ['قياس التحويلات','يسجل الموقع أحداثاً وظيفية محدودة مثل الضغط على رابط البائع أو إتمام نموذج بنجاح. لا نخزن عنوان IP الخام ضمن سجلات هذه الأحداث ولا نستخدم ملفات تعريف ارتباط إعلانية لهذا القياس الداخلي.'],
      ['الاحتفاظ والأمان','تحذف سجلات الأحداث التقنية تلقائياً بعد نحو 13 شهراً. تحفظ سجلات الدعم والتسجيل للمدة اللازمة للخدمة والضمان والالتزامات المطبقة. تحفظ المرفقات بشكل خاص.'],
      ['طلباتك','لطلب متعلق ببياناتك استخدم صفحة الاتصال واشرح موضوع الطلب بوضوح.']
    ]
  };
  const legal={
    fr:[
      ['Éditeur','BADAWI est une marque présentée depuis Casablanca, Maroc. Le site officiel badawifour.com fournit des informations de marque, produit et assistance.'],
      ['Vente et paiement','Les achats actuellement proposés via le site sont redirigés vers Digitronics, qui confirme le prix, le stock, la livraison et les conditions de commande. BADAWI ne traite pas directement le paiement sur ce site.'],
      ['Informations produit','Nous publions uniquement les caractéristiques que nous pouvons vérifier. Les dimensions produit 65 × 55 × 55 cm et le poids net de 12 kg sont documentés. Les dégagements d’installation, exigences de raccordement et autres données non validées doivent être confirmés avant installation.'],
      ['Garantie et installation','Le BF65INOXP est présenté avec une garantie constructeur de 1 an. L’installation n’est pas incluse. Les conditions applicables sont confirmées lors de l’achat.']
    ],
    en:[
      ['Publisher','BADAWI is a brand presented from Casablanca, Morocco. The official badawifour.com site provides brand, product and support information.'],
      ['Sales and payment','Purchases currently offered through this site are handed off to Digitronics, which confirms price, stock, delivery and order terms. BADAWI does not directly process payment on this site.'],
      ['Product information','We publish product characteristics only when they can be verified. Product dimensions of 65 × 55 × 55 cm and a 12 kg net weight are documented. Installation clearances, connection requirements and other unvalidated technical data must be confirmed before installation.'],
      ['Warranty and installation','BF65INOXP is presented with a 1-year manufacturer warranty. Installation is not included. Applicable conditions are confirmed when purchasing.']
    ],
    ar:[
      ['الناشر','BADAWI علامة تقدم من الدار البيضاء، المغرب. يوفر الموقع الرسمي badawifour.com معلومات عن العلامة والمنتج والدعم.'],
      ['البيع والدفع','عمليات الشراء المعروضة حالياً عبر الموقع تنتقل إلى Digitronics الذي يؤكد السعر والمخزون والتوصيل وشروط الطلب. لا يعالج موقع BADAWI الدفع مباشرة.'],
      ['معلومات المنتج','ننشر مواصفات المنتج فقط عندما نستطيع التحقق منها. أبعاد المنتج الموثقة هي 65 × 55 × 55 سم والوزن الصافي 12 كغ. يجب تأكيد مسافات التركيب ومتطلبات التوصيل وأي بيانات تقنية غير موثقة قبل التركيب.'],
      ['الضمان والتركيب','يعرض BF65INOXP بضمان مصنع لمدة سنة واحدة. التركيب غير مشمول. يتم تأكيد الشروط المطبقة عند الشراء.']
    ]
  };
  const sections=(key==='privacy'?privacy:legal)[l];
  return page(l,`${title} — BADAWI`,sections[0][1],path,
    `<section class="page-hero warm"><div class="shell"><h1>${esc(title)}</h1><p>${esc(sections[0][1])}</p></div></section><section class="section"><div class="shell prose legal-copy">${sections.map(([h,b])=>`<section><h2>${esc(h)}</h2><p>${esc(b)}</p></section>`).join('')}<p class="muted">${l==='ar'?'آخر تحديث: '+BUILD_DATE:l==='en'?'Last updated: '+BUILD_DATE:'Dernière mise à jour : '+BUILD_DATE}</p></div></section>`
  );
}

function guidePage(l,guide){
  const t=T[l];
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:guide.title[l],description:guide.description[l],inLanguage:l,author:{'@type':'Organization',name:'BADAWI'},publisher:{'@type':'Organization',name:'BADAWI'},dateModified:BUILD_DATE,mainEntityOfPage:absolute(l,`support/guides/${guide.slug}/`)});
  return page(l,`${guide.title[l]} — BADAWI`,guide.description[l],`support/guides/${guide.slug}/`,
    `<article class="article-page"><section class="page-hero warm"><div class="shell">${breadcrumb(l,[{label:'BADAWI',url:p(l)},{label:t.nav[2],url:p(l,'support/')},{label:guide.title[l]}])}${eyebrow(t.guideTitle)}<h1>${esc(guide.title[l])}</h1><p>${esc(guide.description[l])}</p></div></section><section class="section"><div class="shell prose article-body">${guide.sections[l].map(([h,b],index)=>`<section><span class="eyebrow">0${index+1}</span><h2>${esc(h)}</h2><p>${esc(b)}</p></section>`).join('')}<div class="article-cta">${btn(p(l,'support/'),t.backToSupport,'dark')}${btn(p(l,'support/request/'),t.request,'ghost')}</div></div></section></article>`,2,schema
  );
}

const CSS=await readFile(new URL('../src/site.css',import.meta.url),'utf8');
const JS=await readFile(new URL('../src/site.js',import.meta.url),'utf8');

async function write(rel,data){
  const file=join(OUT,rel);
  await mkdir(dirname(file),{recursive:true});
  await writeFile(file,data);
}

await rm(OUT,{recursive:true,force:true});
await mkdir(OUT,{recursive:true});
await write('assets/site.css',CSS);
await write('assets/site.js',JS);

const localizedRoutes=[
  '',
  'products/',
  'products/bf65inoxp/',
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
  await write(`${l}/products/bf65inoxp/index.html`,product(l));
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

await write('index.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/fr/"><link rel="canonical" href="https://badawifour.com/fr/"><title>BADAWI</title></head><body><a href="/fr/">BADAWI</a></body></html>');
await write('404.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="stylesheet" href="/assets/site.css"><title>404 — BADAWI</title></head><body><main id="main"><section class="page-hero dark"><div class="shell"><p class="eyebrow">BADAWI</p><h1>404</h1><p>Page introuvable · Page not found · الصفحة غير موجودة</p><a class="btn primary" href="/fr/">BADAWI <span aria-hidden="true">↗</span></a></div></section></main></body></html>');

await write('favicon.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#171817"/><path d="M34 5c4 15-8 20 2 31 2-10 10-13 12-22 12 14 15 29 8 40-5 8-13 12-24 12C16 66 5 55 5 40 5 24 19 16 34 5Z" fill="#c63c31"/><path d="M32 32c5 7 6 12 3 18-2 4-6 6-11 6-7 0-12-5-12-12 0-8 7-13 13-19-2 7 0 11 5 14 0-3 1-5 2-7Z" fill="#fff" opacity=".9"/></svg>`);
await write('manifest.webmanifest',JSON.stringify({
  name:'BADAWI',
  short_name:'BADAWI',
  description:'BADAWI — La cuisine qui rassemble.',
  start_url:'/fr/',
  scope:'/',
  display:'standalone',
  background_color:'#fffdfa',
  theme_color:'#171817',
  icons:[{src:'/favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]
},null,2));

const urls=LANGS.flatMap(l=>localizedRoutes.map(route=>absolute(l,route)));
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${url}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await write('robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${ORIGIN}/sitemap.xml\n`);
await write('llms.txt',`# BADAWI\n\nOfficial BADAWI appliance brand website: ${ORIGIN}\n\n## Current verified product\n- BF65INOXP: 65 cm gas oven, inox finish, two glazed front doors.\n- Manufacturer warranty: 1 year.\n- Installation is not included.\n- Verified physical data: 65 × 55 × 55 cm; net weight 12 kg. Exact gas connection, capacity and other unverified technical characteristics are intentionally not claimed until validated.\n\n## Languages\n- French: ${ORIGIN}/fr/\n- Arabic: ${ORIGIN}/ar/\n- English: ${ORIGIN}/en/\n\n## Support\n- Product registration and support are available under each language's /support/ section.\n- Current retailer: Digitronics.\n`);
await write('.well-known/security.txt',`Contact: ${ORIGIN}/en/contact/\nCanonical: ${ORIGIN}/.well-known/security.txt\nExpires: 2027-09-19T00:00:00Z\nPreferred-Languages: en, fr, ar\nPolicy: ${ORIGIN}/en/privacy/\n`);
await write('_headers',`/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; img-src 'self' https://digitronics.ma data:; media-src 'self' https://digitronics.ma; connect-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me https://digitronics.ma; upgrade-insecure-requests

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/favicon.svg
  Cache-Control: public, max-age=86400

/manifest.webmanifest
  Cache-Control: public, max-age=3600
`);

console.log(`Built ${urls.length} localized pages with ${GUIDES.length} guides`);
