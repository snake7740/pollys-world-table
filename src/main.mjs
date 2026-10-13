import {FOODS,PALETTES,MOODS,HABITS,derivePolly} from './game.mjs';
import {initialMarket,grantCredits,buyAndFeed,snapshotQuote,validateMarket,history,CREDIT_GRANT} from './market.mjs';
import {isConfigured,connectWallet,getAccountSnapshot,loadChain,recentTrades,claimOnchain,tradeOnchain,explorerTx,explorerContract} from './web3.mjs';

// Short, friendly words help players follow a real trading flow.
const foodNames={en:['Apple slices','Banana chips','Blueberries','Seed mix','Corn','Veggie bites','Oat cracker','Pumpkin cubes','Rice puffs','Nut mix']};
const C={en:{
 tag:'ONE PARROT · ONE SHARED FOOD MARKET',title:'Feed Polly. See how a trade works.',
 subtitle:'Pick a snack, check its price, and feed the same parrot everyone sees.',
 demo:'Try the game',live:'Monad Testnet',start:'Play credits',balance:'Your credits',claim:'Get 500 play credits',claimed:'Credits are ready',wallet:'Connect wallet',
 learnTitle:'Learn as you play',
 phases:['See the shared market','Get play credits','Watch prices change','Choose your price limit','See who trades first','See success or rollback','Watch Polly change','Check the public proof'],
 goal:'Each step has a quick explanation. Try a trade, then watch what changes.',
 market:'Polly’s snack market',marketNote:'These are pretend prices. Real money is never used to buy food.',price:'Price now',nextPrice:'Price after buying',remaining:'Snacks left',max:'Your price limit',
 exact:'Use this price',plus:'Allow a little more',buy:'Buy & feed Polly',preview:'Your chosen snack',demoRival:'Let another player buy first',reset:'Start over',
 state:'Our shared Polly',mood:'Mood',habit:'Habit',palette:'Feather colors',recent:'Recent feeds',norecent:'No feeds yet. Pick a snack to begin.',norecentLive:'No trades in the last few minutes. The market is shared, so this fills as soon as anyone feeds Polly.',historyFail:'Recent trades could not be read from the network. Try again shortly.',
 stateVerified:'The contract and this page agree',stateUnknown:'No live proof yet',shared:'One shared Polly',proof:'Feed history',contract:'Game contract',viewTx:'See the transaction',
 education:'Here is why it matters',
 tips:[
 'Everyone can read the same public market. A website can show it, but cannot quietly rewrite the contract rules.',
 'Your play credits live in the game contract. You cannot cash them out, send them away, or sell them.',
 'Each snack has a pool. When someone buys a snack, its supply falls. The next price can rise. Open another quote to see it.',
 'A price limit keeps a surprise price increase from going through. The contract checks your limit when your trade runs.',
 'Click “Let another player buy first.” Your old price may no longer work. The chain gives each confirmed trade a clear place in line.',
 'A trade changes your credits, snack supplies, Polly, and the public record together. If one check fails, none of those game changes stick.',
 'Every confirmed meal helps shape Polly’s colors, mood, and habits. Everyone who reads the contract can see the same result.',
 'A pretty animation cannot prove a trade happened. Check its receipt and public events. The page also checks Polly’s traits against the contract.'
 ],
 safety:'For learning only. Play credits have no cash value. Testnet actions still use MON for network fees. Game snacks are not real parrot diet advice.',
 justDemo:'Practice mode · no wallet, no blockchain transactions.',justLive:'Testnet mode · wallet confirmation and public transactions.',
 txPending:'Waiting for your wallet or the network…',txSuccess:'Confirmed on the network. You can view the receipt.',
 tradeOk:'Polly got the snack! Your credits and the market changed too.',claimOk:'You have 500 play credits.',resetDone:'A fresh start. Try a different snack.',
 rivalDone:'Someone else bought first. Your saved price limit stayed the same. Try buying now.',error:'That did not work',walletFail:'Please open an EVM wallet and select Monad Testnet.',pending:'Waiting…',confirmed:'Confirmed',none:'Wallet not connected',
 previewBadge:'PRACTICE',liveBadge:'ON TESTNET',seeContract:'View the public contract',quoteStep:'Live quote',capped:'Price protection',trust:'Can we check the result?',connected:'Wallet connected',
 insufficient:'You need more play credits.',noPool:'This snack has run out. Pick another one.',priceMoved:'The price rose above your limit. Refresh it or choose a different snack.',
 explain:'Eight discoveries',training:'A small market game built for Monad Metropolis. One bird, one market, and a trade anyone can check.',
 lessonHint:'Tap a picture to learn',race:'Trade order',atomic:'All or nothing',resetPractice:'Reset practice',failedTrade:'Nothing changed. Your price limit did its job.',
 marketChange:'Last shared trade',how:'What happened?',modeHelp:'Switch to Testnet after deploying the contract.'
 }};
