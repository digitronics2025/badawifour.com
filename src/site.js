document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const locale=document.documentElement.lang||'fr';

const copy={
  fr:{fallback:'Voir chez Digitronics',in:'En stock',order:'Sur commande',out:'Rupture de stock',unknown:'Vérifier',success:'Merci. Référence : ',error:'Envoi impossible pour le moment. Vous pouvez nous contacter sur WhatsApp.'},
  ar:{fallback:'شاهد لدى Digitronics',in:'متوفر',order:'متوفر بالطلب',out:'غير متوفر',unknown:'تحقق',success:'شكراً. المرجع: ',error:'تعذر الإرسال حالياً. يمكنك التواصل معنا عبر واتساب.'},
  en:{fallback:'See at Digitronics',in:'In stock',order:'Available to order',out:'Out of stock',unknown:'Check',success:'Thank you. Reference: ',error:'Unable to send right now. You can contact us on WhatsApp.'}
}[locale]||{};

const menuButton=$('.menu');
const mobile=$('#mobile');
function closeMenu(){
  if(!menuButton||!mobile)return;
  menuButton.setAttribute('aria-expanded','false');
  mobile.hidden=true;
}
if(menuButton&&mobile){
  menuButton.addEventListener('click',()=>{
    const open=menuButton.getAttribute('aria-expanded')==='true';
    menuButton.setAttribute('aria-expanded',String(!open));
    mobile.hidden=open;
  });
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeMenu()});
  $$('a',mobile).forEach((link)=>link.addEventListener('click',closeMenu));
}

const gallery=$('[data-gallery]');
if(gallery){
  const current=$('.gallery-current',gallery);
  $$('[data-thumb]',gallery).forEach((button,index)=>{
    button.setAttribute('aria-current',index===0?'true':'false');
    button.addEventListener('click',()=>{
      const image=$('img',button);
      if(!current||!image)return;
      current.src=image.currentSrc||image.src;
      current.srcset=image.srcset||'';
      current.alt=image.alt;
      $$('[data-thumb]',gallery).forEach((other)=>other.setAttribute('aria-current','false'));
      button.setAttribute('aria-current','true');
      track('gallery_interaction',{product:gallery.dataset.product||'',destination:String(index+1)});
    });
  });
}

async function track(event,extra={}){
  const allowed=['product_discovery','gallery_interaction','video_started','video_completed','where_to_buy_opened','digitronics_click','whatsapp_click','registration_started','registration_completed','support_started','support_completed','professional_lead','contact_completed','guide_opened'];
  if(!allowed.includes(event))return;
  try{
    const payload={
      event,
      locale,
      path:location.pathname,
      product:extra.product||'',
      destination:extra.destination||'',
      utm_source:new URLSearchParams(location.search).get('utm_source')||'',
      utm_medium:new URLSearchParams(location.search).get('utm_medium')||'',
      utm_campaign:new URLSearchParams(location.search).get('utm_campaign')||''
    };
    if(navigator.sendBeacon){
      const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
      if(navigator.sendBeacon('/api/event',blob))return;
    }
    await fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true});
  }catch{}
}

$$('[data-track]').forEach((element)=>{
  element.addEventListener('click',()=>track(element.dataset.track,{
    product:element.dataset.product||'',
    destination:element.dataset.destination||element.getAttribute('href')||'',
    guide:element.dataset.guide||''
  }));
});

const video=$('[data-track-video]');
if(video){
  let started=false,completed=false;
  video.addEventListener('play',()=>{if(!started){started=true;track('video_started',{product:'BF65INOXP'})}});
  video.addEventListener('ended',()=>{if(!completed){completed=true;track('video_completed',{product:'BF65INOXP'})}});
}

const homeVideo=$('[data-home-video]');
if(homeVideo){
  const source=$('source[data-src]',homeVideo);
  let videoObserver;
  const loadHomeVideo=()=>{
    if(!source||source.src)return;
    source.src=source.dataset.src||'';
    if(source.src)homeVideo.load();
    if(videoObserver)videoObserver.disconnect();
  };
  if('IntersectionObserver' in window){
    videoObserver=new IntersectionObserver((entries)=>{
      if(entries.some((entry)=>entry.isIntersecting))loadHomeVideo();
    },{rootMargin:'600px 0px'});
    videoObserver.observe(homeVideo);
  }else loadHomeVideo();
  homeVideo.addEventListener('pointerdown',loadHomeVideo,{once:true});
  homeVideo.addEventListener('focusin',loadHomeVideo,{once:true});
}

