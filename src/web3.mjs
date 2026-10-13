import {selector,word} from './keccak.mjs';
import {initialMarket,validateMarket} from './market.mjs';
import {assertGameState} from './game.mjs';

export const CONFIG=window.POLLY_CONFIG||{};
const addrRE=/^0x[a-fA-F0-9]{40}$/;
export const isConfigured=()=>addrRE.test(CONFIG.contractAddress||'')&&Number(CONFIG.chainId)===10143;
export const explorerTx=hash=>`${CONFIG.explorerUrl||'https://testnet.monadscan.com'}/tx/${hash}`;
export const explorerContract=()=>`${CONFIG.explorerUrl||'https://testnet.monadscan.com'}/address/${CONFIG.contractAddress}`;
const methods={market:selector('getMarket()'),polly:selector('getPolly()'),balance:selector('credits(address)'),
 claimFlag:selector('claimed(address)'),claim:selector('claimCredits()'),buy:selector('buyAndFeed(uint8,uint256)')};
export const TRADE_TOPIC=(await import('./keccak.mjs')).keccak256('TradeExecuted(address,uint8,uint256,uint64,bytes32)');
let rpcId=0;
async function rpc(method,params=[]){
 if(!isConfigured())throw Error('CONTRACT_UNCONFIGURED');
 const response=await fetch(CONFIG.rpcUrl,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({jsonrpc:'2.0',id:++rpcId,method,params}),signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error('RPC_HTTP_'+response.status);
 const result=await response.json();if(result.error)throw Error(result.error.message||'RPC_ERROR');return result.result;
}
const decodeWords=(raw,count)=>{
 if(!/^0x[0-9a-fA-F]+$/.test(raw||'')||raw.length!==2+count*64)throw Error(`WRONG_ABI_OR_CONTRACT: expected ${count} words`);
 return Array.from({length:count},(_,i)=>BigInt('0x'+raw.slice(2+64*i,66+64*i)));
};
const hex=n=>'0x'+BigInt(n).toString(16);
const addressWord=address=>address.toLowerCase().slice(2).padStart(64,'0');
export async function getAccountSnapshot(address,blockTag='latest'){
 if(!addrRE.test(address||''))throw Error('Invalid wallet address');
 const [bal,claimed]=await Promise.all([
   rpc('eth_call',[{to:CONFIG.contractAddress,data:methods.balance+addressWord(address)},blockTag]),
   rpc('eth_call',[{to:CONFIG.contractAddress,data:methods.claimFlag+addressWord(address)},blockTag])]);
 return {balance:Number(BigInt(bal)),claimed:BigInt(claimed)!==0n};
}
export async function loadChain(){
 const blockTag=await rpc('eth_blockNumber');
 const code=await rpc('eth_getCode',[CONFIG.contractAddress,blockTag]);
 if(code==='0x')throw Error('NO_CONTRACT_CODE');
 const [raw,traitsRaw]=await Promise.all([
  rpc('eth_call',[{to:CONFIG.contractAddress,data:methods.market},blockTag]),
  rpc('eth_call',[{to:CONFIG.contractAddress,data:methods.polly},blockTag])]);
 const w=decodeWords(raw,44);const traits=decodeWords(traitsRaw,3);
 const recentLength=Number(w[40]);if(recentLength>10)throw Error('Invalid memory length');
 const market=initialMarket();
 market.reserves=Array.from({length:10},(_,i)=>({credits:Number(w[i]),portions:Number(w[10+i])}));
 const state={counts:w.slice(20,30).map(Number),recent:w.slice(30,30+recentLength).map(Number),
   total:Number(w[41]),lastFood:Number(w[42]),lastFeeder:'',updatedAt:0};
 market.polly=assertGameState(state);
 market.digest='0x'+w[43].toString(16).padStart(64,'0');
 validateMarket(market);
 const expectedPolly={palette:Number(traits[0]),mood:Number(traits[1]),habit:Number(traits[2])};
 return {market,expectedPolly,block:Number(BigInt(blockTag))};
}
// Monad's public RPC answers HTTP 413 to any eth_getLogs window wider than 100 blocks,
// so the recent-trade scan walks backwards in 100-block slices instead of one big range.
const LOG_RANGE=100n;
export async function recentTrades(lookback=1500n){
 const latest=BigInt(await rpc('eth_blockNumber'));
 const floor=latest>lookback?latest-lookback:0n;
 let logs=[];
 for(let end=latest;;){
  const start=end-LOG_RANGE<floor?floor:end-LOG_RANGE;
  logs=(await rpc('eth_getLogs',[{address:CONFIG.contractAddress,
   topics:[TRADE_TOPIC],fromBlock:hex(start),toBlock:hex(end)}])).concat(logs);
  if(start<=floor||logs.length>=8)break;
  end=start-1n;
 }
 return logs.slice(-8).reverse().map(log=>({
  account:'0x'+log.topics[1].slice(-40),foodId:Number(BigInt(log.topics[2])),
  price:Number(BigInt('0x'+log.data.slice(2,66))),tradeNo:Number(BigInt('0x'+log.data.slice(66,130))),
  digest:'0x'+log.data.slice(130,194),hash:log.transactionHash,block:Number(BigInt(log.blockNumber))
 }));
}
function injected(){if(!window.ethereum)throw Error('WALLET_NOT_FOUND');return window.ethereum;}
export async function connectWallet(){
 const provider=injected();const accounts=await provider.request({method:'eth_requestAccounts'});
 if(!accounts?.length)throw Error('Wallet did not provide an account');
 let chain=(await provider.request({method:'eth_chainId'})).toLowerCase();
 if(chain!=='0x279f'){
  try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x279f'}]});}
  catch(e){if(e.code===4902)await provider.request({method:'wallet_addEthereumChain',params:[{
   chainId:'0x279f',chainName:'Monad Testnet',nativeCurrency:{name:'MON',symbol:'MON',decimals:18},
   rpcUrls:[CONFIG.rpcUrl],blockExplorerUrls:[CONFIG.explorerUrl||'https://testnet.monadscan.com']}]});
   else throw e;}
  chain=(await provider.request({method:'eth_chainId'})).toLowerCase();
  if(chain!=='0x279f')throw Error('Wrong network');
 }
 return accounts[0].toLowerCase();
}
async function send(data,onHash){
 const account=await connectWallet();
 const hash=await injected().request({method:'eth_sendTransaction',params:[{
  from:account,to:CONFIG.contractAddress,data,value:'0x0'}]});
 if(onHash)onHash(hash);
 const receipt=await waitForReceipt(hash);
 return {account,hash,receipt};
}
export async function claimOnchain(onHash){return send(methods.claim,onHash);}
export async function tradeOnchain(foodId,maxPrice,onHash){
 if(!Number.isInteger(foodId)||foodId<0||foodId>=10||!Number.isSafeInteger(maxPrice)||maxPrice<0)throw Error('Invalid trade');
 return send(methods.buy+word(foodId)+word(maxPrice),onHash);
}
export async function waitForReceipt(hash){
 for(let n=0;n<45;n++){
  const value=await rpc('eth_getTransactionReceipt',[hash]);
  if(value){if(BigInt(value.status)!==1n)throw Error('TX_REVERTED: inspect the transaction and market quote');return value;}
  await new Promise(r=>setTimeout(r,1800));
 }
 throw Error('PENDING_TIMEOUT; transaction may still finish. Inspect explorer: '+hash);
}
