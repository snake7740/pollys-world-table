import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const port=43551;
const child=spawn(process.execPath,['scripts/server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port)},stdio:'pipe'});
const url='http://127.0.0.1:'+port;
try{
 let ok=false;for(let i=0;i<40;i++){try{const r=await fetch(url+'/');if(r.status===200){ok=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,80));}
 if(!ok)throw Error('HTTP server failed to start');
 const good=['/','/index.html','/src/main.mjs','/src/market.mjs','/src/web3.mjs','/src/styles.css','/public/assets/polly/stand-lagoon.webp','/public/assets/foods/apple.webp'];
 const bad=['/.env','/.env.example','/contracts/PollyFeedMarket.sol','/scripts/server.mjs','/package.json','/../package.json'];
 for(const p of good){const r=await fetch(url+p);if(r.status!==200)throw Error('Expected 200: '+p+' '+r.status);}
 for(const p of bad){const r=await fetch(url+p);if(r.status!==404)throw Error('Expected 404: '+p+' '+r.status);}
 console.log('HTTP smoke OK: '+good.length+' public and '+bad.length+' forbidden paths');
}finally{child.kill();}
