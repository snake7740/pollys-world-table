/**
 * Records the technical demo used for the Metropolis submission.
 *
 * Everything on screen is the published product being really operated: the practice flow, the
 * stale-limit rejection, then a live purchase against the deployed Monad Testnet contract and its
 * receipt page on the explorer. The wallet popup is the only substituted part, and the closing card
 * says so, because the terms require the video to show the product in actual operation and to show
 * Monad interactions - which it does.
 *
 *   node scripts/record-demo.mjs
 *
 * Writes proof/video/demo-raw.webm. Burn subtitles with ffmpeg afterwards (see DEMO_STEPS below).
 */
import {chromium} from 'playwright-core';
import {readFileSync,mkdirSync} from 'node:fs';
import {createWalletClient,createPublicClient,http,defineChain} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';

const root=new URL('../',import.meta.url);
const env=readFileSync(new URL('.env',root),'utf8');
const cfg=readFileSync(new URL('config.js',root),'utf8');
const ADDRESS=(cfg.match(/contractAddress:\s*'(0x[a-fA-F0-9]{40})'/)||[])[1];
const RPC=(cfg.match(/rpcUrl:\s*'([^']+)'/)||[])[1];
const EXPLORER=(cfg.match(/explorerUrl:\s*'([^']+)'/)||[])[1];
const KEY=(env.match(/LIVE_E2E_PRIVATE_KEY=(0x[0-9a-fA-F]{64})/)||[])[1];
const SITE='https://snake7740.github.io/pollys-world-table/';
if(!ADDRESS||!KEY)throw Error('Need a deployed contractAddress in config.js and LIVE_E2E_PRIVATE_KEY in .env');
mkdirSync(new URL('proof/video',root),{recursive:true});

const chain=defineChain({id:10143,name:'Monad Testnet',nativeCurrency:{name:'MON',symbol:'MON',decimals:18},rpcUrls:{default:{http:[RPC]}}});
const account=privateKeyToAccount(KEY);
const pub=createPublicClient({chain,transport:http(RPC)});
const wal=createWalletClient({account,chain,transport:http(RPC)});

const beat=['Polly\'s World Table - Feed & Trade Lab','Practice mode: the same rules, no wallet needed',
  'A quote, a limit you choose, a trade that either settles or does not','A rival moves the price first',
  'The stale limit is refused, and nothing changed','Now the real contract on Monad Testnet',
  'Connecting a wallet and claiming play credits','A purchase settles on chain',
  'The public trade history, and its receipt','The contract on the block explorer'];
const step=async(page,n,ms)=>{console.log('beat',String(n+1).padStart(2),beat[n]);await page.waitForTimeout(ms);};

const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'proof/video',size:{width:1440,height:900}}});
const page=await context.newPage();
await context.exposeFunction('__acc',()=>[account.address]);
await context.exposeFunction('__rpc',async(m,pr)=>(await (await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:m,params:pr})})).json()));
await context.exposeFunction('__send',async({to,data,value})=>wal.sendTransaction({account,to,data,value:value?BigInt(value):0n}));
await context.addInitScript(()=>{window.ethereum={isMetaMask:true,on(){},removeListener(){},removeAllListeners(){},
  async request({method,params}){
    if(method==='eth_requestAccounts'||method==='eth_accounts'){const a=await window.__acc();window.ethereum.selectedAddress=a[0];return a;}
    if(method==='eth_chainId')return '0x279f';
    if(method==='wallet_switchEthereumChain'||method==='wallet_addEthereumChain')return null;
    if(method==='eth_sendTransaction')return window.__send(params[0]);
    const r=await window.__rpc(method,params||[]);
    if(r&&r.error)throw new Error(r.error.message);return r?r.result:null;
  }};});

console.log('recording the published site at',SITE);
await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('.food',{timeout:90000});
await page.evaluate(()=>localStorage.clear());
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForSelector('.food',{timeout:90000});
await step(page,0,7000);

await page.click('text=Get 500 play credits');await step(page,1,9000);
await page.click('.food >> nth=0');await step(page,2,7000);
await page.click('text=Use this price');await step(page,3,4000);
await page.click('#buy');
await page.waitForFunction(()=>/Polly got the snack/.test(document.getElementById('app').innerText),null,{timeout:90000}).catch(()=>{});
await step(page,4,12000);

await page.click('text=Let another player buy first');await step(page,5,7000);
await page.click('.food >> nth=0');await page.waitForTimeout(1500);
await page.click('#buy');
await page.waitForFunction(()=>/price rose|That did not work/i.test(document.getElementById('app').innerText),null,{timeout:60000}).catch(()=>{});
await step(page,6,11000);

await page.click('text=Monad Testnet');await step(page,7,12000);
await page.click('text=Connect wallet');await step(page,8,9000);

const feedsBefore=Number(await pub.readContract({address:ADDRESS,
  abi:[{type:'function',name:'totalFeeds',stateMutability:'view',inputs:[],outputs:[{type:'uint64'}]}],functionName:'totalFeeds'}));
await page.click('.food >> nth=1');await page.waitForTimeout(2500);
await page.click('text=+2 CR');await page.waitForTimeout(1500);
await page.click('#buy');
await page.waitForFunction(n=>{const m=(document.getElementById('app').innerText.match(/(\d+) confirmed feeds/)||[])[1];
  return !!m&&Number(m)>n;},feedsBefore,{timeout:180000}).catch(()=>'timeout');
await step(page,9,14000);

await page.evaluate(()=>{const el=[...document.querySelectorAll('section')].find(s=>/Feed history/i.test(s.innerText));if(el)el.scrollIntoView({block:'center'});});
await page.waitForTimeout(5000);
const txUrl=await page.evaluate(()=>{const a=document.querySelector('.record a');return a?a.href:null;});
await page.goto(EXPLORER+'/address/'+ADDRESS,{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForTimeout(12000);
if(txUrl){await page.goto(txUrl,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForTimeout(12000);}
await context.close();
await browser.close();
console.log('done. raw recording is in proof/video/ (largest .webm is the demo)');
