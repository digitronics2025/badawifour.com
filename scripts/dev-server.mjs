import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  const pathname=decodeURIComponent((req.url||'/').split('?')[0]);
  if(pathname.startsWith('/api/')){
    res.setHeader('content-type','application/json; charset=utf-8');
    if(req.method==='GET'&&/^\/api\/retailer\/(?:bf65inoxp|bf65cinox)$/.test(pathname)){
      const slug=pathname.split('/').pop();
      res.writeHead(200);
      return res.end(JSON.stringify({
        model:slug==='bf65cinox'?'BF65CINOX':'BF65INOXP',slug,price:null,currency:'MAD',
        availability:'unknown',in_stock:null,source:'Digitronics',checked_at:new Date().toISOString()
      }));
    }
    if(req.method==='POST'&&pathname==='/api/event'){
      res.writeHead(202);
      return res.end(JSON.stringify({ok:true}));
    }
    res.writeHead(503);
    return res.end(JSON.stringify({error:'API available in Cloudflare Worker runtime'}));
  }
  let file=normalize(join(root,pathname));
  if(!file.startsWith(root)){
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try{
    const details=await stat(file);
    if(details.isDirectory()) file=join(file,'index.html');
    const data=await readFile(file);
    res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  }catch{
    try{
      const data=await readFile(join(root,'404.html'));
      res.writeHead(404,{'content-type':'text/html; charset=utf-8'});
      res.end(data);
    }catch{
      res.writeHead(404);
      res.end('Not found');
    }
  }
});
server.listen(8788,'127.0.0.1',()=>console.log('BADAWI dev server: http://127.0.0.1:8788/fr/'));
