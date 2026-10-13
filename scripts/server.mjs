import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const port=Number(process.env.PORT)||4173;
createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent((req.url||'/').split('?')[0]);
  const safe=path==='/'||path==='/index.html'||path==='/config.js'||
    /^\/src\/(?:main|market|game|web3|keccak)\.mjs$/.test(path)||path==='/src/styles.css'||
    /^\/public\/assets\/[a-z0-9_\-/]+\.(?:webp|png)$/.test(path);
  if(!safe)throw Error('Denied');
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep))throw Error('Denied');
  if(!(await stat(file)).isFile())throw Error('Denied');
  const data=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(data);
 }catch{res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Polly Feed & Trade Lab at http://localhost:${port}`));
