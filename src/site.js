const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const locale=document.documentElement.lang||'fr';

const copy={
  fr:{fallback:'Voir chez Digitronics',in:'En stock',out:'Vérifier',success:'Merci. Référence : ',error:'Envoi impossible pour le moment. Vous pouvez nous contacter sur WhatsApp.'},
  ar:{fallback:'شاهد لدى Digitronics',in:'متوفر',out:'تحقق',success:'شكراً. المرجع: ',error:'تعذر الإرسال حالياً. يمكنك التواصل معنا عبر واتساب.'},
  en:{fallback:'See at Digitronics',in:'In stock',out:'Check',success:'Thank you. Reference: ',error:'Unable to send right now. You can contact us on WhatsApp.'}
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
      track('gallery_interaction',{product:'BF65INOXP',destination:String(index+1)});
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

$$('[data-api-form]').forEach((form)=>{
  const started=$('input[name="started_at"]',form);
  if(started)started.value=String(Date.now());
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const status=$('[data-form-status]',form);
    const button=$('button[type=submit]',form);
    if(button)button.disabled=true;
    if(status)status.textContent='';
    try{
      const response=await fetch('/api/'+form.dataset.apiForm,{method:'POST',body:new FormData(form),headers:{accept:'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'submit_failed');
      if(status)status.textContent=(form.dataset.successPrefix||copy.success)+(data.reference||'');
      const type=form.dataset.apiForm;
      if(type==='registration')track('registration_completed',{product:'BF65INOXP'});
      else if(type==='support')track('support_completed',{product:'BF65INOXP'});
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

const live=$('[data-retailer-live]');
if(live){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  fetch('/api/retailer/bf65inoxp',{signal:controller.signal})
    .then((response)=>response.ok?response.json():Promise.reject())
    .then((data)=>{
      const price=$('[data-price]',live),stock=$('[data-stock]',live);
      if(price)price.textContent=data.price?new Intl.NumberFormat(locale==='ar'?'ar-MA':locale==='en'?'en-MA':'fr-MA',{maximumFractionDigits:2}).format(data.price)+' '+(data.currency||'MAD'):copy.fallback;
      if(stock)stock.textContent=data.in_stock===true?copy.in:data.in_stock===false?copy.out:'—';
    })
    .catch(()=>{})
    .finally(()=>clearTimeout(timer));
}
