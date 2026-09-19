import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('../dist/', import.meta.url).pathname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{let p=decodeURIComponent((req.url||'/').split('?')[0]); if(p.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end(JSON.stringify({error:'API available in Cloudflare Worker runtime'}));} let file=normalize(join(root,p)); if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden');} try{const s=await stat(file); if(s.isDirectory()) file=join(file,'index.html'); const data=await readFile(file); res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);}catch{try{const data=await readFile(join(root,'404.html'));res.writeHead(404,{'content-type':'text/html; charset=utf-8'});res.end(data);}catch{res.writeHead(404);res.end('Not found')}}});
server.listen(8788,'127.0.0.1',()=>console.log('BADAWI dev server: http://127.0.0.1:8788/fr/'));
