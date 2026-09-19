const MAX_UPLOAD = 6 * 1024 * 1024;
const JSON_HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const EVENT_ALLOWLIST = new Set([
  'product_discovery','gallery_interaction','video_started','video_completed',
  'where_to_buy_opened','digitronics_click','whatsapp_click',
  'registration_started','registration_completed','support_started','support_completed',
  'professional_lead','contact_completed','guide_opened'
]);

const securityHeaders = {
  'strict-transport-security':'max-age=31536000; includeSubDomains; preload',
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy':'same-origin',
  'x-frame-options':'DENY',
  'content-security-policy':"default-src 'self'; img-src 'self' https://digitronics.ma data:; media-src 'self' https://digitronics.ma; connect-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me https://digitronics.ma; upgrade-insecure-requests"
};

function json(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...securityHeaders,...extra}});
}
function clean(value,max=300){
  return String(value??'').trim().replace(/[\u0000-\u001F\u007F]/g,' ').slice(0,max);
}
function required(value,max=300){
  const v=clean(value,max);
  if(!v) throw new Error('missing_required_field');
  return v;
}
function validateEmail(value){
  const v=clean(value,160);
  if(!v) return '';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new Error('invalid_email');
  return v;
}
function validatePhone(value,requiredField=true){
  const v=clean(value,30);
  if(!v&&!requiredField) return '';
  if(!v) throw new Error('missing_required_field');
  if((v.match(/\d/g)||[]).length<6) throw new Error('invalid_phone');
  return v;
}
function nowIso(){return new Date().toISOString()}
function id(prefix){return `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,8)}`.toUpperCase()}
function localeFrom(value){return ['fr','ar','en'].includes(value)?value:'fr'}
async function requireDb(env){if(!env.DB) throw new Error('database_not_configured');return env.DB}

