/* Deterministic public rules: identical chain state -> identical parrot appearance.
   No randomness, backend service, AI inference or hidden personalization. */
export const FOODS = Object.freeze([
  {id:0,key:'apple',   palette:1,mood:1,habit:1},
  {id:1,key:'banana',  palette:0,mood:0,habit:0},
  {id:2,key:'blueberries',palette:2,mood:1,habit:1},
  {id:3,key:'seeds',   palette:1,mood:2,habit:2},
  {id:4,key:'corn',    palette:3,mood:3,habit:3},
  {id:5,key:'veggie',  palette:1,mood:2,habit:2},
  {id:6,key:'oat',     palette:4,mood:5,habit:4},
  {id:7,key:'pumpkin', palette:3,mood:0,habit:0},
  {id:8,key:'rice',    palette:0,mood:5,habit:4},
  {id:9,key:'nuts',    palette:4,mood:4,habit:3}
]);
export const PALETTES=['lagoon','leaf','ocean','coral','plum'];
export const MOODS=['joy','curious','preen','hop','picky','sleepy'];
export const HABITS=['sway','tilt','preen','dance','rest'];
export function emptyState(){return {counts:Array(10).fill(0),recent:[],total:0,lastFood:0,lastFeeder:'',updatedAt:0};}
export function feedLocal(state,foodId){
  if(!Number.isInteger(foodId)||foodId<0||foodId>=10)throw new RangeError('Invalid food');
  const counts=[...state.counts];counts[foodId]++;
  return {counts,recent:[...state.recent,foodId].slice(-10),total:state.total+1,lastFood:foodId,lastFeeder:'local',updatedAt:Date.now()/1000|0};
}
function best(scores, fallback){
  const high=Math.max(...scores);if(high===0)return fallback;
  const ties=scores.reduce((out,n,i)=>(n===high?out.concat(i):out),[]);
  return ties.includes(fallback)?fallback:ties[0];
}
export function derivePolly(state){
  const recent=state.recent.filter(id=>Number.isInteger(id)&&id>=0&&id<10).slice(-10);
  const lastId=recent.length?recent.at(-1):1;
  const paletteScores=Array(5).fill(0), moodScores=Array(6).fill(0), habitScores=Array(5).fill(0);
  recent.forEach((id,i)=>{
    const food=FOODS[id];const weight=i+1; // newer events have more say
    paletteScores[food.palette]+=weight;
    moodScores[food.mood]+=weight;
    habitScores[food.habit]+=weight;
  });
  const last=FOODS[lastId];
  const palette=best(paletteScores,last.palette);
  // Mood is immediate, while colour and habit carry a public short-term memory.
  const mood=recent.length?last.mood:0;
  const habit=best(habitScores,last.habit);
  return {palette:PALETTES[palette],mood:MOODS[mood],habit:HABITS[habit],lastId,
    paletteScore:paletteScores[palette],lastFoods:recent};
}
export function assertGameState(s){
  if(!s||!Array.isArray(s.counts)||s.counts.length!==10||!Array.isArray(s.recent)||s.recent.length>10)throw Error('State shape');
  if(s.counts.some(c=>!Number.isSafeInteger(c)||c<0))throw Error('Invalid counts');
  if(s.recent.some(i=>!Number.isInteger(i)||i<0||i>=10))throw Error('Invalid memory');
  if(s.total<0||s.counts.reduce((x,y)=>x+y,0)!==s.total)throw Error('Count mismatch');
  return s;
}
