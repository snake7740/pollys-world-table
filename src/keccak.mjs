/* Dependency-free Ethereum Keccak-256 (distinct from FIPS SHA3-256).
   Included so an npm installation is unnecessary for the browser UI. */
const MASK=(1n<<64n)-1n;
const R=[0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
const RC=[
  '0000000000000001','0000000000008082','800000000000808a','8000000080008000',
  '000000000000808b','0000000080000001','8000000080008081','8000000000008009',
  '000000000000008a','0000000000000088','0000000080008009','000000008000000a',
  '000000008000808b','800000000000008b','8000000000008089','8000000000008003',
  '8000000000008002','8000000000000080','000000000000800a','800000008000000a',
  '8000000080008081','8000000000008080','0000000080000001','8000000080008008'
].map(x=>BigInt('0x'+x));
const rot=(v,n)=>n===0?v:((v<<BigInt(n))|(v>>BigInt(64-n)))&MASK;
function permute(a){
  for(const k of RC){
    const c=Array.from({length:5},(_,x)=>a[x]^a[x+5]^a[x+10]^a[x+15]^a[x+20]);
    for(let x=0;x<5;x++){
      const d=c[(x+4)%5]^rot(c[(x+1)%5],1);
      for(let y=0;y<5;y++) a[x+5*y]^=d;
    }
    const b=Array(25).fill(0n);
    for(let x=0;x<5;x++)for(let y=0;y<5;y++){
      const from=x+5*y;const to=y+5*((2*x+3*y)%5);b[to]=rot(a[from],R[from]);
    }
    for(let x=0;x<5;x++)for(let y=0;y<5;y++){
      a[x+5*y]=b[x+5*y]^((~b[(x+1)%5+5*y])&b[(x+2)%5+5*y]);
    }
    a[0]^=k;
  }
}
export function keccak256(input){
  const bytes=typeof input==='string'?new TextEncoder().encode(input):new Uint8Array(input);
  const rate=136,blocks=Math.ceil((bytes.length+1)/rate),pad=new Uint8Array(blocks*rate);
  pad.set(bytes);pad[bytes.length]=1;pad[pad.length-1]|=0x80;
  const a=Array(25).fill(0n);
  for(let pos=0;pos<pad.length;pos+=rate){
    for(let j=0;j<rate;j++)a[Math.floor(j/8)]^=BigInt(pad[pos+j])<<BigInt(8*(j%8));
    permute(a);
  }
  const out=[];
  for(let i=0;i<32;i++)out.push(Number((a[Math.floor(i/8)]>>BigInt(8*(i%8)))&255n));
  return '0x'+out.map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function selector(signature){return keccak256(signature).slice(0,10);}
export function word(n){return BigInt(n).toString(16).padStart(64,'0');}
