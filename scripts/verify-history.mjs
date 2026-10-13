// Replay all on-chain trades and independently validate public commitment.
// Requires a deployed contract, RPC with the full event range, and Node >=20.
import {keccak256} from '../src/keccak.mjs';
import {readFile} from 'node:fs/promises';
const configText=await readFile(new URL('../config.js',import.meta.url),'utf8');
const address=(configText.match(/contractAddress:\s*['"](0x[\da-fA-F]{40})['"]/)||[])[1];
if(!address){console.error('Configure contractAddress before audit');process.exit(2);}
const rpcURL=(configText.match(/rpcUrl:\s*['"]([^'"]+)['"]/)||[])[1];
const topic=keccak256('TradeExecuted(address,uint8,uint256,uint64,bytes32)');
let id=0;
async function rpc(method,params){const r=await fetch(rpcURL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});const j=await r.json();if(j.error)throw Error(j.error.message);return j.result;}
const tip=BigInt(await rpc('eth_blockNumber',[]));
let from=BigInt(process.env.FROM_BLOCK||0);let digest='0x'+'00'.repeat(32),counter=0n;
const bytes=s=>Uint8Array.from(s.match(/../g).map(h=>parseInt(h,16)));
const padded=(n,bytesCount)=>BigInt(n).toString(16).padStart(bytesCount*2,'0');
for(;from<=tip;from+=100n){
 const end=from+99n>tip?tip:from+99n;
 const logs=await rpc('eth_getLogs',[{address,fromBlock:'0x'+from.toString(16),toBlock:'0x'+end.toString(16),topics:[topic]}]);
 for(const log of logs){
  const user=log.topics[1].slice(-40),food=BigInt(log.topics[2]);
  const paid=BigInt('0x'+log.data.slice(2,66));
  const tradeNo=BigInt('0x'+log.data.slice(66,130));
  const committed='0x'+log.data.slice(130,194);
  const packed=digest.slice(2)+user+padded(food,1)+padded(paid,32)+padded(tradeNo,8);
  const computed=keccak256(bytes(packed));
  if(tradeNo!==counter+1n||computed.toLowerCase()!==committed.toLowerCase())throw Error('History mismatch at '+log.transactionHash);
  counter++;digest=computed;
 }
}
console.log('Event replay passed:',String(counter),'trades, final commitment',digest);
const selector=keccak256('getMarket()').slice(0,10);
const finalState=await rpc('eth_call',[{to:address,data:selector},'latest']);
if(!/^0x[0-9a-fA-F]+$/.test(finalState)||finalState.length!==2+44*64)throw Error('Contract ABI mismatch');
const chainDigest='0x'+finalState.slice(-64);
if(chainDigest.toLowerCase()!==digest.toLowerCase())throw Error('On-chain commitment does not match replayed events');
const tradeCount=BigInt('0x'+finalState.slice(2+41*64,2+42*64));
if(tradeCount!==counter)throw Error('On-chain trade count differs from event count');
console.log('PASS: event history, transaction order, trade count and on-chain digest all agree.');
