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
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),args=['--no-sandbox','--disable-web-security'])
 def boot(page):
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content('<html><head><style>'+css+'</style></head><body><div id="app"></div></body></html>')
  page.evaluate("""() => {let mem={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>delete mem[k]}});window.POLLY_CONFIG={contractAddress:'',chainId:10143};} """)
  page.add_script_tag(type='module',content=f'import "{main}";')
  page.locator('.food').first.wait_for(timeout=15000)
  return errors
 page=browser.new_page(viewport={'width':1540,'height':1010},device_scale_factor=1)
 errors=boot(page)
 assert page.locator('.food').count()==10
 assert page.locator('.lesson').count()==8
 assert page.locator('.lesson-art').count()==8
 assert page.locator('.identity-mark img').is_visible()
 photos=page.locator('img').evaluate_all('xs=>xs.map(x=>[x.getAttribute("alt"),x.complete&&x.naturalWidth>0])')
 assert all(ok for name,ok in photos),photos
 print('PASS browser: original parrot, all foods, eight illustrations load')
 shots=ROOT/'proof';shots.mkdir(exist_ok=True)
 page.screenshot(path=str(shots/'desktop_initial.png'),full_page=True)
 page.locator('#claim').click()
 assert '500' in page.locator('.wallet-info').inner_text()
 page.locator('[data-food="0"]').click()
 q1=page.locator('.quote-grid strong').first.inner_text()
 page.locator('#max-exact').click()
 page.locator('#rival').click()
 q2=page.locator('.quote-grid strong').first.inner_text()
 assert q1!=q2,(q1,q2)
 before=page.locator('.signal-line').inner_text()
 page.locator('#buy').click()
 assert 'price rose above your limit' in page.locator('[role=status]').inner_text().lower()
 assert page.locator('.signal-line').inner_text()==before
 print('PASS browser: price moved, old limit rejected, no partial trade')
 page.locator('#max-plus2').click()
 page.locator('#buy').click()
 assert 'Polly got the snack!' in page.locator('[role=status]').inner_text()
 assert '2 confirmed feeds' in page.locator('.signal-line').inner_text()
 assert page.locator('.record').count()==2
 assert page.locator('.sprite').evaluate('i=>i.complete&&i.naturalWidth>0')
 print('PASS browser: claim, live quote preview, buy, feed, market changes and history')
 page.screenshot(path=str(shots/'desktop_trading.png'),full_page=True)
 page.locator('#reset').click()
 assert '0 confirmed feeds' in page.locator('.signal-line').inner_text()
 assert page.locator('.record').count()==0
 print('PASS browser: reset practice')
 m=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 merr=boot(m)
 assert m.locator('.food').count()==10 and m.locator('.lesson').count()==8
 m.screenshot(path=str(shots/'mobile_initial.png'),full_page=True)
 assert not errors and not merr,(errors,merr)
 print('PASS browser: mobile viewport and no JS runtime failures')
 browser.close()
