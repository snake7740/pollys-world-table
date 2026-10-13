import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const palettes=['lagoon','leaf','ocean','coral','plum'];
const moods=['joy','curious','preen','hop','picky','sleepy'];
const foods=['apple','banana','blueberries','seeds','corn','veggie','oat','pumpkin','rice','nuts'];
const required=[...palettes.flatMap(p=>[`stand-${p}.webp`,...moods.map(m=>`${m}-${p}.webp`)].map(x=>`polly/${x}`)),...foods.map(f=>`foods/${f}.webp`)];
const ui=['ui/approved-logo.png','ui/tropical-deck.webp',...Array.from({length:8},(_,i)=>`ui/lesson-${i}.png`)];
const missing=[...required,...ui].filter(x=>!existsSync(join(root,'public/assets',x)));
if(missing.length){console.error('Missing assets:',missing);process.exit(1);}
console.log(`PASS: ${required.length+ui.length} required images, correct paths`);
