/**
 * Educational zero-value AMM, for exactly one virtual food portion per trade.
 * One pool per food. Every purchase exchanges internal learning credits for one
 * virtual meal. No currency, ERC-20 asset, custody, payout or cash value.
 * This is intentionally an extremely small constant-product execution demo.
 */
import {emptyState, feedLocal, FOODS} from './game.mjs';
export const CREDIT_GRANT=500;
export const INITIAL_PORTIONS=30;
export const INITIAL_CREDIT_RESERVES=Object.freeze([300,330,315,320,300,345,310,320,325,325]);
export const FOOD_IDS=FOODS.map(f=>f.id);
export const MAX_CREDITS=1000000;
export function initialMarket(){
 return {reserves:INITIAL_CREDIT_RESERVES.map(x=>({credits:x,portions:INITIAL_PORTIONS})),
   balances:{},claimed:{},polly:emptyState(),trades:[],digest:'0x'+'00'.repeat(32)};
}
export function quoteOf(pool){
 if(!Number.isSafeInteger(pool.credits)||!Number.isSafeInteger(pool.portions)||pool.credits<=0||pool.portions<0)throw Error('Bad pool');
 if(pool.portions<=1)return null;
 return Math.floor((pool.credits+pool.portions-2)/(pool.portions-1)); // ceil(x / (y-1))
}
export function snapshotQuote(market,id){
 if(!Number.isInteger(id)||id<0||id>=10)throw Error('Invalid food');
 const p=market.reserves[id],price=quoteOf(p);
 return {foodId:id,price,remaining:p.portions,reserveCredits:p.credits,
   nextPrice:price===null?null:quoteOf({credits:p.credits+price,portions:p.portions-1})};
}
export function grantCredits(market,account){
 if(!account||typeof account!=='string')throw Error('Account required');
 if(market.claimed[account])throw Error('Already claimed');
 const out=structuredClone(market);out.claimed[account]=true;out.balances[account]=CREDIT_GRANT;return out;
}
/** All operations are atomic. On failure market remains untouched. */
export function buyAndFeed(market,{account,foodId,maxPrice,timestamp=0}){
 if(!market.claimed[account])throw Error('CLAIM_FIRST');
 if(!Number.isInteger(maxPrice)||maxPrice<0||maxPrice>MAX_CREDITS)throw Error('INVALID_MAX_PRICE');
 const quote=snapshotQuote(market,foodId),price=quote.price;
 if(price===null)throw Error('SOLD_OUT');
 if(price>maxPrice)throw Error('PRICE_MOVED');
 if((market.balances[account]||0)<price)throw Error('LOW_CREDITS');
 const out=structuredClone(market),p=out.reserves[foodId];
 out.balances[account]-=price;p.credits+=price;p.portions--;
 out.polly=feedLocal(out.polly,foodId);
 const trade={account,foodId,price,tradeNo:out.polly.total,timestamp};
 out.trades.push(trade);
 return {market:out,trade,next:snapshotQuote(out,foodId)};
}
export function validateMarket(m){
 if(!m||m.reserves?.length!==10)throw Error('Invalid market shape');
 for(const p of m.reserves){if(!Number.isSafeInteger(p.credits)||!Number.isSafeInteger(p.portions)||p.credits<=0||p.portions<0)throw Error('Invalid reserves');}
 if(!m.polly||m.polly.counts.length!==10)throw Error('Invalid Polly state');
 if(Object.values(m.balances).some(x=>!Number.isSafeInteger(x)||x<0))throw Error('Invalid balances');
 return m;
}
export function history(m){return m.trades.slice(-8).reverse();}