const homeSticky=$('[data-home-sticky]');
const homeHero=$('.home-hero');
const homeFinalOffer=$('[data-home-final-offer]');
if(homeSticky&&homeHero&&homeFinalOffer&&'IntersectionObserver' in window){
  let heroVisible=true,finalOfferVisible=false;
  const updateSticky=()=>{homeSticky.hidden=heroVisible||finalOfferVisible};
  const stickyObserver=new IntersectionObserver((entries)=>{
    for(const entry of entries){
      if(entry.target===homeHero)heroVisible=entry.isIntersecting;
      if(entry.target===homeFinalOffer)finalOfferVisible=entry.isIntersecting;
    }
    updateSticky();
  },{threshold:.05});
  stickyObserver.observe(homeHero);
  stickyObserver.observe(homeFinalOffer);
  updateSticky();
}

const homePage=$('.home-page');
const revealItems=homePage?$$(':scope > section.section',homePage):[];
if(homePage&&revealItems.length&&'IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const revealObserver=new IntersectionObserver((entries)=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  for(const item of revealItems)revealObserver.observe(item);
  requestAnimationFrame(()=>homePage.dataset.motionReady='true');
}

function initializeForms(){
  $$('[data-api-form]').forEach((form)=>{
  if(form.dataset.initialized==='true')return;
  form.dataset.initialized='true';
  const started=$('input[name="started_at"]',form);
  const initializeTiming=()=>{
    if(!started)return;
    if(!Number(started.value))started.value=String(Date.now());
    form.dataset.timingReady=String(Number(started.value)>0);
  };
  initializeTiming();
  window.addEventListener('pageshow',initializeTiming,{once:true});
  form.addEventListener('focusin',initializeTiming);
  form.addEventListener('pointerdown',initializeTiming);
  form.addEventListener('keydown',initializeTiming);
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const status=$('[data-form-status]',form);
    const button=$('button[type=submit]',form);
    if(button)button.disabled=true;
    if(status)status.textContent='';
    try{
      const payload=new FormData(form);
      const selectedModel=String(payload.get('model')||'');
      const response=await fetch('/api/'+form.dataset.apiForm,{method:'POST',body:payload,headers:{accept:'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'submit_failed');
      if(status)status.textContent=(form.dataset.successPrefix||copy.success)+(data.reference||'');
      const type=form.dataset.apiForm;
      if(type==='registration')track('registration_completed',{product:selectedModel});
      else if(type==='support')track('support_completed',{product:selectedModel});
      else if(type==='professionals')track('professional_lead');
      else if(type==='contact')track('contact_completed');
      form.reset();
      if(started)started.value=String(Date.now());
    }catch{
      if(status)status.textContent=form.dataset.errorMessage||copy.error;
    }finally{
      if(button)button.disabled=false;
    }
  });
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeForms,{once:true});
else initializeForms();

const liveCards=$$('[data-retailer-live]');
liveCards.forEach((live)=>{
  const slug=live.dataset.productSlug||'bf65inoxp';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  fetch('/api/retailer/'+encodeURIComponent(slug),{signal:controller.signal})
    .then((response)=>response.ok?response.json():Promise.reject())
    .then((data)=>{
      const price=$('[data-price]',live),stock=$('[data-stock]',live);
      if(price)price.textContent=data.price?new Intl.NumberFormat(locale==='ar'?'ar-MA':locale==='en'?'en-MA':'fr-MA',{maximumFractionDigits:2}).format(data.price)+' '+(data.currency||'MAD'):copy.fallback;
      if(stock)stock.textContent=data.availability==='in_stock'?copy.in:data.availability==='on_order'?copy.order:data.availability==='out_of_stock'?copy.out:copy.unknown;
    })
    .catch(()=>{})
    .finally(()=>clearTimeout(timer));
});