async function hashText(text){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b)=>b.toString(16).padStart(2,'0')).join('');
}
async function rateKey(request,env,scope){
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const salt=env.RATE_LIMIT_SALT||'badawifour-rate-v1';
  return `${scope}:${(await hashText(`${salt}:${ip}`)).slice(0,40)}`;
}
async function rateLimit(request,env,scope,limit=8,windowMs=10*60*1000){
  if(!env.DB) return true;
  const key=await rateKey(request,env,scope);
  const now=Date.now();
  const windowStart=Math.floor(now/windowMs)*windowMs;
  const result=await env.DB.prepare(`
    INSERT INTO rate_limits (id,window_start,count,updated_at)
    VALUES (?,?,1,?)
    ON CONFLICT(id) DO UPDATE SET
      count=CASE WHEN rate_limits.window_start=? THEN rate_limits.count+1 ELSE 1 END,
      window_start=CASE WHEN rate_limits.window_start=? THEN rate_limits.window_start ELSE excluded.window_start END,
      updated_at=excluded.updated_at
    RETURNING count
  `).bind(key,windowStart,now,windowStart,windowStart).first();
  return Number(result?.count||1)<=limit;
}
function sameSite(request,env){
  const allowed=new Set([new URL(env.SITE_ORIGIN||'https://badawifour.com').origin,'https://www.badawifour.com']);
  const origin=request.headers.get('origin');
  if(origin) return allowed.has(origin);
  const referer=request.headers.get('referer');
  if(referer){
    try{return allowed.has(new URL(referer).origin)}catch{return false}
  }
  return false;
}
async function formData(request){
  const type=request.headers.get('content-type')||'';
  if(type.includes('multipart/form-data')||type.includes('application/x-www-form-urlencoded')) return request.formData();
  if(type.includes('application/json')){
    const obj=await request.json();
    const fd=new FormData();
    for(const [key,value] of Object.entries(obj||{}))fd.append(key,String(value??''));
    return fd;
  }
  throw new Error('unsupported_content_type');
}
function botCheck(fd){
  if(clean(fd.get('website'),200)) throw new Error('spam');
  const started=Number(fd.get('started_at')||0);
  if(!Number.isFinite(started)||started<=0) throw new Error('invalid_form_timing');
  const age=Date.now()-started;
  if(age<800) throw new Error('too_fast');
  if(age>24*60*60*1000) throw new Error('form_expired');
}
function privacyRequired(fd){
  if(!fd.get('privacy_consent')) throw new Error('privacy_consent_required');
}
function bytesStart(bytes,signature){
  return signature.every((value,index)=>bytes[index]===value);
}
async function detectFileType(file){
  if(!(file instanceof File)||file.size===0) return '';
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  if(bytesStart(bytes,[0xff,0xd8,0xff])) return 'image/jpeg';
  if(bytesStart(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) return 'image/png';
  if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP') return 'image/webp';
  if(bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-') return 'application/pdf';
  return '';
}
async function saveUpload(env,file,prefix,allowPdf=true){
  if(!(file instanceof File)||file.size===0) return '';
  if(!env.UPLOADS) throw new Error('uploads_not_configured');
  if(file.size>MAX_UPLOAD) throw new Error('file_too_large');
  const detected=await detectFileType(file);
  if(!detected||detected!==file.type||(!allowPdf&&detected==='application/pdf')) throw new Error('invalid_file_type');
  const ext=detected==='image/jpeg'?'jpg':detected==='image/png'?'png':detected==='image/webp'?'webp':'pdf';
  const key=`${prefix}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
  await env.UPLOADS.put(key,file.stream(),{
    httpMetadata:{contentType:detected},
    customMetadata:{source:'badawifour.com'}
  });
  return key;
}
async function safeDeleteUpload(env,key){
  if(key&&env.UPLOADS) try{await env.UPLOADS.delete(key)}catch{}
}
function sourcePath(request){
  try{return clean(new URL(request.headers.get('referer')||request.url).pathname,300)}catch{return ''}
}

async function registration(request,env){
  if(!await rateLimit(request,env,'registration',5)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request);botCheck(fd);privacyRequired(fd);const db=await requireDb(env);
  const row={
    ref:id('BAD-R'),created:nowIso(),locale:localeFrom(fd.get('locale')),
    first:required(fd.get('first_name'),80),last:required(fd.get('last_name'),80),
    phone:validatePhone(fd.get('phone')),email:validateEmail(fd.get('email')),
    model:required(fd.get('model'),50),serial:clean(fd.get('serial_number'),100),
    purchase:clean(fd.get('purchase_date'),20),retailer:clean(fd.get('retailer'),120),
    invoice:clean(fd.get('invoice_reference'),120),
    marketing:fd.get('marketing_consent')?1:0,source:sourcePath(request)
  };
  let receipt='';
  try{
    receipt=await saveUpload(env,fd.get('receipt'),'registrations',true);
    await db.prepare(`
      INSERT INTO registrations
      (id,created_at,locale,first_name,last_name,phone,email,model,serial_number,purchase_date,retailer,invoice_reference,receipt_key,marketing_consent,privacy_consent,source_path)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)
    `).bind(row.ref,row.created,row.locale,row.first,row.last,row.phone,row.email,row.model,row.serial,row.purchase,row.retailer,row.invoice,receipt,row.marketing,row.source).run();
  }catch(error){
    await safeDeleteUpload(env,receipt);
    throw error;
  }
  return json({ok:true,reference:row.ref},201);
}
async function support(request,env){
  if(!await rateLimit(request,env,'support',8)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request);botCheck(fd);privacyRequired(fd);const db=await requireDb(env);
  const row={
    ref:id('BAD-S'),locale:localeFrom(fd.get('locale')),name:required(fd.get('name'),120),
    phone:validatePhone(fd.get('phone')),email:validateEmail(fd.get('email')),
    model:required(fd.get('model'),50),serial:clean(fd.get('serial_number'),100),
    category:required(fd.get('category'),50),description:required(fd.get('description'),3000)
  };
  let attachment='';
  try{
    attachment=await saveUpload(env,fd.get('attachment'),'support',false);
    await db.prepare(`
      INSERT INTO support_requests
      (id,created_at,locale,name,phone,email,model,serial_number,category,description,attachment_key,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'open')
    `).bind(row.ref,nowIso(),row.locale,row.name,row.phone,row.email,row.model,row.serial,row.category,row.description,attachment).run();
  }catch(error){
    await safeDeleteUpload(env,attachment);
    throw error;
  }
  return json({ok:true,reference:row.ref},201);
}
async function professionals(request,env){
  if(!await rateLimit(request,env,'professionals',6)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request);botCheck(fd);privacyRequired(fd);const db=await requireDb(env);
  const ref=id('BAD-P');
  await db.prepare(`
    INSERT INTO professional_leads
    (id,created_at,locale,company,contact_name,country,phone,email,business_type,message,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,'new')
  `).bind(ref,nowIso(),localeFrom(fd.get('locale')),required(fd.get('company'),160),required(fd.get('contact_name'),120),clean(fd.get('country'),100),validatePhone(fd.get('phone')),validateEmail(fd.get('email')),required(fd.get('business_type'),50),required(fd.get('message'),3000)).run();
  return json({ok:true,reference:ref},201);
}
async function contact(request,env){
  if(!await rateLimit(request,env,'contact',8)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request);botCheck(fd);privacyRequired(fd);const db=await requireDb(env);
  const phone=validatePhone(fd.get('phone'),false);
  const mail=validateEmail(fd.get('email'));
  if(!phone&&!mail) throw new Error('contact_required');
  const ref=id('BAD-C');
  await db.prepare(`
    INSERT INTO contact_messages
    (id,created_at,locale,name,phone,email,subject,message,status)
    VALUES (?,?,?,?,?,?,?,?,'new')
  `).bind(ref,nowIso(),localeFrom(fd.get('locale')),required(fd.get('name'),120),phone,mail,required(fd.get('subject'),160),required(fd.get('message'),3000)).run();
  return json({ok:true,reference:ref},201);
}

function extractProduct(html){
  let price='';
  const jsonPrice=html.match(/"price"\s*:\s*"?([0-9]+(?:[.,][0-9]{1,2})?)"?/i);
  const metaPrice=html.match(/(?:itemprop|property)=["'](?:price|product:price:amount)["'][^>]*(?:content|value)=["']([0-9]+(?:[.,][0-9]{1,2})?)["']/i);
  const textPrice=html.match(/(?:>|\s)([0-9]{2,5}(?:[.,][0-9]{1,2})?)\s*(?:DH|MAD)(?:<|\s)/i);
  price=(jsonPrice||metaPrice||textPrice)?.[1]?.replace(',','.')||'';
  const inStock=/https?:\\?\/\\?\/schema\.org\\?\/InStock|"availability"\s*:\s*"?InStock"?|>\s*En stock\s*</i.test(html);
  const outStock=/https?:\\?\/\\?\/schema\.org\\?\/OutOfStock|"availability"\s*:\s*"?OutOfStock"?|>\s*Rupture/i.test(html);
  return {price:price?Number(price):null,currency:'MAD',in_stock:inStock?true:outStock?false:null};
}
async function fetchRetailerData(env){
  const url=env.RETAILER_PRODUCT_URL||'https://digitronics.ma/fr/produit/badawi-four-bf65inoxp-cuisinere-a-gaz-4-feux';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const res=await fetch(url,{headers:{'user-agent':'BADAWI/1.0 (+https://badawifour.com)','accept':'text/html'},signal:controller.signal});
    if(!res.ok) throw new Error(`retailer_${res.status}`);
    const data=extractProduct(await res.text());
    return {...data,url,source:'Digitronics',checked_at:nowIso()};
  }catch{
    return {price:null,currency:'MAD',in_stock:null,url,source:'Digitronics',checked_at:nowIso()};
  }finally{clearTimeout(timer)}
}
async function retailer(request,env){
  const cache=caches.default;
  const key=new Request('https://badawifour.com/__cache/retailer/bf65inoxp');
  const cached=await cache.match(key);
  if(cached) return cached;
  const data=await fetchRetailerData(env);
  const response=json(data,200,{'cache-control':'public, max-age=300, s-maxage=600'});
  await cache.put(key,response.clone());
  return response;
}
async function analyticsEvent(request,env){
  if(!await rateLimit(request,env,'event',90,60*1000)) return json({ok:true},202);
  const db=await requireDb(env);
  const body=await request.json().catch(()=>null);
  const event=clean(body?.event,60);
  if(!EVENT_ALLOWLIST.has(event)) return json({error:'invalid_event'},400);
  let referrerHost='';
  try{referrerHost=new URL(request.headers.get('referer')||'https://badawifour.com').hostname}catch{}
  const row={
    id:id('EVT'),created:nowIso(),event,locale:localeFrom(body?.locale),
    path:clean(body?.path,300)||'/',product:clean(body?.product,80),destination:clean(body?.destination,300),
    referrerHost:clean(referrerHost,160),utmSource:clean(body?.utm_source,120),
    utmMedium:clean(body?.utm_medium,120),utmCampaign:clean(body?.utm_campaign,160)
  };
  await db.prepare(`
    INSERT INTO analytics_events
    (id,created_at,event,locale,path,product,destination,referrer_host,utm_source,utm_medium,utm_campaign)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(row.id,row.created,row.event,row.locale,row.path,row.product,row.destination,row.referrerHost,row.utmSource,row.utmMedium,row.utmCampaign).run();
  return json({ok:true},202);
}

async function api(request,env,url){
  if(url.pathname==='/api/health'&&request.method==='GET') return json({
    ok:true,service:'badawifour-com',db_bound:Boolean(env.DB),uploads_bound:Boolean(env.UPLOADS),time:nowIso()
  });
  if(url.pathname==='/api/retailer/bf65inoxp'&&request.method==='GET') return retailer(request,env);
  if(request.method!=='POST') return json({error:'method_not_allowed'},405,{'allow':'GET, POST'});
  if(!sameSite(request,env)) return json({error:'origin_not_allowed'},403);
  try{
    if(url.pathname==='/api/registration') return registration(request,env);
    if(url.pathname==='/api/support') return support(request,env);
    if(url.pathname==='/api/professionals') return professionals(request,env);
    if(url.pathname==='/api/contact') return contact(request,env);
    if(url.pathname==='/api/event') return analyticsEvent(request,env);
    return json({error:'not_found'},404);
  }catch(error){
    const code=String(error?.message||'server_error');
    const client=new Set([
      'missing_required_field','privacy_consent_required','unsupported_content_type',
      'invalid_file_type','file_too_large','spam','too_fast','invalid_form_timing','form_expired',
      'invalid_email','invalid_phone','contact_required','invalid_event'
    ]);
    const config=new Set(['database_not_configured','uploads_not_configured']);
    if(client.has(code)) return json({error:code},400);
    if(config.has(code)) return json({error:code},503);
    console.error('api_error',code);
    return json({error:'server_error'},500);
  }
}

async function cleanup(env){
  if(!env.DB)return;
  const now=Date.now();
  const analyticsCutoff=new Date(now-395*24*60*60*1000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM rate_limits WHERE updated_at < ?').bind(now-2*24*60*60*1000),
    env.DB.prepare('DELETE FROM analytics_events WHERE created_at < ?').bind(analyticsCutoff)
  ]);
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.hostname.startsWith('www.')) return Response.redirect(`https://${url.hostname.slice(4)}${url.pathname}${url.search}`,301);
    if(url.pathname==='/') return Response.redirect(`${url.origin}/fr/`,302);
    if(url.pathname.startsWith('/api/')) return api(request,env,url);
    const response=await env.ASSETS.fetch(request);
    const headers=new Headers(response.headers);
    for(const [key,value] of Object.entries(securityHeaders))headers.set(key,value);
    if(url.pathname.startsWith('/assets/')) headers.set('cache-control','public, max-age=31536000, immutable');
    else if(response.headers.get('content-type')?.includes('text/html')) headers.set('cache-control','public, max-age=300, s-maxage=1800');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  },
  async scheduled(_event,env,ctx){
    ctx.waitUntil(cleanup(env));
  }
};

export {extractProduct,validateEmail,validatePhone,detectFileType};
