import test from 'node:test';import assert from 'node:assert/strict';
import {initialMarket,grantCredits,buyAndFeed,snapshotQuote,quoteOf,validateMarket,CREDIT_GRANT} from '../src/market.mjs';
import {derivePolly,PALETTES,MOODS,HABITS} from '../src/game.mjs';
const shop=(m,person,id,max)=>buyAndFeed(m,{account:person,foodId:id,maxPrice:max}).market;
test('HAPPY 01: a visitor can inspect ten quotes without an account',()=>{
 const m=initialMarket();assert.equal(m.reserves.length,10);for(let id=0;id<10;id++){const q=snapshotQuote(m,id);assert(q.price>0);assert.equal(q.remaining,30);}
});
test('HAPPY 02: wallet simulator obtains educational credits once',()=>{
 const m=grantCredits(initialMarket(),'alice');assert.equal(m.balances.alice,CREDIT_GRANT);assert.equal(m.claimed.alice,true);
});
test('HAPPY 03: quoted exact-price buy succeeds and feeds one shared Polly',()=>{
 let m=grantCredits(initialMarket(),'alice');const q=snapshotQuote(m,2);m=shop(m,'alice',2,q.price);
 assert.equal(m.balances.alice,CREDIT_GRANT-q.price);assert.equal(m.polly.total,1);assert.equal(m.polly.lastFood,2);assert.equal(m.reserves[2].portions,29);
});
test('HAPPY 04: trading updates public price from deterministic reserves',()=>{
 let m=grantCredits(initialMarket(),'alice');const before=snapshotQuote(m,0);m=shop(m,'alice',0,before.price);
 const after=snapshotQuote(m,0);assert.equal(m.reserves[0].credits,300+before.price);assert(after.price>=before.price);assert.equal(after.price,before.nextPrice);
});
test('HAPPY 05: separate simulated players change one shared state',()=>{
 let m=grantCredits(grantCredits(initialMarket(),'alice'),'bob');m=shop(m,'alice',1,snapshotQuote(m,1).price);
 m=shop(m,'bob',6,snapshotQuote(m,6).price);assert.equal(m.polly.total,2);
 assert.deepEqual(m.polly.recent,[1,6]);assert.equal(m.trades.length,2);
});
test('HAPPY 06: evolution reacts deterministically to the latest trade',()=>{
 let m=grantCredits(initialMarket(),'alice');for(const id of [0,2,4,7])m=shop(m,'alice',id,snapshotQuote(m,id).price);
 const d=derivePolly(m.polly);assert(PALETTES.includes(d.palette));assert(MOODS.includes(d.mood));assert(HABITS.includes(d.habit));
 assert.deepEqual(derivePolly(structuredClone(m.polly)),d);
});
test('HAPPY 07: history can be serialized and verified on another client',()=>{
 let m=grantCredits(initialMarket(),'alice');m=shop(m,'alice',0,snapshotQuote(m,0).price);
 const received=validateMarket(JSON.parse(JSON.stringify(m)));
 assert.deepEqual(received.polly,m.polly);assert.deepEqual(derivePolly(received.polly),derivePolly(m.polly));
});
test('HAPPY 08: one operation updates credit, liquidity, event and Polly atomically',()=>{
 let m=grantCredits(initialMarket(),'alice');const q=snapshotQuote(m,4);
 const next=shop(m,'alice',4,q.price);assert.equal(next.trades.at(-1).price,q.price);
 assert.equal(next.polly.counts[4],1);assert.equal(next.reserves[4].portions,m.reserves[4].portions-1);
 assert.equal(next.balances.alice,m.balances.alice-q.price);
});
test('FAIL 01: stale quote is rejected and does not mutate market',()=>{
 let m=grantCredits(grantCredits(initialMarket(),'alice'),'bob');const before=snapshotQuote(m,0).price;
 m=shop(m,'bob',0,before);const current=snapshotQuote(m,0).price;
 assert(current>before,'pricing parameters selected to demonstrate a moved quote');
 const snapshot=JSON.stringify(m);assert.throws(()=>shop(m,'alice',0,before),/PRICE_MOVED/);assert.equal(JSON.stringify(m),snapshot);
});
test('FAIL 02: balance check protects against overspending',()=>{
 let m=grantCredits(initialMarket(),'alice');m.balances.alice=0;const old=JSON.stringify(m);
 assert.throws(()=>shop(m,'alice',0,999),/LOW_CREDITS/);assert.equal(JSON.stringify(m),old);
});
test('FAIL 03: a second claim must fail',()=>{
 const m=grantCredits(initialMarket(),'alice');assert.throws(()=>grantCredits(m,'alice'),/Already claimed/);
});
test('FAIL 04: users must claim before trading',()=>{
 const m=initialMarket();assert.throws(()=>shop(m,'alice',0,100),/CLAIM_FIRST/);
});
test('FAIL 05: invalid IDs and caps cannot mutate market',()=>{
 const m=grantCredits(initialMarket(),'alice');const snapshot=JSON.stringify(m);
 assert.throws(()=>shop(m,'alice',255,100),/Invalid food/);
 assert.throws(()=>shop(m,'alice',0,-1),/INVALID_MAX_PRICE/);
 assert.equal(JSON.stringify(m),snapshot);
});
test('FAIL 06: depleted virtual liquidity rejects new purchases',()=>{
 let m=grantCredits(initialMarket(),'alice');m.reserves[0].portions=1;
 assert.equal(quoteOf(m.reserves[0]),null);assert.throws(()=>shop(m,'alice',0,100),/SOLD_OUT/);
});
test('STABILITY: evolution uses only ten newest feeds',()=>{
 let m=grantCredits(initialMarket(),'alice');for(let i=0;i<15;i++){let id=i%10; m=shop(m,'alice',id,snapshotQuote(m,id).price);}
 assert.equal(m.polly.recent.length,10);assert.equal(m.polly.total,15);
});
