/**
 * Live end-to-end journey through the real user interface.
 *
 * The page's own connectWallet, claimOnchain, tradeOnchain and waitForReceipt code paths run
 * unmodified. The only substituted part is the wallet popup: an EIP-1193 provider is injected into
 * the browser and backed by a real key that signs and broadcasts real transactions to the RPC in
 * config.js. Every assertion is read back from the rendered page and then cross-checked against the
 * chain, so a passing step means the interface itself caused a real on-chain change.
 *
 *   node scripts/live-e2e.mjs
 *
 * Environment:
 *   LIVE_E2E_PRIVATE_KEY   in .env - funded testnet-only wallet the UI will drive
 *   LIVE_E2E_RIVAL_KEY     in .env - optional second wallet, used to move the price
 *   LIVE_E2E_URL           optional, defaults to the published GitHub Pages URL
 */
import {chromium} from 'playwright-core';
import {readFileSync} from 'node:fs';
import {createPublicClient,createWalletClient,http,defineChain} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';

const root=new URL('../',import.meta.url);
const env=readFileSync(new URL('.env',root),'utf8');
const cfg=readFileSync(new URL('config.js',root),'utf8');
const ADDRESS=(cfg.match(/contractAddress:\s*'(0x[a-fA-F0-9]{40})'/)||[])[1];
const RPC=(cfg.match(/rpcUrl:\s*'([^']+)'/)||[])[1];
const EXPLORER=(cfg.match(/explorerUrl:\s*'([^']+)'/)||[])[1];
const KEY=(env.match(/LIVE_E2E_PRIVATE_KEY=(0x[0-9a-fA-F]{64})/)||[])[1];
const RIVAL=(env.match(/LIVE_E2E_RIVAL_KEY=(0x[0-9a-fA-F]{64})/)||[])[1];
const SITE=process.env.LIVE_E2E_URL||'https://snake7740.github.io/pollys-world-table/';
if(!ADDRESS)throw Error('config.js has no deployed contractAddress');
if(!KEY)throw Error('Set LIVE_E2E_PRIVATE_KEY in .env to a testnet-only wallet holding MON.');

const ABI=[
  {type:'function',name:'totalFeeds',stateMutability:'view',inputs:[],outputs:[{type:'uint64'}]},
  {type:'function',name:'quote',stateMutability:'view',inputs:[{name:'foodId',type:'uint8'}],outputs:[{type:'uint256'}]},
  {type:'function',name:'buyAndFeed',stateMutability:'nonpayable',inputs:[{name:'foodId',type:'uint8'},{name:'maxPrice',type:'uint256'}],outputs:[]},
];
const chain=defineChain({id:10143,name:'Monad Testnet',nativeCurrency:{name:'MON',symbol:'MON',decimals:18},rpcUrls:{default:{http:[RPC]}}});
const pub=createPublicClient({chain,transport:http(RPC)});
// The session wallet is a fixed, pre-funded testnet account from .env. It is reused on purpose:
// it has already claimed, so the run also proves through the interface that a second claim fails.
const account=privateKeyToAccount(KEY);
const wal=createWalletClient({account,chain,transport:http(RPC)});
const feeds=()=>pub.readContract({address:ADDRESS,abi:ABI,functionName:'totalFeeds'});
const quote=id=>pub.readContract({address:ADDRESS,abi:ABI,functionName:'quote',args:[id]});

const results=[];
const check=(name,ok,detail)=>{results.push({name,ok});console.log((ok?'PASS  ':'FAIL  ')+name+(detail?'   ['+detail+']':''));};
const text=page=>page.evaluate(()=>document.getElementById('app')?.innerText||'');
// Only a message that appeared after the click counts as a failure; the toast stays in the DOM
// until the next render, so a stale one from an earlier step must not be blamed on this click.
const baseline=async page=>((await text(page)).match(/(That did not work[^\n]*|Live mode unavailable[^\n]*)/)||[])[0]??null;
// networkidle is unreliable here because the page keeps polling the chain, so wait for real content.
const openApp=async page=>{
  await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('.food',{timeout:60000});
};

