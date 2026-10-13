import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOODS,PALETTES,MOODS,HABITS,derivePolly} from '../src/game.mjs';
import {INITIAL_CREDIT_RESERVES,INITIAL_PORTIONS,CREDIT_GRANT,quoteOf} from '../src/market.mjs';
const source=await readFile(new URL('../contracts/PollyFeedMarket.sol',import.meta.url),'utf8');
test('SOURCE 01: contract and JS use matching initial virtual pools',()=>{
 const values=source.match(/creditReserves\s*=\s*\[uint256\((\d+)\),([^\]]+)\]/);
 assert(values,'Solidity pool declaration missing');
 const reserves=[Number(values[1]),...values[2].split(',').map(x=>Number(x.trim()))];
 assert.deepEqual(reserves,INITIAL_CREDIT_RESERVES);
 assert(source.includes('uint256(30)'));
 assert.equal(INITIAL_PORTIONS,30);
});
test('SOURCE 02: contract and JS refer to exactly ten fixed foods',()=>{
 assert.equal(FOODS.length,10);assert(source.includes('FOOD_COUNT = 10'));
 assert(source.includes('MEMORY_SIZE = 10'));
});
test('SOURCE 03: explicit on-chain max-price, balances and atomic meal update',()=>{
 for(const expected of ['function quote(uint8 foodId)','return (x + remaining - 2) / (remaining - 1)',
  'if (paid > maxPrice)','if (balance < paid)','credits[msg.sender] = balance - paid',
  'foodReserves[foodId] -= 1','emit TradeExecuted('])assert(source.includes(expected),expected);
});

// The three checks below parse the contract and compare behaviour, not wording,
// so a change on either side of the JS / Solidity pair is caught.
const readIntArray=(name,inner)=>{
 const m=new RegExp(name+'\\s*=\\s*\\['+inner+'\\((\\d+)\\),([^\\]]+)\\]').exec(source);
 assert(m,'Solidity declaration missing: '+name);
 return [Number(m[1]),...m[2].split(',').map(x=>Number(x.trim()))];
};
// Trait tables live inside a getter body as `uint8[10] memory m = [uint8(1),0,...]`.
const readTraitMap=(fn)=>{
 const body=new RegExp('function '+fn+'\\(uint8 id\\)[\\s\\S]*?\\n {4}\\}').exec(source);
 assert(body,'Solidity '+fn+' not found');
 const m=/\[\s*uint8\((\d+)\)\s*,([^\]]+)\]/.exec(body[0]);
 assert(m,'Solidity '+fn+' table literal changed shape');
 return [Number(m[1]),...m[2].split(',').map(x=>Number(x.trim()))];
};

test('SOURCE 04: quote math equals the contract over the whole reserve space',()=>{
 const body=/function quote\(uint8 foodId\)[\s\S]*?\n {4}\}/.exec(source);
 assert(body,'Solidity quote() not found');
 const expr=/return\s*\(x\s*\+\s*remaining\s*-\s*(\d+)\)\s*\/\s*\(\s*remaining\s*-\s*(\d+)\)/.exec(body[0]);
 assert(expr,'Solidity quote expression changed shape');
 const [a,b]=[Number(expr[1]),Number(expr[2])];
 const guard=/if \(remaining <= (\d+)\) revert NoLiquidity\(\)/.exec(body[0]);
 assert(guard,'Solidity NoLiquidity guard not found');
 const soldOutAt=Number(guard[1]);
 let checked=0;
 for(let portions=1;portions<=40;portions++)for(const credits of [1,2,7,30,299,300,301,311,325,1000,4097,65536,999983,1000000]){
  if(portions<=soldOutAt){assert.equal(quoteOf({credits,portions}),null,`portions ${portions} must quote no price`);continue;}
  // Solidity integer division truncates toward zero, matching Math.floor for positive operands.
  assert.equal(quoteOf({credits,portions}),Math.floor((credits+portions-a)/(portions-b)),`credits ${credits} / portions ${portions}`);
  checked++;
 }
 assert(checked>150,'reserve matrix too small');
});

test('SOURCE 05: contract trait tables equal the browser food table',()=>{
 for(const key of ['palette','mood','habit']){
  const contractMap=readTraitMap('_'+key+'For');
  assert.equal(contractMap.length,FOODS.length,key+' table length');
  assert.deepEqual(contractMap,FOODS.map(f=>f[key]),`contract ${key} table drifted from game.mjs`);
 }
 const spaces=[['palette',PALETTES],['mood',MOODS],['habit',HABITS]];
 for(const [key,names] of spaces){
  for(const id of FOODS.map(f=>f[key]))assert(id>=0&&id<names.length,`${key} index ${id} outside its ${names.length} names`);
 }
});

test('SOURCE 06: grant size, food count and starting pools match the contract',()=>{
 const grant=/STARTING_CREDITS\s*=\s*(\d+)/.exec(source);
 assert(grant,'STARTING_CREDITS not found');
 assert.equal(Number(grant[1]),CREDIT_GRANT,'learning credit grant drifted');
 const count=/FOOD_COUNT\s*=\s*(\d+)/.exec(source);
 assert(count,'FOOD_COUNT not found');
 assert.equal(Number(count[1]),FOODS.length);
 assert.deepEqual(readIntArray('foodReserves','uint256'),Array(FOODS.length).fill(INITIAL_PORTIONS));
});

test('SOURCE 07: browser Polly evolution equals the contract for every feed order',()=>{
 const maps={palette:readTraitMap('_paletteFor'),mood:readTraitMap('_moodFor'),habit:readTraitMap('_habitFor')};
 // Mirrors the contract's _winner: first index taking the top score wins, unless the fallback ties it.
 const winner=(scores,fallback)=>{
  let high=0,lead=0;
  for(let i=0;i<scores.length;i++)if(scores[i]>high){high=scores[i];lead=i;}
  return scores[fallback]===high?fallback:lead;
 };
 const contractPolly=(recent)=>{
  if(!recent.length)return{palette:0,mood:0,habit:0};
  const p=Array(5).fill(0),h=Array(5).fill(0);
  recent.forEach((food,i)=>{p[maps.palette[food]]+=i+1;h[maps.habit[food]]+=i+1;});
  const last=recent.at(-1);
  return{palette:winner(p,maps.palette[last]),mood:maps.mood[last],habit:winner(h,maps.habit[last])};
 };
 const browserPolly=(recent)=>{
  const d=derivePolly({recent,total:recent.length});
  return{palette:PALETTES.indexOf(d.palette),mood:MOODS.indexOf(d.mood),habit:HABITS.indexOf(d.habit)};
 };
 let cases=0;
 const walk=(prefix,maxLen)=>{
  if(prefix.length){cases++;assert.deepEqual(browserPolly(prefix),contractPolly(prefix),'feed order '+prefix.join('-'));}
  if(prefix.length===maxLen)return;
  for(let food=0;food<FOODS.length;food++)walk([...prefix,food],maxLen);
 };
 assert.deepEqual(browserPolly([]),contractPolly([]),'empty memory');
 walk([],4);
 assert(cases>11000,'trait matrix too small');
});