const moodNames={en:['Cheerful','Curious','Grooming','Bouncy','Picky','Sleepy']};
const habitNames={en:['Gentle sway','Head tilt','Preening','Little dance','Resting']};
const paletteNames={en:['Lagoon','Leaf','Ocean','Coral','Plum']};
const app=document.querySelector('#app');
const langInitial='en';
function storage(){try{return validateMarket(JSON.parse(localStorage.getItem('polly-market-v3')||'null'));}catch{return initialMarket();}}
const S={lang:langInitial,mode:'demo',demo:storage(),live:initialMarket(),selected:0,maxPrice:null,
  wallet:'',onchainAccount:{balance:0,claimed:false},activity:[],activityError:false,verified:null,block:null,activeLesson:0,quoteViewed:false,
  pending:false,message:'',error:false,txHash:'',connected:false,rivalSeen:false,rollbackSeen:false,tradeSeen:false};
const t=k=>(C[S.lang]||C.en)[k]||k;
const current=()=>S.mode==='demo'?S.demo:S.live;
const myAccount=()=>S.mode==='demo'?'player':S.wallet;
const accountView=()=>S.mode==='demo'?{balance:S.demo.balances.player||0,claimed:!!S.demo.claimed.player}:S.onchainAccount;
const food=id=>foodNames.en[id];
const asset=(kind,id)=>`./public/assets/${kind}/${id}.webp`;
const short=x=>x?`${x.slice(0,8)}…${x.slice(-5)}`:'';
const persist=()=>localStorage.setItem('polly-market-v3',JSON.stringify(S.demo));
const traits=()=>derivePolly(current().polly);
const q=()=>snapshotQuote(current(),S.selected);
function notify(m,error=false){S.message=m;S.error=error;render();}
function isVerified(){
 if(S.mode!=='live'||!S.verified)return false;
 const d=derivePolly(S.live.polly),p=S.verified;
 return PALETTES.indexOf(d.palette)===p.palette&&MOODS.indexOf(d.mood)===p.mood&&HABITS.indexOf(d.habit)===p.habit;
}
function completedSteps(){
 const m=current(),a=accountView();
 return [true,a.claimed,S.quoteViewed,S.maxPrice!==null,S.rivalSeen||S.mode==='live'&&m.polly.total>0,S.rollbackSeen||S.tradeSeen,m.polly.total>0, S.mode==='demo'?false:isVerified()];
}
function render(){
 document.documentElement.lang=S.lang;
 const m=current(),d=traits(),quote=q(),a=accountView();
 const paletteId=PALETTES.indexOf(d.palette), moodId=MOODS.indexOf(d.mood),habitId=HABITS.indexOf(d.habit);
 const sprite=asset('polly',m.polly.total?`${d.mood}-${d.palette}`:'joy-lagoon');
 const evidence=S.mode==='live'&&isVerified();
 const statusClass=S.error?'bad':'good';
 const tradeRecords=S.mode==='demo'?history(m):S.activity;
 const ready=a.claimed&&a.balance>=0&&quote.price!==null;
 app.innerHTML=`<div class="shell">
 <header class="top">
 <div class="identity"><div class="identity-mark"><img src="./public/assets/ui/approved-logo.png" alt="Polly’s World Table"></div><div><b>Polly's World Table</b><small>Feed & Trade Lab · Monad Metropolis</small></div></div>
 <div class="nav"><span class="little-tag">Onchain Finance & Trading</span><button class="pill ${S.mode==='demo'?'chosen':''}" id="demo">${t('demo')}</button><button class="pill ${S.mode==='live'?'chosen':''}" id="live" ${!isConfigured()?'disabled':''}>${t('live')}</button></div></header>
 <section class="intro"><div class="eyebrow">${t('tag')}</div><h1>${t('title')}</h1><p>${t('subtitle')}</p><div class="explain-label">${S.mode==='demo'?t('justDemo'):t('justLive')}</div></section>
 <div class="dash">
  <section class="polly panel"><div class="panel-heading"><span>${t('shared')}</span><span class="status-badge">${S.mode==='demo'?t('previewBadge'):t('liveBadge')}</span></div>
   <div class="glow"></div><img class="sprite" src="${sprite}" alt="Polly the shared parrot">
   <div class="perch"></div><div class="stats"><span>${t('palette')}: <b>${paletteNames[S.lang][paletteId]}</b></span><span>${t('mood')}: <b>${moodNames[S.lang][moodId]}</b></span><span>${t('habit')}: <b>${habitNames[S.lang][habitId]}</b></span></div>
   <div class="signal-line">${m.polly.total} confirmed feeds ${S.mode==='live'&&S.block!==null?`· block ${S.block}`:''}</div>
  </section>
  <section class="market panel"><div class="panel-heading"><span>${t('market')}</span><small>${t('quoteStep')}</small></div><p class="muted">${t('marketNote')}</p>
    <div class="foods">${FOODS.map(f=>`<button class="food ${S.selected===f.id?'picked':''}" data-food="${f.id}" aria-pressed="${S.selected===f.id}"><img src="${asset('foods',f.key)}" alt=""><b>${food(f.id)}</b><small>${snapshotQuote(m,f.id).price===null?'OUT':snapshotQuote(m,f.id).price+' CR'}</small></button>`).join('')}</div>
    <div class="ticket"><div class="ticket-name"><img src="${asset('foods',FOODS[S.selected].key)}" alt=""><div><small>${t('preview')}</small><b>${food(S.selected)}</b></div></div>
     <div class="quote-grid"><div><small>${t('price')}</small><strong>${quote.price??'—'} <em>CR</em></strong></div><div><small>${t('nextPrice')}</small><strong>${quote.nextPrice??'—'} <em>CR</em></strong></div><div><small>${t('remaining')}</small><strong>${quote.remaining}</strong></div></div>
     <label class="maxlabel">${t('max')}: <b>${S.maxPrice??'—'} CR</b></label><div class="max-buttons"><button id="max-exact" class="segment">${t('exact')}</button><button id="max-plus2" class="segment">+2 CR</button><button id="max-plus5" class="segment">+5 CR</button></div>
     <div class="wallet-info"><span>${t('balance')}: <b>${a.claimed?a.balance:'—'} CR</b></span><span>${S.wallet&&S.mode==='live'?short(S.wallet):S.mode==='live'?t('none'):t('demo')}</span></div>
     <div class="ticket-actions">${S.mode==='live'&&!S.wallet?`<button class="action secondary" id="connect">${t('wallet')}</button>`:''}
     ${!a.claimed?`<button class="action secondary" id="claim" ${S.pending?'disabled':''}>${t('claim')}</button>`:`<button class="action" id="buy" ${S.pending||!ready?'disabled':''}>${S.pending?t('pending'):t('buy')}</button>`}</div>
     ${S.mode==='demo'?`<div class="demo-extras"><button id="rival">${t('demoRival')}</button><button id="reset">${t('reset')}</button></div>`:''}
   </div>
  </section>
  <aside class="learning panel"><div class="panel-heading"><span>${t('learnTitle')}</span><span class="mini">${t('explain')}</span></div><p class="muted">${t('goal')}</p>
    <div class="lessons">${t('phases').map((p,i)=>`<button class="lesson ${S.activeLesson===i?'focused':''}" data-lesson="${i}"><img class="lesson-art" src="./public/assets/ui/lesson-${i}.png" alt=""><span>${p}</span><span class="bullet ${completedSteps()[i]?'done':''}">${completedSteps()[i]?'✓':'·'}</span></button>`).join('')}</div>
    <div class="lesson-detail"><b>${t('education')}</b><p>${t('tips')[S.activeLesson]}</p></div>
    <div class="authenticity"><b>${t('trust')}</b><div class="${evidence?'success':'waiting'}">${evidence?t('stateVerified'):t('stateUnknown')}</div>${S.mode==='live'&&isConfigured()?`<a href="${explorerContract()}" target="_blank" rel="noopener">${t('seeContract')} ↗</a>`:''}</div>
  </aside>
 </div>
 <section class="bottom panel"><div class="panel-heading"><span>${t('recent')}</span><span class="mini">${t('proof')}</span></div><div class="records">${tradeRecords.length?tradeRecords.map(x=>`<div class="record"><img src="${asset('foods',FOODS[x.foodId].key)}" alt=""><span><b>${food(x.foodId)}</b><small>${short(x.account)}</small></span><strong>${x.price} CR</strong>${x.hash?`<a target="_blank" rel="noopener" href="${explorerTx(x.hash)}">${t('viewTx')} ↗</a>`:`<small>${t('previewBadge')}</small>`}</div>`).join(''):`<p class="muted">${S.activityError?t('historyFail'):S.mode==='live'?t('norecentLive'):t('norecent')}</p>`}</div></section>
 ${S.message?`<div role="status" class="toast ${statusClass}">${S.message}${S.txHash&&S.mode==='live'?` <a target="_blank" rel="noopener" href="${explorerTx(S.txHash)}">${t('viewTx')} ↗</a>`:''}</div>`:''}
 <footer><p>${t('safety')}</p><p>${t('training')}</p></footer>
 </div>`;
 bind();
}
function bind(){
 document.querySelector('#demo').onclick=()=>{S.mode='demo';S.activeLesson=0;S.maxPrice=null;S.quoteViewed=false;S.message='';render();};
 document.querySelector('#live').onclick=async()=>{S.mode='live';S.activeLesson=0;S.maxPrice=null;S.quoteViewed=false;render();await refresh();};

 document.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>{S.selected=Number(b.dataset.food);S.maxPrice=null;S.quoteViewed=true;S.activeLesson=2;render();});
 document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{S.activeLesson=Number(b.dataset.lesson);render();});
 const exact=document.querySelector('#max-exact'),two=document.querySelector('#max-plus2'),five=document.querySelector('#max-plus5');
 exact.onclick=()=>setCap(0);two.onclick=()=>setCap(2);five.onclick=()=>setCap(5);
 if(document.querySelector('#connect'))document.querySelector('#connect').onclick=async()=>{
  S.pending=true;render();try{S.wallet=await connectWallet();S.connected=true;S.onchainAccount=await getAccountSnapshot(S.wallet);notify(t('connected'));}
  catch(e){notify(e.message==='WALLET_NOT_FOUND'?t('walletFail'):e.message,true);}finally{S.pending=false;render();}
 };
 if(document.querySelector('#claim'))document.querySelector('#claim').onclick=claim;
 if(document.querySelector('#buy'))document.querySelector('#buy').onclick=buy;
 if(document.querySelector('#rival'))document.querySelector('#rival').onclick=rival;
 if(document.querySelector('#reset'))document.querySelector('#reset').onclick=()=>{S.demo=initialMarket();S.maxPrice=null;S.quoteViewed=false;S.rivalSeen=false;S.rollbackSeen=false;S.tradeSeen=false;S.activeLesson=0;S.txHash='';persist();notify(t('resetDone'));};
}
function setCap(buffer){const price=q().price;S.maxPrice=price===null?null:price+buffer;S.activeLesson=3;render();}
async function claim(){
 S.pending=true;S.message='';render();
 try{
  if(S.mode==='demo'){S.demo=grantCredits(S.demo,'player');persist();S.activeLesson=1;notify(t('claimOk'));}
  else{
   if(!S.wallet)S.wallet=await connectWallet();
   const tx=await claimOnchain(hash=>{S.txHash=hash;notify(t('txPending'));});
   S.txHash=tx.hash;await refresh();S.activeLesson=1;notify(t('claimOk'));
  }
 }catch(e){notify(t('error')+': '+e.message,true);}finally{S.pending=false;render();}
}
async function buy(){
 if(S.maxPrice===null){notify(t('max'),true);return;}
 S.pending=true;S.message='';render();
 try{
  if(S.mode==='demo'){
   const {market}=buyAndFeed(S.demo,{account:'player',foodId:S.selected,maxPrice:S.maxPrice,timestamp:Date.now()});
   S.demo=market;persist();S.tradeSeen=true;S.activeLesson=6;notify(t('tradeOk'));
  }else{
   if(!S.wallet)S.wallet=await connectWallet();
   const tx=await tradeOnchain(S.selected,S.maxPrice,hash=>{S.txHash=hash;notify(t('txPending'));});
   S.txHash=tx.hash;S.tradeSeen=true;await refresh();S.activeLesson=7;notify(t('txSuccess'));
  }
 }catch(e){
  const msg=e.message==='PRICE_MOVED'?t('priceMoved'):e.message==='LOW_CREDITS'?t('insufficient'):e.message==='SOLD_OUT'?t('noPool'):e.message;
  if(e.message==='PRICE_MOVED'||e.message==='SOLD_OUT'||e.message==='LOW_CREDITS'){S.rollbackSeen=true;S.activeLesson=5;}notify(t('error')+': '+msg,true);
 }finally{S.pending=false;render();}
}
function rival(){
 try{
  let m=S.demo;if(!m.claimed.rival)m=grantCredits(m,'rival');
  const quote=snapshotQuote(m,S.selected);if(quote.price===null)throw Error(t('noPool'));
  S.demo=buyAndFeed(m,{account:'rival',foodId:S.selected,maxPrice:quote.price}).market;
  persist();S.rivalSeen=true;S.activeLesson=4;notify(t('rivalDone'));
 }catch(e){notify(e.message,true);}
}
async function refresh(){
 if(S.mode!=='live'||!isConfigured())return;
 S.pending=true;render();
 try{
  const result=await loadChain();S.live=result.market;S.verified=result.expectedPolly;S.block=result.block;
  if(S.wallet)S.onchainAccount=await getAccountSnapshot(S.wallet,'0x'+S.block.toString(16));
  S.activityError=false;
  try{S.activity=await recentTrades();}catch{S.activity=[];S.activityError=true;}
  S.message='';S.error=false;
 }catch(e){S.message='Live mode unavailable: '+e.message;S.error=true;S.verified=null;}
 finally{S.pending=false;render();}
}
S.maxPrice=null;render();
if(isConfigured()){setInterval(()=>{if(S.mode==='live'&&!S.pending)refresh();},Number(window.POLLY_CONFIG?.pollingMs)||15000);}