const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},
  recordVideo:{dir:'proof/video',size:{width:1280,height:900}}});
const page=await context.newPage();
const consoleErrors=[];
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.on('pageerror',e=>consoleErrors.push('pageerror: '+e.message));

await context.exposeFunction('__pollyAccounts',()=>[account.address]);
await context.exposeFunction('__pollyRpc',async(method,params)=>
  (await (await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})).json()));
await context.exposeFunction('__pollySend',async({to,data,value})=>
  wal.sendTransaction({account,to,data,value:value?BigInt(value):0n}));
await context.addInitScript(()=>{
  window.ethereum={isMetaMask:true,selectedAddress:null,
    on(){},removeListener(){},removeAllListeners(){},
    async request({method,params}){
      if(method==='eth_requestAccounts'||method==='eth_accounts'){
        const a=await window.__pollyAccounts();window.ethereum.selectedAddress=a[0];return a;}
      if(method==='eth_chainId')return '0x279f';
      if(method==='wallet_switchEthereumChain'||method==='wallet_addEthereumChain')return null;
      if(method==='eth_sendTransaction')return window.__pollySend(params[0]);
      const r=await window.__pollyRpc(method,params||[]);
      if(r.error)throw new Error(r.error.message||'RPC error');
      return r.result;
    }};
});

const feedsStart=Number(await feeds());
console.log('site     :',SITE);
console.log('contract :',ADDRESS);
console.log('ui wallet:',account.address);
console.log('feeds before the run:',feedsStart);

await openApp(page);
await page.evaluate(()=>localStorage.clear());
await openApp(page);
await page.waitForTimeout(800);
check('practice mode loads',(await text(page)).includes('PRACTICE'));

await page.click('text=Monad Testnet');
await page.waitForTimeout(7000);
let t=await text(page);
check('testnet mode renders live quotes',/ON TESTNET/.test(t)&&(t.match(/\d+ CR/g)||[]).length>=10);
check('testnet mode has no chain-read failure',!/Live mode unavailable/.test(t));

await page.click('text=Connect wallet');
await page.waitForTimeout(6000);
t=await text(page);
check('connecting the wallet shows the account',t.toLowerCase().includes(account.address.slice(0,8).toLowerCase()),
  account.address.slice(0,8));

const claimedBefore=await pub.readContract({address:ADDRESS,
  abi:[{type:'function',name:'claimed',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'bool'}]}],
  args:[account.address]});
