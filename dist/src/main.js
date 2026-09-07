import {HABITATS,getHabitat,SPECIES} from './habitats.js?v=14';
import {Simulation,pathPoint} from './simulation.js?v=14';
import {bindJoystick} from './input.js?v=14';
import {t,setLanguage,getLanguage,localizedHabitat} from './i18n.js?v=14';
const $=s=>document.querySelector(s);
const joystick=bindJoystick($('#joystick'));
const DEFAULT_KEYS={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',rise:'KeyQ',dive:'KeyE',boost:'ShiftLeft',food:'Space',recover:'KeyR'};
let bindings={...DEFAULT_KEYS,...JSON.parse(localStorage.getItem('tankrush-keys')||'{}')};
const keyLabel=code=>({Space:'Space',ShiftLeft:'L Shift',ShiftRight:'R Shift',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'})[code]||code.replace(/^(Key|Digit)/,'');
function clearControls(){keys.clear();touch.clear();joystick.reset();document.querySelectorAll('[data-control].active').forEach(b=>b.classList.remove('active'));}
const keys=new Set(),touch=new Set();let sim=new Simulation('aquarium'),view,frameStarted=false,pausedFrom='racing',last=0,accumulator=0,lastEvent=null,toastUntil=0,activeWorld='amazon',audioOn=false,audioContext=null,osc=null,gain=null,deferredInstall=null;
const timeString=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
function fatal(error){console.error(error);frameStarted=false;$('#fatal-message').textContent=error?.message||'De race kon niet verder. Probeer de pagina opnieuw te openen.';$('#fatal').hidden=false;$('#menu').hidden=true;$('#start').disabled=true;}
addEventListener('error',event=>fatal(event.error||new Error(event.message)));
addEventListener('unhandledrejection',event=>fatal(event.reason||new Error('Onbekende laadfout')));
let starting=false;
const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
let viewPromise,previewTicket=0,previewPending=false;
async function ensureView(){
 if(view)return;
 if(!viewPromise)viewPromise=import('./scene.js?v=14').then(({RaceScene})=>{view=new RaceScene($('#game'));view.setQuality($('#quality').value);}).catch(e=>{viewPromise=null;throw e;});
 await viewPromise;
}
function runFrames(){if(!frameStarted&&!document.hidden){frameStarted=true;last=0;requestAnimationFrame(frame);}}
async function showRoom(){
 const ticket=++previewTicket;previewPending=true;
 $('#preview-status').hidden=false;$('#preview-status').textContent=t('roomLoading');
 try{
  await paint();let timer;try{await Promise.race([ensureView(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Kamer laden duurt te lang')),20000);})]);}finally{clearTimeout(timer);}
  if(ticket!==previewTicket||starting||sim.phase!=='menu')return;
  if(view.habitat?.id!==activeWorld)view.setWorld(sim);
  view.update(sim,0,true);document.body.classList.add('scene-ready');$('#preview-status').hidden=true;previewPending=false;runFrames();
 }catch(e){if(ticket!==previewTicket)return;previewPending=false;console.warn(e);$('#preview-status').textContent='De kamer kon niet laden. Start de race om opnieuw te proberen.';}
}
const lastSelection={aquarium:'amazon',terrarium:'outback'};
function renderHabitats(kind){
 const entries=HABITATS.filter(h=>h.kind===kind);$('#habitat-options').replaceChildren(...entries.map(h=>{
  const b=document.createElement('button');b.type='button';b.className='habitat-option';b.dataset.habitat=h.id;b.classList.toggle('selected',h.id===activeWorld);b.setAttribute('aria-pressed',String(h.id===activeWorld));
  const localized=localizedHabitat(h),title=document.createElement('strong'),detail=document.createElement('small');title.textContent=h.name;detail.textContent=`${localized.region} · ${localized.shapeLabel}`;b.append(title,detail);b.addEventListener('click',()=>setMode(h.id));return b;
 }));
}
function setMode(key){
 const h=getHabitat(key),localized=localizedHabitat(h);activeWorld=h.id;lastSelection[h.kind]=h.id;sim=new Simulation(h.id);document.body.classList.toggle('terrarium',h.kind==='terrarium');document.body.style.setProperty('--lime','#'+h.palette.accent.toString(16).padStart(6,'0'));
 document.querySelectorAll('[data-world]').forEach(b=>{const selected=b.dataset.world===h.kind;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 renderHabitats(h.kind);$('#habitat-name').textContent=h.name;$('#habitat-description').textContent=localized.description;$('#tank-spec').textContent=`${localized.shapeLabel} · ${h.size}`;$('#species-list').replaceChildren(...h.roster.map(id=>{const item=document.createElement('span');item.textContent=getLanguage()==='nl'?SPECIES[id].name:SPECIES[id].latin;item.title=SPECIES[id].latin;return item;}));
 $('#habitat-label').querySelector('span').textContent=`${h.kind.toUpperCase()} / ${localized.region.toUpperCase()}`;$('#habitat-label').querySelector('strong').textContent=h.name.split(' · ')[1];$('#habitat-label').querySelector('small').textContent=localized.shapeLabel;
 showRoom();$('#vehicle-hint').textContent=h.kind==='aquarium'?`${keyLabel(bindings.rise)} / ${keyLabel(bindings.dive)} ${t('aquariumHint')}`:t('terrariumHint');document.querySelectorAll('[data-control="rise"],[data-control="dive"]').forEach(b=>b.hidden=h.kind!=='aquarium');

}
async function startRace(){
 if(starting)return;starting=true;++previewTicket;$('#loading-error').hidden=true;
 closeDialogs();clearControls();$('#start').disabled=true;$('#start').textContent=t('raceLoading');
 $('#loading').hidden=false;$('#loading-status').textContent=t('raceLoading');
 document.querySelectorAll('[data-world],.habitat-option').forEach(b=>b.disabled=true);
 try{
  await paint();
  let timeout;try{await Promise.race([ensureView(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Het laden duurt te lang. Controleer je verbinding en probeer opnieuw.')),20000);})]);}finally{clearTimeout(timeout);}
  $('#loading-status').textContent=t('worldLoading');await paint();
  sim=new Simulation(activeWorld);sim.start();lastEvent=null;if(view.habitat?.id!==activeWorld)view.setWorld(sim);view.cameraReady=false;
  $('#loading-status').textContent=t('frameLoading');await paint();
  view.update(sim,0,false,1);if(view.renderer.getContext().isContextLost())throw new Error('De browser heeft de 3D-weergave onderbroken. Open de pagina opnieuw.');
  document.body.classList.add('racing','scene-ready');$('#preview-status').hidden=true;$('#menu').hidden=true;$('#habitat-label').hidden=true;$('#menu-footer').hidden=true;$('#hud').hidden=false;$('#pause').hidden=false;$('#touch-controls').hidden=!matchMedia('(any-pointer:coarse)').matches;$('#countdown').textContent='3';accumulator=0;last=0;
  if(!frameStarted){frameStarted=true;requestAnimationFrame(frame);}if(audioOn)ensureAudio();
 }catch(e){console.error(e);$('#loading-error').textContent=e.message||'De race kon niet starten. Probeer opnieuw.';$('#loading-error').hidden=false;}
 finally{starting=false;previewPending=false;$('#loading').hidden=true;$('#start').disabled=false;$('#start').innerHTML=`${t('start')} <span>→</span>`;document.querySelectorAll('[data-world],.habitat-option').forEach(b=>b.disabled=false);}
}
function menu(){if(gain)gain.gain.value=0;closeDialogs();clearControls();document.body.classList.remove('racing');$('#hud').hidden=true;$('#pause').hidden=true;$('#touch-controls').hidden=true;$('#menu').hidden=false;$('#habitat-label').hidden=false;$('#menu-footer').hidden=false;setMode(activeWorld);}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function pause(){if(!['racing','countdown'].includes(sim.phase))return;pausedFrom=sim.phase;sim.phase='paused';clearControls();$('#pause-dialog').showModal();}
function resume(){if(sim.phase!=='paused')return;if(!frameStarted){frameStarted=true;last=0;requestAnimationFrame(frame);}$('#pause-dialog').close();sim.phase=pausedFrom;accumulator=0;}
function finish(){if($('#results-dialog').open)return;const ranking=sim.ranking(),place=ranking.findIndex(r=>r.id===0)+1;$('#result-title').textContent=place===1?'Bovenaan de voedselketen.':`P${place}. Je hebt het overleefd.`;$('#result-time').textContent=`${sim.config.title} · 3 rondes · ${timeString(sim.racers[0].finishTime)}`;$('#standings').replaceChildren(...ranking.map((r,i)=>{const li=document.createElement('li');li.className=r.id===0?'you':'';const a=document.createElement('span'),b=document.createElement('span');a.textContent=`${i+1}. ${r.name}`;b.textContent=r.finished?timeString(r.finishTime):`Ronde ${Math.min(r.lap,3)} · nog onderweg`;li.append(a,b);return li;}));$('#results-dialog').showModal();beep(660,.3);clearControls();}
document.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>setMode(lastSelection[b.dataset.world])));
function saveBindings(){localStorage.setItem('tankrush-keys',JSON.stringify(bindings));updateBindingUI();}
function updateBindingUI(){
 $('#key-bindings').replaceChildren(...Object.keys(DEFAULT_KEYS).map(action=>{const b=document.createElement('button');b.type='button';b.className='key-binding';b.dataset.action=action;b.innerHTML=`<span>${t(action)}</span><kbd>${keyLabel(bindings[action])}</kbd>`;b.addEventListener('click',()=>{b.classList.add('listening');b.querySelector('kbd').textContent=t('waiting');addEventListener('keydown',e=>{e.preventDefault();if(e.code==='Escape'){updateBindingUI();return;}const other=Object.keys(bindings).find(k=>k!==action&&bindings[k]===e.code);if(other)bindings[other]=bindings[action];bindings[action]=e.code;saveBindings();},{once:true,capture:true});});return b;}));
 $('#drive-keys').textContent=[bindings.forward,bindings.left,bindings.back,bindings.right].map(keyLabel).join(' · ');$('#recover-key').textContent=keyLabel(bindings.recover);
}
function applyLanguage(language){setLanguage(language);$('#language').value=getLanguage();updateBindingUI();setMode(activeWorld);}
let settingsPaused=false;
$('#settings').addEventListener('click',()=>{settingsPaused=['racing','countdown'].includes(sim.phase);if(settingsPaused){pausedFrom=sim.phase;sim.phase='paused';clearControls();}$('#settings-dialog').showModal();});
$('#settings-dialog').addEventListener('close',()=>{if(settingsPaused&&sim.phase==='paused'){sim.phase=pausedFrom;accumulator=0;runFrames();}settingsPaused=false;});
$('#language').addEventListener('change',e=>applyLanguage(e.target.value));
$('#quality').value=localStorage.getItem('tankrush-quality')||'high';$('#quality').addEventListener('change',()=>{localStorage.setItem('tankrush-quality',$('#quality').value);if(view)view.setQuality($('#quality').value);});
$('#fullscreen').addEventListener('click',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.());
$('#reset-bindings').addEventListener('click',()=>{bindings={...DEFAULT_KEYS};saveBindings();setMode(activeWorld);});
$('#start').addEventListener('click',startRace);$('#help').addEventListener('click',()=>$('#info-dialog').showModal());document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));$('#pause').addEventListener('click',pause);$('#resume').addEventListener('click',resume);$('#restart').addEventListener('click',startRace);$('#race-again').addEventListener('click',startRace);$('#back-menu').addEventListener('click',menu);$('#choose-world').addEventListener('click',menu);$('#food').addEventListener('click',()=>sim.dropFood());$('#touch-food').addEventListener('click',()=>sim.dropFood());$('#pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('#results-dialog').addEventListener('cancel',e=>{e.preventDefault();menu();});
$('#touch-reset').addEventListener('click',()=>{if(sim.phase==='racing'){clearControls();sim.resetRacer();}});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('#info-dialog').open&&!$('#results-dialog').open&&!$('#settings-dialog').open){e.preventDefault();if(sim.phase==='paused')resume();else pause();return;}if(!['racing','countdown'].includes(sim.phase))return;if(Object.values(bindings).includes(e.code)){e.preventDefault();keys.add(e.code);}if(!e.repeat&&e.code===bindings.food)sim.dropFood();if(!e.repeat&&e.code===bindings.recover&&sim.phase==='racing')sim.resetRacer();});
addEventListener('resize',clearControls);
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{clearControls();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(sim.phase==='menu')runFrames();});
document.querySelectorAll('[data-control]').forEach(b=>{const name=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(name);b.classList.add('active');});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{touch.delete(name);b.classList.remove('active');});});
function input(){const down=action=>keys.has(bindings[action]);const throttle=Number(down('forward'))-Number(down('back')),steer=Number(down('right'))-Number(down('left'));return {throttle:throttle||joystick.value.throttle,steer:steer||joystick.value.steer,vertical:Number(down('rise')||touch.has('rise'))-Number(down('dive')||touch.has('dive')),boost:down('boost')||touch.has('boost')};}
function ensureAudio(){if(!audioContext){audioContext=new(window.AudioContext||window.webkitAudioContext)();osc=audioContext.createOscillator();gain=audioContext.createGain();osc.type='triangle';gain.gain.value=0;osc.connect(gain).connect(audioContext.destination);osc.start();}audioContext.resume();}
function beep(freq,duration=.12){if(!audioOn||!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.045,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}
$('#sound').addEventListener('click',()=>{audioOn=!audioOn;$('#sound').style.color=audioOn?'var(--lime)':'';$('#sound').setAttribute('aria-label',audioOn?'Geluid uitschakelen':'Geluid inschakelen');if(audioOn)ensureAudio();else if(gain)gain.gain.value=0;});
const map=$('#minimap').getContext('2d');
function drawMap(){const w=220,h=170;map.clearRect(0,0,w,h);const scale=Math.min(100/sim.habitat.halfWidth,75/sim.habitat.halfDepth),project=p=>[110+p.x*scale,85+p.z*scale];map.beginPath();for(let i=0;i<=90;i++){const [x,y]=project(pathPoint(sim.habitat,i/90,sim.time));if(i===0)map.moveTo(x,y);else map.lineTo(x,y);}map.strokeStyle='#c4ddb740';map.lineWidth=8;map.stroke();map.lineWidth=1;map.strokeStyle='#c4ddb799';map.stroke();const gate=project(sim.gatePoint(sim.racers[0].gate));map.strokeStyle='#ccff77';map.lineWidth=2;map.beginPath();map.arc(...gate,6,0,Math.PI*2);map.stroke();for(const a of sim.animals){const [x,y]=project(a);map.fillStyle=a.target?'#ffb951':'#ba8076';map.fillRect(x-2,y-2,4,4);}for(const r of [...sim.racers].reverse()){const [x,y]=project(r);map.fillStyle=r.id===0?'#e0ff89':`#${sim.config.colors[r.id].toString(16)}`;map.beginPath();map.arc(x,y,r.id===0?4:3,0,Math.PI*2);map.fill();if(!r.id){map.beginPath();map.moveTo(x,y);map.lineTo(x+Math.sin(r.yaw)*9,y+Math.cos(r.yaw)*9);map.strokeStyle='#e0ff89';map.stroke();}}}
let hudTime=0;
function updateHud(dt){hudTime+=dt;const r=sim.racers[0];if(sim.phase==='countdown')$('#countdown').textContent=Math.ceil(sim.countdown);else if(sim.phase==='racing'&&sim.elapsed<.7)$('#countdown').textContent='GO!';else $('#countdown').textContent='';if(hudTime<.08)return;hudTime=0;$('#speed').textContent=Math.round(Math.abs(r.speed)*3);$('#time').textContent=timeString(sim.elapsed);$('#lap').textContent=`${Math.min(r.lap,3)} / 3`;$('#position').textContent=sim.ranking().findIndex(q=>q.id===0)+1;$('#boost-meter').style.width=`${r.boost}%`;$('#food-count').textContent=`${r.food} ${t('portions')} · ${keyLabel(bindings.food)}`;$('#touch-food').textContent=`${t('food').toUpperCase()} ${r.food}`;$('#touch-food').disabled=r.food===0||r.foodCooldown>0;$('#food').disabled=r.food===0||r.foodCooldown>0;$('#gate-label').textContent=`${t('checkpoint')} ${r.gate+1} / ${sim.config.gates}`;const ev=sim.events.at(-1);if(ev&&ev!==lastEvent){lastEvent=ev;$('#toast').textContent=ev.text;toastUntil=sim.time+3;beep(ev.type==='hit'?110:ev.type==='food'?330:520);}$('#toast').classList.toggle('visible',sim.time<toastUntil);drawMap();}
function frame(t){if(document.hidden){frameStarted=false;last=0;return;}if(!view){frameStarted=false;return;}if(starting||previewPending){requestAnimationFrame(frame);return;}if(view.habitat?.id!==sim.habitat.id){frameStarted=false;return;}if(sim.phase==='menu'&&last&&t-last<1000/30){requestAnimationFrame(frame);return;}try{const dt=Math.min(.1,(t-(last||t))/1000);last=t;accumulator+=dt;const controls=input();while(accumulator>=1/60){sim.step(1/60,controls);accumulator-=1/60;}view.update(sim,Math.min(dt,1/20),sim.phase==='menu',sim.phase==='racing'?accumulator*60:1);if(sim.phase!=='menu')updateHud(dt);if(sim.phase==='finished')finish();if(audioContext&&audioOn){const running=sim.phase==='racing';osc.frequency.setTargetAtTime(50+Math.abs(sim.racers[0].speed)*7,audioContext.currentTime,.1);gain.gain.setTargetAtTime(running?.022:0,audioContext.currentTime,.1);}requestAnimationFrame(frame);}catch(e){fatal(e);}}
function boot(){
 applyLanguage(getLanguage());
}
// Paint usable controls before progressively preparing the live 3D room.
requestAnimationFrame(boot);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#install').hidden=false;});$('#install').addEventListener('click',async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null;$('#install').hidden=true;}});addEventListener('appinstalled',()=>$('#install').hidden=true);
if('serviceWorker'in navigator){const register=()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('Offline cache unavailable',e));if(document.readyState==='complete')register();else addEventListener('load',register,{once:true});}
