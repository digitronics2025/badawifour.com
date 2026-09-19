const MAX_UPLOAD = 6 * 1024 * 1024;
const ALLOWED_UPLOADS = new Set(['image/jpeg','image/png','image/webp','application/pdf']);
const JSON_HEADERS = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' };

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
function clean(value,max=300){ return String(value ?? '').trim().replace(/[\u0000-\u001F\u007F]/g,' ').slice(0,max); }
function email(value){ const v=clean(value,160); return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : ''; }
function required(value,max=300){ const v=clean(value,max); if(!v) throw new Error('missing_required_field'); return v; }
function nowIso(){ return new Date().toISOString(); }
function id(prefix){ return `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,8)}`.toUpperCase(); }
function localeFrom(v){ return ['fr','ar','en'].includes(v) ? v : 'fr'; }

async function rateKey(request, env){
  const ip=request.headers.get('CF-Connecting-IP') || 'unknown';
  const salt=env.RATE_LIMIT_SALT || 'badawifour-public-fallback';
  const data=new TextEncoder().encode(`${salt}:${ip}`);
  const hash=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
}
const volatileRate = new Map();
async function rateLimit(request,env,scope,limit=8,windowMs=10*60*1000){
  const key=`${scope}:${await rateKey(request,env)}`;
  const now=Date.now();
  const current=volatileRate.get(key) || {count:0,reset:now+windowMs};
  if(current.reset<now){current.count=0;current.reset=now+windowMs;}
  current.count++; volatileRate.set(key,current);
  return current.count<=limit;
}
function isSameOrigin(request, env){
  const origin=request.headers.get('origin');
  if(!origin) return true;
  const allowed = new Set([env.SITE_ORIGIN || 'https://badawifour.com','https://www.badawifour.com']);
  return allowed.has(origin);
}
async function formData(request){
  const type=request.headers.get('content-type')||'';
  if(type.includes('multipart/form-data') || type.includes('application/x-www-form-urlencoded')) return request.formData();
  if(type.includes('application/json')){ const obj=await request.json(); const fd=new FormData(); for(const [k,v] of Object.entries(obj||{})) fd.append(k,String(v??'')); return fd; }
  throw new Error('unsupported_content_type');
}
function botCheck(fd){
  if(clean(fd.get('website'),200)) throw new Error('spam');
  const started=Number(fd.get('started_at')||0);
  if(started && Date.now()-started < 900) throw new Error('too_fast');
}
async function saveUpload(env,file,prefix,allowPdf=true){
  if(!(file instanceof File) || file.size===0) return '';
  if(!env.UPLOADS) throw new Error('uploads_not_configured');
  if(file.size>MAX_UPLOAD) throw new Error('file_too_large');
  if(!ALLOWED_UPLOADS.has(file.type) || (!allowPdf && file.type==='application/pdf')) throw new Error('invalid_file_type');
  const ext = file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'pdf';
  const key=`${prefix}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
  await env.UPLOADS.put(key,file.stream(),{httpMetadata:{contentType:file.type},customMetadata:{source:'badawifour.com'}});
  return key;
}
async function requireDb(env){ if(!env.DB) throw new Error('database_not_configured'); return env.DB; }

async function registration(request,env){
  if(!await rateLimit(request,env,'registration',5)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request); botCheck(fd); const db=await requireDb(env);
  const ref=id('BAD-R');
  const receipt=await saveUpload(env,fd.get('receipt'),'registrations',true);
  const row={ref,created:nowIso(),locale:localeFrom(fd.get('locale')),first:required(fd.get('first_name'),80),last:required(fd.get('last_name'),80),phone:required(fd.get('phone'),30),email:email(fd.get('email')),model:required(fd.get('model'),50),serial:clean(fd.get('serial_number'),100),purchase:clean(fd.get('purchase_date'),20),retailer:clean(fd.get('retailer'),120),invoice:clean(fd.get('invoice_reference'),120),receipt,privacy:fd.get('privacy_consent')?'1':'0'};
  if(row.privacy!=='1') return json({error:'privacy_consent_required'},400);
  await db.prepare(`INSERT INTO registrations (id,created_at,locale,first_name,last_name,phone,email,model,serial_number,purchase_date,retailer,invoice_reference,receipt_key,privacy_consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`).bind(row.ref,row.created,row.locale,row.first,row.last,row.phone,row.email,row.model,row.serial,row.purchase,row.retailer,row.invoice,row.receipt).run();
  return json({ok:true,reference:ref},201);
}
async function support(request,env){
  if(!await rateLimit(request,env,'support',8)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request); botCheck(fd); const db=await requireDb(env);
  if(!fd.get('privacy_consent')) return json({error:'privacy_consent_required'},400);
  const ref=id('BAD-S');
  const attachment=await saveUpload(env,fd.get('attachment'),'support',false);
  await db.prepare(`INSERT INTO support_requests (id,created_at,locale,name,phone,email,model,serial_number,category,description,attachment_key,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'open')`).bind(ref,nowIso(),localeFrom(fd.get('locale')),required(fd.get('name'),120),required(fd.get('phone'),30),email(fd.get('email')),required(fd.get('model'),50),clean(fd.get('serial_number'),100),required(fd.get('category'),50),required(fd.get('description'),3000),attachment).run();
  return json({ok:true,reference:ref},201);
}
async function professionals(request,env){
  if(!await rateLimit(request,env,'professionals',6)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request); botCheck(fd); const db=await requireDb(env);
  if(!fd.get('privacy_consent')) return json({error:'privacy_consent_required'},400);
  const ref=id('BAD-P');
  await db.prepare(`INSERT INTO professional_leads (id,created_at,locale,company,contact_name,country,phone,email,business_type,message,status) VALUES (?,?,?,?,?,?,?,?,?,?,'new')`).bind(ref,nowIso(),localeFrom(fd.get('locale')),required(fd.get('company'),160),required(fd.get('contact_name'),120),clean(fd.get('country'),100),required(fd.get('phone'),30),email(fd.get('email')),required(fd.get('business_type'),50),required(fd.get('message'),3000)).run();
  return json({ok:true,reference:ref},201);
}
async function contact(request,env){
  if(!await rateLimit(request,env,'contact',8)) return json({error:'rate_limited'},429,{'retry-after':'600'});
  const fd=await formData(request); botCheck(fd); const db=await requireDb(env);
  if(!fd.get('privacy_consent')) return json({error:'privacy_consent_required'},400);
  const ref=id('BAD-C');
  await db.prepare(`INSERT INTO contact_messages (id,created_at,locale,name,phone,email,subject,message,status) VALUES (?,?,?,?,?,?,?,?,'new')`).bind(ref,nowIso(),localeFrom(fd.get('locale')),required(fd.get('name'),120),clean(fd.get('phone'),30),email(fd.get('email')),required(fd.get('subject'),160),required(fd.get('message'),3000)).run();
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
  return {price:price ? Number(price) : null,currency:'MAD',in_stock:inStock?true:outStock?false:null};
}
async function retailer(env){
  const url=env.RETAILER_PRODUCT_URL || 'https://digitronics.ma/fr/produit/badawi-four-bf65inoxp-cuisinere-a-gaz-4-feux';
  try{
    const res=await fetch(url,{headers:{'user-agent':'BADAWI/1.0 (+https://badawifour.com)','accept':'text/html'}});
    if(!res.ok) throw new Error(`retailer_${res.status}`);
    const html=await res.text();
    const data=extractProduct(html);
    return json({...data,url,source:'Digitronics',checked_at:nowIso()},200,{'cache-control':'public, max-age=300, s-maxage=600'});
  }catch{
    return json({price:null,currency:'MAD',in_stock:null,url,source:'Digitronics',checked_at:nowIso()},200,{'cache-control':'public, max-age=120, s-maxage=300'});
  }
}

async function api(request,env,url){
  if(!isSameOrigin(request,env) && request.method!=='GET') return json({error:'origin_not_allowed'},403);
  if(url.pathname==='/api/health') return json({ok:true,service:'badawifour-com',db_bound:Boolean(env.DB),uploads_bound:Boolean(env.UPLOADS),time:nowIso()});
  if(url.pathname==='/api/retailer/bf65inoxp' && request.method==='GET') return retailer(env);
  if(request.method!=='POST') return json({error:'method_not_allowed'},405,{'allow':'POST'});
  try{
    if(url.pathname==='/api/registration') return registration(request,env);
    if(url.pathname==='/api/support') return support(request,env);
    if(url.pathname==='/api/professionals') return professionals(request,env);
    if(url.pathname==='/api/contact') return contact(request,env);
    return json({error:'not_found'},404);
  }catch(err){
    const code=String(err?.message||'server_error');
    const client=new Set(['missing_required_field','privacy_consent_required','unsupported_content_type','invalid_file_type','file_too_large','spam','too_fast']);
    const config=new Set(['database_not_configured','uploads_not_configured']);
    if(client.has(code)) return json({error:code},400);
    if(config.has(code)) return json({error:code},503);
    console.error('api_error',code);
    return json({error:'server_error'},500);
  }
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.hostname.startsWith('www.')) return Response.redirect(`https://${url.hostname.slice(4)}${url.pathname}${url.search}`,301);
    if(url.pathname==='/') return Response.redirect(`${url.origin}/fr/`,302);
    if(url.pathname.startsWith('/api/')) return api(request,env,url);
    const response=await env.ASSETS.fetch(request);
    const headers=new Headers(response.headers);
    for(const [k,v] of Object.entries(securityHeaders)) headers.set(k,v);
    if(url.pathname.startsWith('/assets/')) headers.set('cache-control','public, max-age=31536000, immutable');
    else if(response.headers.get('content-type')?.includes('text/html')) headers.set('cache-control','public, max-age=300, s-maxage=1800');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
};

export { extractProduct };