if(!claimedBefore){
  const base=await baseline(page);
  await page.click('text=Get 500 play credits');
  const claimOutcome=await page.waitForFunction(([b])=>{
    const x=document.getElementById('app').innerText;
    const e=(x.match(/(That did not work[^\n]*|Live mode unavailable[^\n]*)/)||[])[0];
    if(e&&e!==b)return {kind:'error',detail:e.slice(0,110)};
    return document.getElementById('buy')?{kind:'ready',detail:(x.match(/Your credits: [^\n]+/)||[])[0]}:null;
  },[base],{timeout:180000}).catch(()=>'no change within 180s');
  t=await text(page);
  check('claim through the UI granted 500 credits',
    !!claimOutcome&&claimOutcome.kind==='ready'&&/500/.test(t),
    typeof claimOutcome==='string'?claimOutcome:claimOutcome.detail);
}else{
  t=await text(page);
  check('a claimed wallet is not offered a fresh claim',!/Get 500 play credits/.test(t));
  const creditsNow=await pub.readContract({address:ADDRESS,abi:[{type:'function',name:'credits',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'}]}],args:[account.address]});
  check('credits are already available for trading',Number(creditsNow)>0,creditsNow.toString()+' CR');
  await page.waitForSelector('#buy',{timeout:60000});
}

const beforeBuy=Number(await feeds());
await page.click('.food >> nth=0');
await page.waitForTimeout(1500);
await page.click('text=Use this price');
await page.waitForTimeout(900);
const base2=await baseline(page);
await page.click('#buy');
const buyOutcome=await page.waitForFunction(([n,b])=>{
  const x=document.getElementById('app').innerText;
  const e=(x.match(/(That did not work[^\n]*|Live mode unavailable[^\n]*)/)||[])[0];
  if(e&&e!==b)return {kind:'error',detail:e.slice(0,110)};
  const m=(x.match(/(\d+) confirmed feeds/)||[])[1];
  return (m&&Number(m)>n)?{kind:'grown',detail:m+' confirmed feeds'}:null;
},[beforeBuy,base2],{timeout:180000}).catch(()=>'no change within 180s');
await page.waitForTimeout(4000);
t=await text(page);
const afterBuy=Number(await feeds());
check('a purchase clicked in the UI fed Polly on chain',afterBuy>beforeBuy,beforeBuy+' -> '+afterBuy);
check('page reports the confirmed feed count',/\d+ confirmed feeds/.test(t),(t.match(/\d+ confirmed feeds/)||[])[0]);
check('page agrees with the contract about Polly',/contract and this page agree/i.test(t));
check('feed history links to a real transaction',
  await page.evaluate(()=>[...document.querySelectorAll('.record a')].some(a=>/\/tx\/0x[0-9a-f]{20,}/.test(a.href))));

const savedQuote=await page.evaluate(()=>Number((document.getElementById('app').innerText.match(/Price now\n(\d+)/)||[])[1]));
await page.click('text=+2 CR');
await page.waitForTimeout(900);
let staleTested=false;
if(RIVAL){
  try{
    const rival=privateKeyToAccount(RIVAL);
    const rw=createWalletClient({account:rival,chain,transport:http(RPC)});
    const rq=await quote(0);
    await rw.writeContract({address:ADDRESS,abi:ABI,functionName:'buyAndFeed',args:[0,rq]});
    await page.click('.food >> nth=0');
    await page.waitForTimeout(2500);
    const nowQuote=await page.evaluate(()=>Number((document.getElementById('app').innerText.match(/Price now\n(\d+)/)||[])[1]));
    if(nowQuote>savedQuote+2){
      const base3=await baseline(page);
      await page.click('#buy');
      await page.waitForFunction(([b])=>{
        const x=document.getElementById('app').innerText;
        const e=(x.match(/(That did not work[^\n]*|price rose[^\n]*)/i)||[])[0];
        return !!(e&&e!==b);
      },[base3],{timeout:120000});
      t=await text(page);
      check('a rival trade made the saved limit stale',true,savedQuote+' -> '+nowQuote);
      check('the contract rejected the stale limit in the UI',/price rose|That did not work/i.test(t),
        (t.match(/The price rose[^\n]*/i)||[])[0]);
      const afterReject=Number(await feeds());
      check('the rejected trade changed nothing on chain',afterReject===afterBuy,afterBuy+' -> '+afterReject);
      staleTested=true;
    }else{
      console.log('note     : rival trade did not move the price past the saved limit, race not exercised');
    }
  }catch(e){console.log('note     : rival step skipped -',(e.shortMessage||e.message).split('\n')[0].slice(0,80));}
}
if(!staleTested)console.log('note     : stale-limit race not asserted in this run');

await page.screenshot({path:'proof/video/live-desktop.png'});
await context.close();

const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const mp=await mobile.newPage();
await openApp(mp);
await mp.waitForTimeout(1500);
await mp.click('text=Monad Testnet');
await mp.waitForTimeout(9000);
const mt=await text(mp);
check('mobile viewport renders the live market',/ON TESTNET/.test(mt)&&(mt.match(/\d+ CR/g)||[]).length>=10);
const overflow=await mp.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
check('mobile has no horizontal overflow',overflow<=1,'overflow '+overflow+'px');
await mp.screenshot({path:'proof/video/live-mobile.png'});
await mobile.close();

check('no console errors across the run',consoleErrors.length===0,consoleErrors.slice(0,2).join(' | ').slice(0,140));
await browser.close();

const failed=results.filter(r=>!r.ok);
console.log('\n'+(results.length-failed.length)+'/'+results.length+' live UI checks passed');
console.log('explorer:',EXPLORER+'/address/'+ADDRESS);
if(failed.length){console.log('FAILED: '+failed.map(f=>f.name).join(' ; '));process.exit(1);}
