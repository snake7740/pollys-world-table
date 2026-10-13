import {readFile,writeFile,mkdir} from 'node:fs/promises';
let solc;try{solc=(await import('solc')).default;}catch{console.error('Install deps with: npm install (requires network or cached npm packages).');process.exit(2);}
const name='PollyFeedMarket';
const content=await readFile(new URL(`../contracts/${name}.sol`,import.meta.url),'utf8');
const input={language:'Solidity',sources:{[name+'.sol']:{content}},settings:{optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input)));
for(const e of out.errors||[])console[e.severity==='error'?'error':'warn'](e.formattedMessage);
if((out.errors||[]).some(e=>e.severity==='error'))process.exit(1);
const artifact=out.contracts[name+'.sol'][name];
await mkdir(new URL('../build/',import.meta.url),{recursive:true});
await writeFile(new URL(`../build/${name}.json`,import.meta.url),JSON.stringify({abi:artifact.abi,bytecode:'0x'+artifact.evm.bytecode.object,compiler:solc.version()},null,2));
console.log('Compiled '+name+' using '+solc.version());
