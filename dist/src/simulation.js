import {getHabitat,SPECIES,constrainToTank} from './habitats.js?v=5';
// Pure deterministic simulation: no DOM or rendering dependencies.
export const TAU = Math.PI * 2;
export const HABITAT = {halfWidth:108,halfDepth:78,trackX:82,trackZ:58,roadHalfWidth:7};
export const ROCKS = [[-20,-20,5],[28,12,4.4],[14,-43,3.6],[-60,0,3.8]];
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const WORLD = {
  aquarium: { title:'Diep Water', water:true, gates:12, radius:6.5, top:29, speed:15.8, accel:10, turn:1.18, colors:[0xf8c648,0xf47981,0x93b8ff,0xd6f48b] },
  terrarium: { title:'Wildgroei', water:false, gates:12, radius:7, top:22, speed:20, accel:15, turn:1.45, colors:[0xf8c648,0xf47981,0x93b8ff,0xd6f48b] }
};
export function random(seed=9173){return ()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function terrainHeight(x,z,key='terrarium'){
 const h=getHabitat(key);if(h.theme==='jelly')return .4;
 const nx=x/h.halfWidth,nz=z/h.halfDepth;
 const wave=1.1+Math.sin(nx*4.3+h.phase)*1.2+Math.cos(nz*4.1)*.7+Math.sin((nx+nz)*3)*.5;
 const mound=Math.exp(-((nx+.4)**2+(nz-.1)**2)*16)*(h.theme==='outback'?5:2.5);
 return Math.max(.3,wave*(h.theme==='desert'?1.7:1)+mound);
}
export function pathPoint(key,t,time=0){
 const h=getHabitat(key),a=t*TAU,x=Math.cos(a)*h.trackX+Math.sin(3*a+h.phase)*h.wobble,z=Math.sin(a)*h.trackZ+Math.sin(2*a)*h.wobble*.5;
 return {x,y:h.kind==='aquarium'?h.depth+Math.sin(2*a+h.phase)*h.swing+Math.sin(time*.42+a)*1.2:terrainHeight(x,z,h)+1.3,z};
}
export function pathHeading(key,t){const a=pathPoint(key,t),b=pathPoint(key,t+.001);return Math.atan2(b.x-a.x,b.z-a.z);}
function gateParameters(h){const samples=[{t:0,length:0}];let length=0;for(let i=1;i<=360;i++){length+=distance(pathPoint(h,(i-1)/360),pathPoint(h,i/360));samples.push({t:i/360,length});}const count=length>430?12:10;return Array.from({length:count},(_,i)=>{const target=i/count*length,j=Math.max(1,samples.findIndex(s=>s.length>=target)),a=samples[j-1],b=samples[j];return a.t+(b.t-a.t)*(target-a.length)/(b.length-a.length);});}
export function currentAt(p,t,key='aquarium'){const h=getHabitat(key);if(h.theme==='jelly'){const d=Math.hypot(p.x,p.z)||1;return {x:-p.z/d*1.5,y:Math.sin(t*.35+p.x*.03)*.3,z:p.x/d*1.5};}const force=h.theme==='rift'?1.2:h.theme==='blackwater'?.7:1;return {x:Math.sin(t*.5+p.z*.08)*1.2*force,y:Math.sin(t*.4+p.x*.07)*.35,z:Math.cos(t*.43+p.x*.065)*.9*force};}
export function surfaceAt(x,z,key='terrarium'){const h=getHabitat(key);if(h.waterfall&&Math.hypot(x-h.waterfall.x,z-h.waterfall.z)<h.waterfall.pool)return 'stream';if(h.theme==='desert')return z<10?'sand':'rock';if(h.theme==='outback'){if(x< -h.trackX*.65)return 'rock';return z<0?'sand':'soil';}return x>h.trackX*.5?'plant':'soil';}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy,p.z-a.z-k*dz);}
export class Simulation {
 constructor(mode='aquarium',seed=43){this.habitat=getHabitat(mode);this.mode=this.habitat.kind;this.config={...WORLD[this.mode],title:this.habitat.name,top:(this.habitat.waterLevel||this.habitat.height)-5};this.gateParameters=gateParameters(this.habitat);this.config.gates=this.gateParameters.length;this.rocks=[];const scenery=random(this.habitat.seed+5);for(let i=0;i<Math.ceil(this.habitat.rocks/3);i++){const a=scenery()*TAU,k=.25+scenery()*.35;this.rocks.push([Math.cos(a)*this.habitat.trackX*k,Math.sin(a)*this.habitat.trackZ*k,3+scenery()*6]);}this.rng=random(seed);this.time=0;this.elapsed=0;this.phase='menu';this.countdown=3;this.events=[];this.food=[];this.waste=[];this.tongues=[];this.racers=[];this.animals=[];this.totalLaps=3;this.nextId=0;this.createRacers();this.createAnimals();}
 createRacers(){for(let i=0;i<4;i++){const t=-.026-Math.floor(i/2)*.012,p=pathPoint(this.habitat,t),h=pathHeading(this.habitat,t),side=i%2?1.6:-1.6;p.x+=Math.cos(h)*side;p.z-=Math.sin(h)*side;this.racers.push({id:i,name:['Jij','Gilly','Pebble','Moss'][i],...p,previous:{...p},vx:0,vy:0,vz:0,yaw:h,pitch:0,roll:0,steering:0,speed:0,gate:0,passed:0,lap:1,food:3,boost:100,boosting:false,slow:0,immune:0,foodCooldown:0,finished:false,finishTime:null,grounded:true,surface:'soil'});}}
 groundAt(x,z){return terrainHeight(x,z,this.habitat);}
 createAnimals(){const count=this.config.water?12:7;for(let i=0;i<count;i++){
  const speciesId=this.habitat.roster[i%this.habitat.roster.length],profile=SPECIES[speciesId],t=(i+.45)/count,p=pathPoint(this.habitat,t),h=pathHeading(this.habitat,t);
  p.x-=Math.cos(h)*(3+i%3);p.z+=Math.sin(h)*(3+i%3);
  if(!this.config.water)p.y=this.groundAt(p.x,p.z)+(profile.behavior==='climb'?7+(i%3)*3:.8);
  this.animals.push({id:i,speciesId,profile,type:profile.model,...p,home:{...p},yaw:0,target:null,phase:i*1.8,radius:profile.radius,dropAt:7+i*2.7,tongueAt:5,body:[]});
 }}
 start(){this.phase='countdown';this.countdown=3;}
 emit(text,type='info'){this.events.push({text,type,time:this.time});if(this.events.length>10)this.events.shift();}
 gateParameter(i){return this.gateParameters[i];}
 gatePoint(i){return pathPoint(this.habitat,this.gateParameter(i),this.time);}
 dropFood(racer=this.racers[0]){if(this.phase!=='racing'||racer.finished||racer.food<=0||racer.foodCooldown>0)return false;racer.food--;racer.foodCooldown=1.5;const f={id:++this.nextId,x:racer.x-Math.sin(racer.yaw)*4,y:racer.y,z:racer.z-Math.cos(racer.yaw)*4,ttl:9};if(!this.config.water)f.y=this.groundAt(f.x,f.z)+.4;this.food.push(f);if(!racer.id)this.emit('Voer gedropt. De bewoners komen eraan!','food');return true;}
 resetRacer(r=this.racers[0]){const t=r.passed?this.gateParameter((r.gate+this.config.gates-1)%this.config.gates):-.026,p=pathPoint(this.habitat,t,this.time);Object.assign(r,p,{yaw:pathHeading(this.habitat,t),vx:0,vy:0,vz:0,speed:0,steering:0,pitch:0,roll:0,immune:2,slow:0,previous:{...p}});if(!r.id)this.emit('Terug op koers · 3 seconden tijdstraf');if(!r.id)this.elapsed+=3;}
 aiInput(r){const p=this.gatePoint(r.gate),desired=Math.atan2(p.x-r.x,p.z-r.z),error=wrap(desired-r.yaw);let steer=clamp(-error*1.7,-1,1),throttle=Math.abs(error)>1.15?.35:1;for(const a of this.animals){const d=distance(r,a);if(d<7&&d>2){const angle=wrap(Math.atan2(a.x-r.x,a.z-r.z)-r.yaw);if(Math.abs(angle)<.6)steer+=Math.sign(angle||1)*.6;}}return {throttle,steer:clamp(steer,-1,1),vertical:clamp((p.y-r.y)*.5,-1,1),boost:Math.abs(error)<.18&&distance(r,p)>24&&r.boost>40};}
 step(dt,input={}){
  if(this.phase==='paused'||this.phase==='finished')return;
  dt=clamp(dt,0,1/20);this.time+=dt;
  if(this.phase==='menu'){this.updateAnimals(dt);return;}
  if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.phase='racing';for(const r of this.racers)r.immune=2.5;this.emit('GO! Volg de groene poorten.');}this.updateAnimals(dt);return;}
  this.elapsed+=dt;
  for(const r of this.racers){if(r.finished)continue;this.move(r,dt,r.id?this.aiInput(r):input);this.checkGate(r);if(r.id&&this.rng()<dt*.045)this.dropFood(r);}
  this.updateFood(dt);this.updateAnimals(dt);this.updateWaste(dt);this.collisions();
  if(this.racers[0].finished){this.phase='finished';this.emit('Finish!');}
 }
 move(r,dt,input){
  r.previous={x:r.x,y:r.y,z:r.z,yaw:r.yaw,pitch:r.pitch,roll:r.roll};r.slow=Math.max(0,r.slow-dt);r.immune=Math.max(0,r.immune-dt);r.foodCooldown=Math.max(0,r.foodCooldown-dt);
  const throttle=clamp(input.throttle||0,-1,1), water=this.config.water;
  r.steering+=(clamp(input.steer||0,-1,1)-r.steering)*(1-Math.exp(-dt*8));
  const steer=r.steering;
  r.boosting=!!input.boost&&r.boost>1&&throttle>0&&r.slow===0;
  r.boost=clamp(r.boost+(r.boosting?-31:12)*dt,0,100);
  r.surface=water?'water':surfaceAt(r.x,r.z,this.habitat);
  const friction=water?.68:({rock:.91,sand:.74,plant:.67,soil:1,stream:.58})[r.surface];
  const max=this.config.speed*(r.id?.91+r.id*.014:1)*(r.boosting?1.55:1)*(r.slow>0?.35:1)*(water?1:friction);
  const targetSpeed=throttle>=0?max*throttle:4*throttle;
  const braking=throttle*r.speed<0,accel=this.config.accel*(braking?1.6:1)*dt;
  const response=throttle===0?(water?1.1:1.8):2;
  r.speed+=clamp((targetSpeed-r.speed)*(1-Math.exp(-dt*response)),-accel,accel);
  if(throttle===0&&Math.abs(r.speed)<.025)r.speed=0;
  // Front is +Z: a positive yaw turns screen-left in the chase camera.
  // Positive steer always means vehicle-right, with the usual reversal in reverse gear.
  r.yaw-=steer*this.config.turn*dt*clamp(Math.abs(r.speed)/5,0,1)/(1+Math.max(0,Math.abs(r.speed)/this.config.speed-1)*.6)*(r.speed<0?-1:1);
  const targetX=Math.sin(r.yaw)*r.speed,targetZ=Math.cos(r.yaw)*r.speed,grip=water?3.8:r.surface==='sand'?5:8;
  r.vx+=(targetX-r.vx)*(1-Math.exp(-dt*grip));r.vz+=(targetZ-r.vz)*(1-Math.exp(-dt*grip));
  if(water){const current=currentAt(r,this.time,this.habitat);r.vy+=((input.vertical||0)*8-r.vy)*(1-Math.exp(-dt*2));r.x+=(r.vx+current.x)*dt;r.z+=(r.vz+current.z)*dt;r.y+=(r.vy+current.y)*dt;r.pitch+=(-Math.atan2(r.vy,Math.max(2,Math.abs(r.speed)))-r.pitch)*dt*4;r.y=clamp(r.y,this.groundAt(r.x,r.z)+2,this.config.top);}
  else{r.x+=r.vx*dt;r.z+=r.vz*dt;const floor=this.groundAt(r.x,r.z)+1.1;r.vy-=20*dt;r.y+=r.vy*dt;if(r.y<=floor){const newVy=(floor-r.previous.y)/dt;r.y=floor;r.vy=clamp(newVy,-8,9);r.grounded=true;}else r.grounded=false;const ahead=this.groundAt(r.x+Math.sin(r.yaw)*1.8,r.z+Math.cos(r.yaw)*1.8);r.pitch+=(Math.atan2(this.groundAt(r.x,r.z)-ahead,1.8)-r.pitch)*Math.min(1,dt*10);}
  r.roll+=(steer*Math.min(Math.abs(r.speed)*.012,.22)-r.roll)*dt*6;
  const boundary=constrainToTank(this.habitat,r.x,r.z),bx=boundary.x,bz=boundary.z;if(bx!==r.x||bz!==r.z){r.x=bx;r.z=bz;r.speed*=.8;r.vx*=.6;r.vz*=.6;if(r.id===0&&r.immune<=0){this.emit('Glaswand! Stuur terug naar de poort.');r.immune=1;}}
 }
 checkGate(r){const p=this.gatePoint(r.gate);if(segmentDistance(p,r.previous,r)>this.config.radius)return;const heading=pathHeading(this.habitat,this.gateParameter(r.gate)),dx=r.x-r.previous.x,dz=r.z-r.previous.z;if(dx*Math.sin(heading)+dz*Math.cos(heading)<=0)return;r.gate=(r.gate+1)%this.config.gates;r.passed++;if(r.passed>1&&(r.passed-1)%this.config.gates===0){r.lap++;r.food=Math.min(5,r.food+2);if(r.lap>this.totalLaps){r.finished=true;r.finishTime=this.elapsed;if(r.id===0)this.emit('FINISH!');}else if(!r.id)this.emit(`Ronde ${r.lap} / ${this.totalLaps} · +2 porties voer`,'lap');}else if(!r.id&&r.passed%3===0)this.emit(`Checkpoint ${r.gate+1} · hou koers!`);}
 updateFood(dt){for(const f of this.food){f.ttl-=dt;if(this.config.water){const c=currentAt(f,this.time,this.habitat);f.x+=c.x*dt*.4;f.z+=c.z*dt*.4;f.y-=dt*.23;}}this.food=this.food.filter(f=>f.ttl>0);}
 updateAnimals(dt){for(const a of this.animals){let nearest=null,nd=22;for(const f of this.food){const d=distance(a,f);if(d<nd){nearest=f;nd=d;}}a.target=nearest?.id??null;const speed=nearest?a.profile.speed:a.profile.behavior==='jelly'?1.4:2.2;
   const target=nearest||{x:a.home.x+Math.cos(this.time*.24+a.phase)*6,y:a.home.y+Math.sin(this.time*.45+a.phase)*2,z:a.home.z+Math.sin(this.time*.31+a.phase)*5};
   const dx=target.x-a.x,dy=target.y-a.y,dz=target.z-a.z,d=Math.hypot(dx,dy,dz)||1;a.yaw+=wrap(Math.atan2(dx,dz)-a.yaw)*Math.min(1,dt*3);const step=Math.min(d,speed*dt);a.x+=dx/d*step;a.z+=dz/d*step;const boundary=constrainToTank(this.habitat,a.x,a.z,4);a.x=boundary.x;a.z=boundary.z;if(this.config.water)a.y=clamp(a.y+dy/d*step,4,this.config.top-2);else if(a.profile.behavior==='climb')a.y=Math.max(this.groundAt(a.x,a.z)+.75,a.y+dy/d*step);else a.y=this.groundAt(a.x,a.z)+.75+(a.profile.behavior==='hop'?Math.abs(Math.sin(this.time*3+a.phase))*1.5:0);
   if(this.phase==='racing'&&this.time>a.dropAt){a.dropAt=this.time+15+this.rng()*9;this.waste.push({id:++this.nextId,x:a.x,y:a.y,z:a.z,ttl:11,radius:this.config.water?1.8:1.3});}
   if(a.type==='chameleon'&&this.phase==='racing'&&this.time>a.tongueAt){a.tongueAt=this.time+5;const prey=this.racers.filter(r=>!r.finished).sort((r,s)=>distance(a,r)-distance(a,s))[0];if(prey&&distance(a,prey)<17)this.tongues.push({id:++this.nextId,from:{x:a.x,y:a.y+.7,z:a.z},to:{x:prey.x,y:prey.y,z:prey.z},ttl:1.4,age:0,hit:new Set()});}
  }
  for(const t of this.tongues){t.ttl-=dt;t.age+=dt;}this.tongues=this.tongues.filter(t=>t.ttl>0);
 }
 updateWaste(dt){for(const w of this.waste){w.ttl-=dt;if(this.config.water){w.y-=dt*.65;w.radius=Math.min(3.5,w.radius+dt*.13);}w.y=Math.max(this.groundAt(w.x,w.z)+.3,w.y);}this.waste=this.waste.filter(w=>w.ttl>0);}
 hit(r,text,duration=1.6){if(r.immune>0||r.finished)return;r.slow=duration;r.immune=2.2;r.speed*=.45;r.vx*=.55;r.vz*=.55;if(!r.id)this.emit(text,'hit');}
 collisions(){for(const r of this.racers){for(const [x,z,s] of this.rocks){const y=this.groundAt(x,z)+s*.6,rx=s+1,ry=s*1.4+.8,rz=s*.8+1,nx=(r.x-x)/rx,ny=(r.y-y)/ry,nz=(r.z-z)/rz,d=Math.hypot(nx,ny,nz);if(d<1){const f=1/(d||1);r.x=x+(d?nx*f:1)*rx;r.y=y+ny*f*ry;r.z=z+nz*f*rz;this.hit(r,'Rots geraakt! Terug naar de racelijn.');}}for(const a of this.animals){const tailLength=a.type==='snake'?5.8:a.type==='monitor'?4.8:0,tail={x:a.x-Math.sin(a.yaw)*tailLength,y:a.y,z:a.z-Math.cos(a.yaw)*tailLength};if(distance(r,a)<a.radius+1||(tailLength&&segmentDistance(r,a,tail)<1.35))this.hit(r,`${a.profile.name} op je racelijn!`);}for(const w of this.waste){if(distance(r,w)<w.radius+.8)this.hit(r,'Bruine vlag. Dat was geen modder.',2.1);}for(const t of this.tongues){if(t.age>.22&&t.age<1.1&&segmentDistance(r,t.from,t.to)<1.5&&!t.hit.has(r.id)){this.hit(r,'Kameleontong! Even van het menu af.',2.6);t.hit.add(r.id);}}}
  for(let i=0;i<this.racers.length;i++)for(let j=i+1;j<this.racers.length;j++){const a=this.racers[i],b=this.racers[j],d=distance(a,b);if(d>0&&d<2.1){const push=(2.1-d)*.5,dx=(a.x-b.x)/d,dz=(a.z-b.z)/d;a.x+=dx*push;a.z+=dz*push;b.x-=dx*push;b.z-=dz*push;}}
 }
 ranking(){return [...this.racers].sort((a,b)=>{if(a.finished&&b.finished)return a.finishTime-b.finishTime;if(a.finished)return -1;if(b.finished)return 1;return b.passed-a.passed||distance(a,this.gatePoint(a.gate))-distance(b,this.gatePoint(b.gate));});}
}
