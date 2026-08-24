(() => {
"use strict";
const $=s=>document.querySelector(s);
const screens={title:$("#title"),select:$("#select"),battle:$("#battle"),result:$("#result")};
const chars=[
{id:"ren",name:"REN CROSS",jp:"レン・クロス",type:"BALANCE",typejp:"バランス型",age:17,height:172,weapon:"BLADE",attack:30,c:"#1684ff",soft:"#1684ff33",quote:"守るために、強くなる。それだけだ。",unique:{id:"overblade",name:"オーバーブレード",short:"O",kind:"overblade",cd:5000,c:"#27e8ff",desc:"次の攻撃+50。使用後1ターン待機。"},portrait:"ren-portrait.png",selectArt:"ren-select.png",frames:{idle:["ren-idle-1.png","ren-idle-2.png","ren-idle-3.png","ren-idle-4.png"],move:["ren-move-5.png","ren-move-6.png","ren-move-7.png","ren-move-8.png"],attack:["ren-attack-9.png","ren-attack-10.png","ren-attack-11.png","ren-attack-12.png","ren-attack-13.png","ren-attack-14.png","ren-attack-15.png"],overblade:["ren-overblade-16.png","ren-overblade-17.png","ren-overblade-18.png","ren-overblade-19.png","ren-overblade-20.png","ren-overblade-21.png"]}},
{id:"kai",name:"KAI VERDE",jp:"カイ・ヴェルド",type:"SPEED",typejp:"スピード型",age:16,height:170,weapon:"KNIFE",attack:20,c:"#9cff24",soft:"#9cff2433",quote:"俺は止まらない。一歩先、そこにだけ勝ちがある。",unique:{id:"accelstep",name:"アクセルステップ",short:"A",kind:"accel",cd:2200,c:"#9cff24",desc:"一気に2マス移動。次の攻撃+10。"},portrait:"kai-portrait.png",selectArt:"kai-select.png",frames:{idle:["kai-idle-1.png","kai-idle-2.png","kai-idle-3.png","kai-idle-4.png"],move:["kai-move-5.png","kai-move-6.png","kai-move-7.png","kai-move-8.png"],attack:["kai-attack-9.png","kai-attack-10.png","kai-attack-11.png","kai-attack-12.png","kai-attack-13.png","kai-attack-14.png","kai-attack-15.png","kai-attack-16.png"],accel:["kai-accel-17.png","kai-accel-18.png","kai-accel-19.png","kai-accel-20.png","kai-accel-21.png","kai-accel-22.png"]}}
];
const common=[
{id:"sword",name:"ソード",short:"S",kind:"attack",damage:40,range:1,forwardOnly:true,cd:900,c:"#ff9f24",desc:"前方1マスに40ダメージ。",art:"chip-sword.png"},
{id:"shot",name:"ショット",short:"S",kind:"attack",damage:20,range:3,forwardOnly:true,cd:800,c:"#28a8ff",desc:"前方3マス以内に20ダメージ。",art:"chip-shot.png"},
{id:"shield",name:"シールド",short:"G",kind:"shield",cd:1400,c:"#6dff8e",desc:"前方からの次のダメージを50%軽減。",art:"chip-shield.png"},
{id:"dash",name:"ダッシュ",short:"D",kind:"dash",distance:2,cd:1200,c:"#ff9d20",desc:"向いている方向へ2マス移動。",art:"chip-dash.png"},
{id:"recover",name:"リカバー",short:"R",kind:"heal",heal:30,cd:1800,c:"#42ff9b",desc:"HPを30回復する。",art:"chip-recover.png"}
];
let state={char:null,b:null,selected:null,timer:null,ai:null,motionTimer:null,motionToken:0,lastUi:0,motionSrc:null};
const show=n=>Object.keys(screens).forEach(k=>screens[k].hidden=k!==n);
const distance=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c);
const inBounds=(r,c)=>r>=0&&r<5&&c>=0&&c<5;
const dirDelta=f=>({up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]}[f]||[0,0]);
const direction=(dr,dc)=>dr===-1?"up":dr===1?"down":dc===-1?"left":dc===1?"right":null;
const stepPos=(p,f,n)=>{const d=dirDelta(f);return{r:p.r+d[0]*n,c:p.c+d[1]*n}};
const inLineRange=(a,b,range=3)=>{const dr=b.r-a.r,dc=b.c-a.c;if(dr!==0&&dc!==0)return false;const d=Math.max(Math.abs(dr),Math.abs(dc));return d>=1&&d<=range};
const inForwardRange=(a,b,range=1)=>{const d=dirDelta(a.f),dr=b.r-a.r,dc=b.c-a.c;for(let n=1;n<=range;n++)if(dr===d[0]*n&&dc===d[1]*n)return true;return false};
const all=()=>[state.char.unique,...common];
function log(t,k=""){const e=document.createElement("div");e.className="entry "+k;e.textContent=t;$("#log").prepend(e)}
function msg(t){$("#msg").textContent=t}
function time(ms){const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function preload(){chars.forEach(c=>Object.values(c.frames).flat().forEach(src=>{const i=new Image();i.src=src}));[...common.map(x=>x.art),"ren-portrait.png","kai-portrait.png","ren-select.png","kai-select.png"].forEach(src=>{const i=new Image();i.src=src})}
function currentFrame(kind="idle",i=0){const a=state.char.frames[kind]||state.char.frames.idle;return a[i%a.length]}
function setMotionFrame(src){state.motionSrc=src;const gridImg=$("#player-actor-img");if(gridImg)gridImg.src=src}
function stopMotion(){if(state.motionTimer)clearInterval(state.motionTimer);state.motionTimer=null;state.motionToken++}
function playMotion(kind,caption,opts={}){
 stopMotion();const frames=state.char.frames[kind]||state.char.frames.idle;const token=++state.motionToken;let i=0;setMotionFrame(frames[0]);
 if(frames.length===1)return;
 state.motionTimer=setInterval(()=>{if(token!==state.motionToken)return;i++;if(i>=frames.length){if(opts.loop){i=0}else{clearInterval(state.motionTimer);state.motionTimer=null;setMotionFrame(state.char.frames.idle[0]);return}}setMotionFrame(frames[i])},opts.speed||95)
}
function startIdle(){playMotion("idle","待機",{loop:true,speed:220})}
function renderChars(){
 const box=$("#chars");box.innerHTML="";
 chars.forEach(c=>{const a=document.createElement("article");a.className="char panel";a.style.setProperty("--accent",c.c);a.style.setProperty("--soft",c.soft);a.innerHTML=`<div class="char-visual"><img src="${c.selectArt}" alt="${c.name}"><div class="char-tag">${c.type} / ${c.weapon}</div></div><div class="char-info"><div class="eyebrow">${c.type} / ${c.weapon}</div><h2>${c.name}</h2><small>${c.jp} — ${c.typejp}</small><p class="quote">「${c.quote}」</p><div class="stats"><div>AGE<b>${c.age}</b></div><div>HEIGHT<b>${c.height}cm</b></div><div>NORMAL ATK<b>${c.attack} / FRONT 1</b></div><div>ABILITY<b>${c.id==="ren"?"OVERDRIVE":"STEP"}</b></div></div><div class="unique-preview"><img src="${c.unique.id==="overblade"?"chip-overblade.png":"chip-accelstep.png"}"><div><span>UNIQUE CHIP</span><b>${c.unique.name}</b><small>${c.unique.desc}</small></div></div><footer><span>SELECT CHARACTER</span><button class="cyber" type="button">SELECT</button></footer></div>`;a.querySelector("button").addEventListener("pointerup",e=>{e.preventDefault();e.stopPropagation();start(c)},{passive:false});a.addEventListener("pointerup",e=>{if(e.target.closest("button"))return;e.preventDefault();start(c)},{passive:false});box.appendChild(a)})
}
function start(c){
 stop();state.char=c;state.selected=null;state.motionSrc=c.frames.idle[0];state.lastUi=0;
 state.b={status:"playing",started:performance.now(),elapsed:0,turn:1,p:{r:4,c:2,hp:100,f:"up",shield:false,bonus:0,next:0,cd:{},waitTurns:0,step:false},e:{r:0,c:2,hp:100,f:"down",cd:0}};
 $("#log").innerHTML="";show("battle");$("#battle-character-portrait").src=c.portrait;
 log("BATTLE START");msg("隣接するマスをタップして移動。攻撃はキャラの正面のみ。ショットだけ前方3マス。");renderAll();startIdle();state.timer=requestAnimationFrame(tick);state.ai=setInterval(ai,900)
}
function stop(){if(state.timer)cancelAnimationFrame(state.timer);if(state.ai)clearInterval(state.ai);stopMotion();state.timer=null;state.ai=null}
function tick(){const b=state.b;if(!b||b.status!=="playing")return;b.elapsed=performance.now()-b.started;const nt=Math.floor(b.elapsed/5000)+1;if(nt!==b.turn){b.turn=nt;if(b.p.waitTurns>0)b.p.waitTurns--;if(state.char.id==="kai"){b.p.step=false;b.p.bonus=0;log("KAI STEP RESET")}}if(b.elapsed-state.lastUi>250){state.lastUi=b.elapsed;renderHud();renderGrid();renderChips()}state.timer=requestAnimationFrame(tick)}
function renderHud(){const b=state.b;if(!b)return;$("#pn").textContent=state.char.name.split(" ")[0];$("#pt").textContent=state.char.type;$("#pht").textContent=`${b.p.hp} / 100`;$("#eht").textContent=`${b.e.hp} / 100`;$("#phb").style.width=b.p.hp+"%";$("#ehb").style.width=b.e.hp+"%";$("#turn").textContent="TURN "+String(b.turn).padStart(2,"0");$("#time").textContent=time(b.elapsed);$("#pst").textContent=state.char.id==="ren"&&b.p.hp<=30?"OVERDRIVE ACTIVE":b.p.waitTurns>0?"WAIT 1 TURN":b.p.shield?"SHIELD ACTIVE":state.char.id==="kai"&&b.p.step?"STEP READY":"READY";$("#est").textContent=b.e.hp<=0?"DESTROYED":"SEARCHING";$("#dist").textContent=distance(b.p,b.e);const ch=all().find(q=>q.id===state.selected);$("#next").textContent=ch?ch.name.toUpperCase():"MOVE"}
function renderAll(){renderHud();renderGrid();renderChips()}
function renderGrid(){
 const g=$("#grid"),b=state.b;if(!g||!b)return;g.innerHTML="";const ch=all().find(q=>q.id===state.selected);
 for(let r=0;r<5;r++)for(let c=0;c<5;c++){
  const pos={r,c},x=document.createElement("button");x.type="button";x.className="cell "+(r>=3?"playerzone":"enemyzone")+(r===2?" boundary":"");x.dataset.r=r;x.dataset.c=c;const d=distance(b.p,pos),ep=r===b.e.r&&c===b.e.c,pp=r===b.p.r&&c===b.p.c;
  if(!pp&&!ep&&d===1)x.classList.add("move");
  if(ch?.kind==="attack"&&ch.forwardOnly&&inForwardRange(b.p,pos,ch.range))x.classList.add("range");
  x.innerHTML=`<span class="coord">${r+1}-${c+1}</span>`;
  if(pp)x.innerHTML+=`<span class="ring"></span><span class="actor"><img id="player-actor-img" src="${state.motionSrc||currentFrame()}" alt="${state.char.name}"></span>`;
  if(ep)x.innerHTML+=`<span class="ring enemy-ring"></span><span class="actor enemyactor"><span class="cpu-bot">●</span></span>`;
  x.addEventListener("pointerup",cellClick,{passive:false});g.appendChild(x)
 }
}
function renderChips(){
 const box=$("#chiplist");box.innerHTML="";all().forEach(ch=>{const rem=Math.max(0,(state.b.p.cd[ch.id]||0)-performance.now());const disabled=rem>0||state.b.p.waitTurns>0;const x=document.createElement("button");x.type="button";x.className="chip "+(state.selected===ch.id?"sel ":"")+(disabled?"off":"");x.style.setProperty("--c",ch.c);x.innerHTML=`<div class="chip-art"><img src="${ch.art|| (ch.id==="overblade"?"chip-overblade.png":"chip-accelstep.png")}" alt="${ch.name}"></div><div class="chip-body"><span class="meta">${rem?(rem/1000).toFixed(1)+"s":state.b.p.waitTurns?"WAIT":"READY"}</span><div class="chip-top"><span class="icon">${ch.short}</span><span class="chipname">${ch.name}</span></div><div class="desc">${ch.desc}</div></div>`;x.addEventListener("pointerup",e=>{e.preventDefault();e.stopPropagation();if(disabled)return;if(ch.kind==="shield"||ch.kind==="heal"){useChip(ch);return}state.selected=state.selected===ch.id?null:ch.id;$("#chipmode").textContent=state.selected?`${ch.name} SELECTED`:`Choose an action`;renderAll()},{passive:false});box.appendChild(x)})
}
function flashActor(){const img=$("#player-actor-img");if(img){img.parentElement.classList.remove("attack-flash");void img.parentElement.offsetWidth;img.parentElement.classList.add("attack-flash")}}
function isFrontOfPlayer(attacker){return inForwardRange(state.b.p,attacker,3)}
function damage(side,n,src,attacker=null){const t=state.b[side];let v=n;if(side==="p"&&t.shield&&attacker&&isFrontOfPlayer(attacker)){v=Math.ceil(v*.5);t.shield=false;log("SHIELD REDUCED DAMAGE","good")}t.hp=Math.max(0,t.hp-v);log(src+" → "+v+" DAMAGE","damage");if(side==="e")flashActor();win()}
function normalAttack(){const b=state.b;if(b.p.waitTurns>0){msg("このターンは行動できません。");return}if(!inForwardRange(b.p,b.e,1)){msg("通常攻撃は正面1マスです。向きを変えてください。");log("NORMAL ATTACK — FRONT 1 ONLY","warn");return}const bonus=state.char.id==="ren"&&b.p.hp<=30?10:0;const n=state.char.attack+bonus+b.p.bonus+b.p.next;b.p.bonus=0;b.p.next=0;playMotion("attack","通常攻撃",{speed:85});damage("e",n,"NORMAL ATTACK");if(state.char.id==="kai"){b.p.step=true;msg("KAI STEP READY — 攻撃後に1マス移動可能。");log("KAI STEP AVAILABLE","good")}}
function moveTo(r,c){const b=state.b;if(b.p.waitTurns>0){msg("このターンは待機中です。");return}if(distance(b.p,{r,c})!==1){msg("移動は1マスです。");log("MOVE BLOCKED — 1 SQUARE ONLY","warn");return}if(r===b.e.r&&c===b.e.c){msg("敵のマスには移動できません。");return}const dr=r-b.p.r,dc=c-b.p.c;b.p.f=direction(dr,dc)||b.p.f;b.p.r=r;b.p.c=c;playMotion("move","移動",{speed:120});log(state.char.id.toUpperCase()+" MOVED");msg("移動完了。正面1マスが通常攻撃ラインです。");renderAll()}
function useChip(ch){const b=state.b;if(b.p.waitTurns>0){msg("このターンは待機中です。");return}if((b.p.cd[ch.id]||0)>performance.now()){msg("クールダウン中です。");return}
 if(ch.kind==="attack"){
  if(!inForwardRange(b.p,b.e,ch.range)){msg(ch.id==="shot"?"ショットは正面3マス以内です。":"ソードは正面1マスです。向きを変えてください。");log(ch.name+" — OUT OF RANGE","warn");return}
  const n=ch.damage+b.p.bonus+b.p.next;b.p.bonus=0;b.p.next=0;playMotion("attack",ch.name+" 攻撃",{speed:80});damage("e",n,ch.name.toUpperCase())
 } else if(ch.kind==="shield"){b.p.shield=true;log("SHIELD ACTIVE","good");msg("正面からの次のダメージを50%軽減。")
 } else if(ch.kind==="heal"){const old=b.p.hp;b.p.hp=Math.min(100,b.p.hp+30);log("RECOVER +"+(b.p.hp-old)+" HP","good");msg("HPを30回復。")
 } else if(ch.kind==="dash"||ch.kind==="accel"){
  const p=stepPos(b.p,b.p.f,2);if(!inBounds(p.r,p.c)||p.r===b.e.r&&p.c===b.e.c){msg("その方向には2マス移動できません。");return}b.p.r=p.r;b.p.c=p.c;
  if(ch.kind==="accel"){b.p.bonus=10;playMotion("accel","アクセルステップ",{speed:85})}else playMotion("move","ダッシュ",{speed:75});
  log(ch.name.toUpperCase()+" — 2 SQUARES","good");msg(ch.kind==="accel"?"2マス移動。次の攻撃+10。":"正面へ2マスダッシュ。")
 } else if(ch.kind==="overblade"){
  b.p.next+=50;b.p.waitTurns=1;playMotion("overblade","オーバーブレード",{speed:90});log("OVER BLADE — NEXT ATTACK +50 / WAIT 1 TURN","good");msg("次の攻撃+50。使用後1ターン待機。")
 }
 b.p.cd[ch.id]=performance.now()+ch.cd;state.selected=null;$("#chipmode").textContent="Choose an action";renderAll();win()
}
function cellClick(e){e.preventDefault();const b=state.b,r=+e.currentTarget.dataset.r,c=+e.currentTarget.dataset.c,ep=r===b.e.r&&c===b.e.c,ch=all().find(q=>q.id===state.selected);$("#dist").textContent=distance(b.p,{r,c});
 if(ch){if(ch.kind==="attack"&&ep)useChip(ch);else if(ch.kind==="dash"||ch.kind==="accel"||ch.kind==="overblade")useChip(ch);else msg("このチップは対象指定不要です。");return}
 if(ep){normalAttack();return}
 if(state.char.id==="kai"&&b.p.step&&distance(b.p,{r,c})===1){const dr=r-b.p.r,dc=c-b.p.c;b.p.f=direction(dr,dc)||b.p.f;b.p.r=r;b.p.c=c;b.p.step=false;playMotion("move","ステップ移動",{speed:100});log("KAI STEP — 1 SQUARE","good");msg("ステップ移動。");renderAll();return}
 moveTo(r,c)
}
function ai(){const b=state.b;if(!b||b.status!=="playing")return;const d=distance(b.e,b.p);if(inLineRange(b.e,b.p,3)){damage("p",15,"CPU ATTACK",{r:b.e.r,c:b.e.c});return}if(d<=1)return;const options=[{r:b.e.r+Math.sign(b.p.r-b.e.r),c:b.e.c},{r:b.e.r,c:b.e.c+Math.sign(b.p.c-b.e.c)}].filter(p=>inBounds(p.r,p.c)&&!(p.r===b.p.r&&p.c===b.p.c));const q=options.find(p=>distance(p,b.p)<d);if(q){b.e.f=direction(b.p.r-b.e.r,b.p.c-b.e.c)||b.e.f;b.e.r=q.r;b.e.c=q.c;log("CPU MOVED");renderGrid();renderHud()}}
function win(){const b=state.b;if(b.e.hp<=0)end("victory");else if(b.p.hp<=0)end("defeat")}
function end(r){state.b.status=r;stop();$("#resultlabel").textContent=r==="victory"?"VICTORY":"DEFEAT";$("#resultlabel").className="resultlabel "+r;$("#summary").textContent=r==="victory"?"ENEMY UNIT DESTROYED.":"SWEEPER UNIT DOWN.";$("#rc").textContent=state.char.name.split(" ")[0];$("#rt").textContent=time(state.b.elapsed);$("#rh").textContent=state.b.p.hp;show("result")}
$("#new").addEventListener("pointerup",e=>{e.preventDefault();show("select")},{passive:false});
$("#clear").addEventListener("pointerup",e=>{e.preventDefault();state.selected=null;$("#chipmode").textContent="Choose an action";renderAll()},{passive:false});
$("#rematch").addEventListener("pointerup",e=>{e.preventDefault();start(state.char)},{passive:false});
$("#titlebtn").addEventListener("pointerup",e=>{e.preventDefault();stop();show("title")},{passive:false});
renderChars();preload();show("title");
window.addEventListener("error",e=>console.error("[SWEEPER C]",e.error||e.message));
window.addEventListener("unhandledrejection",e=>console.error("[SWEEPER C]",e.reason));
})();
