"""Run the real front-end modules in Chromium, without external network access.
The runner embeds local assets because Chromium blocks localhost in this environment.
"""
import re,base64,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
cache={}
def uri(data,mime):return 'data:'+mime+';base64,'+base64.b64encode(data).decode()
def embedded(f):
 if f in cache:return cache[f]
 s=(ROOT/'src'/f).read_text()
 if f=='main.mjs':
  images={str(path.relative_to(ROOT/'public/assets')).removesuffix('.webp'):uri(path.read_bytes(),'image/webp') for path in (ROOT/'public/assets').rglob('*.webp')}
  old='const asset=(kind,id)=>`./public/assets/${kind}/${id}.webp`;'
  assert old in s
  s=s.replace(old,'const assetMap='+json.dumps(images)+';const asset=(kind,id)=>assetMap[`${kind}/${id}`];')
  logo=uri((ROOT/'public/assets/ui/approved-logo.png').read_bytes(),'image/png')
  s=s.replace('./public/assets/ui/approved-logo.png',logo)
  lesson=[uri((ROOT/f'public/assets/ui/lesson-{n}.png').read_bytes(),'image/png') for n in range(8)]
  s='const lessonIcons='+json.dumps(lesson)+';\n'+s
  s=s.replace('./public/assets/ui/lesson-${i}.png','${lessonIcons[i]}')
 def replace(m):return m.group(1)+embedded(Path(m.group(2)).name)+m.group(3)
 s=re.sub(r"(['\"])(\./[a-z0-9-]+\.mjs)(['\"])",replace,s)
 cache[f]=uri(s.encode(),'text/javascript')
 return cache[f]
main=embedded('main.mjs')
css=(ROOT/'src/styles.css').read_text()
art=uri((ROOT/'public/assets/ui/tropical-deck.webp').read_bytes(),'image/webp')
css=css.replace('./../public/assets/ui/tropical-deck.webp',art)
MOCK_JS = r"""
(() => {
 const user='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40);
 const credit=[300,330,315,320,300,345,310,320,325,325], portions=Array(10).fill(30),counts=Array(10).fill(0);
 let balance=0,claimed=false,total=0,last=0,receipt=null;
 const feedIds=[]; const moods=[1,0,1,2,3,2,5,0,5,4],pals=[1,0,2,1,3,1,4,3,0,4],habits=[1,0,1,2,3,2,4,0,4,3];
 const hex=n=>BigInt(n).toString(16).padStart(64,'0');
 const array=xs=>'0x'+xs.map(hex).join('');
 const charTraits=()=>{
  if(!feedIds.length)return [0,0,0];
  const ps=Array(5).fill(0),hs=Array(5).fill(0);
  feedIds.forEach((id,i)=>{ps[pals[id]]+=i+1;hs[habits[id]]+=i+1;});
  function best(scores, fallback){const high=Math.max(...scores);return scores[fallback]==high?fallback:scores.indexOf(high);}
  return [best(ps,pals[last]),moods[last],best(hs,habits[last])];
 };
 window.POLLY_CONFIG={contractAddress:contract,chainId:10143,rpcUrl:'https://fake.monad.local/rpc',explorerUrl:'https://testnet.monadvision.com',pollingMs:100000};
 window.ethereum={request:async ({method,params})=>{
  if(method==='eth_requestAccounts')return [user];
  if(method==='eth_chainId')return '0x279f';
  if(method==='eth_sendTransaction'){
   const d=params[0].data;
   let success=true;
   if(d.startsWith('0x7e9eb487')){if(claimed)success=false;else{claimed=true;balance=500;}}
   else if(d.startsWith('0xe76b854b')){
    const id=Number(BigInt('0x'+d.slice(10,74))),cap=BigInt('0x'+d.slice(74,138));
    const price=BigInt(Math.floor((credit[id]+portions[id]-2)/(portions[id]-1)));
    if(!claimed||cap<price||BigInt(balance)<price)success=false;
    else{balance-=Number(price);credit[id]+=Number(price);portions[id]--;counts[id]++;total++;last=id;feedIds.push(id);if(feedIds.length>10)feedIds.shift();}
   }else success=false;
   receipt={status:success?'0x1':'0x0',transactionHash:'0x'+'e'.repeat(64)};
   return receipt.transactionHash;
  }
  throw Error('Unknown wallet call '+method);
 }};
 const oldFetch=window.fetch;
 window.fetch=async (url,req)=>{
  if(String(url)!=='https://fake.monad.local/rpc')return oldFetch(url,req);
  const {method,params,id}=JSON.parse(req.body);
  let result;
  if(method==='eth_blockNumber')result='0x99';
  else if(method==='eth_getCode')result='0x600160';
  else if(method==='eth_getLogs')result=[];
  else if(method==='eth_getTransactionReceipt')result=receipt;
  else if(method==='eth_call'){
   const selector=params[0].data.slice(0,10);
   if(selector==='0xf1be1679')result=array([...credit,...portions,...counts,...feedIds,...Array(10-feedIds.length).fill(0),feedIds.length,total,last,0]);
   else if(selector==='0xb117fcdc')result=array(charTraits());
   else if(selector==='0xfe5ff468')result=array([balance]);
   else if(selector==='0xc884ef83')result=array([claimed?1:0]);
   else throw Error('Unknown contract call '+selector);
  }else throw Error('Unknown RPC '+method);
  return {ok:true,json:async()=>({jsonrpc:'2.0',id,result})};
 };
})();
"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),args=['--no-sandbox','--disable-web-security'])
 page=browser.new_page(viewport={'width':1440,'height':1000})
 errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<html><head><style>'+css+'</style></head><body><div id="app"></div></body></html>')
 page.evaluate(MOCK_JS)
 page.add_script_tag(type='module',content=f'import "{main}";')
 page.locator('#live').wait_for()
 page.locator('#live').click()
 page.get_by_text('No live proof yet').first.wait_for(timeout=15000) if page.get_by_text('No live proof yet').count() else None
 page.locator('#connect').click()
 page.locator('#claim').click()
 page.wait_for_timeout(300)
 assert '500' in page.locator('.wallet-info').inner_text()
 page.locator('[data-food="0"]').click()
 page.locator('#max-exact').click()
 page.locator('#buy').click()
 page.wait_for_timeout(300)
 assert '1 confirmed feeds' in page.locator('.signal-line').inner_text()
 assert page.get_by_text('The contract and this page agree').count()==1
 assert page.get_by_text('Confirmed on the network.').count()>=1
 page.screenshot(path=str(ROOT/'proof/wallet_mock_flow.png'),full_page=True)
 assert not errors,errors
 print('PASS mocked wallet/RPC: connect, claim, trade, receipt, contract reads and independent trait check')
 print('NOTE: The RPC and wallet were simulated. A real Monad Testnet acceptance run remains required.')
 browser.close()
