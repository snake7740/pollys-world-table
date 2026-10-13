import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const DUR=240.88;
const KEEP_TAIL=0.5;
const spans=JSON.parse(readFileSync('spans.json','utf8'));
const caps=[
 "Polly's World Table  -  Feed & Trade Lab",
 'Practice mode: the same rules, no wallet needed',
 'A quote, a limit you choose, a trade that settles or does not',
 'Another buyer acts first',
 'The stale limit is refused, and nothing changed',
 'Now the same flow against the real contract on Monad Testnet',
 'Connecting a wallet and reading live reserves',
 'A purchase settles on chain',
 'The public trade history, with its receipt',
 'The contract and the transaction on the block explorer',
 'The wallet popup is an injected testnet signer. Every quote, trade and revert shown is real.'
];
const weights=[7,9,7,4,12,7,11,12,9,43,10];
const wsum=weights.reduce((a,b)=>a+b,0);

// Keep segments: everything outside a frozen span, plus the first KEEP_TAIL seconds of each span.
const segs=[];
let cursor=0;
for(const [a,b] of spans){
  const keepTo=Math.min(a+KEEP_TAIL,DUR);
  if(keepTo>cursor)segs.push([cursor,keepTo]);
  cursor=Math.max(cursor,b);
}
if(cursor<DUR)segs.push([cursor,DUR]);

const newDur=segs.reduce((s,[a,b])=>s+(b-a),0);
const mapTime=t=>{
  let acc=0;
  for(const [a,b] of segs){
    if(t<=b)return acc+Math.max(0,t-a);
    acc+=b-a;
  }
  return newDur;
};

const f=x=>{const h=Math.floor(x/3600),m=Math.floor(x%3600/60),s=(x%60).toFixed(2).padStart(5,'0');
  return h+':'+String(m).padStart(2,'0')+':'+s;};

let t=0;
const lines=['[Script Info]','ScriptType: v4.00+','PlayResX: 1440','PlayResY: 900','WrapStyle: 0','ScaledBorderAndShadow: yes',
 '[V4+ Styles]',
 'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV',
 'Style: Cap,Segoe UI,44,&H00FFFFFF,&H00102030,&H80000000,-1,3,3,0,2,60,60,54',
 '[Events]','Format: Layer, Start, End, Style, Text'];
caps.forEach((c,i)=>{
  const span=DUR*weights[i]/wsum;
  const st=mapTime(t+0.3), en=mapTime(t+span-0.3);
  if(en>st)lines.push('Dialogue: 0,'+f(st)+','+f(en)+',Cap,'+c);
  t+=span;
});
writeFileSync('demo-cut.ass',lines.join('\n'));

const parts=segs.map(([a,b],i)=>`[0:v]trim=start=${a.toFixed(3)}:end=${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`);
const concat=segs.map((_,i)=>`[v${i}]`).join('')+`concat=n=${segs.length}:v=1:a=0[vv]`;
const filter=parts.join(';')+';'+concat+';[vv]ass=demo-cut.ass[outv]';

const src=readFileSync('spans.json','utf8') && null;
const webm=execFileSync('bash',['-c',"ls -S *.webm | head -1"]).toString().trim();
console.log('segments kept:',segs.length,'| new duration:',newDur.toFixed(1),'s (limit 180)');
console.log('captions written:',lines.length-8);
writeFileSync('filter.txt',filter);
execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',webm,
  '-filter_complex_script','filter.txt','-map','[outv]',
  '-c:v','libx264','-preset','medium','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',
  'polly-demo-subtitled.mp4'],{stdio:'inherit'});
console.log('encoded polly-demo-subtitled.mp4');
