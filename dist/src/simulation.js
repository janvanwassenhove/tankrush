// Pure deterministic simulation: no DOM or rendering dependencies.
export const TAU = Math.PI * 2;
export const ROCKS = [[-7,-7,5],[10,4,4.4],[5,-15,3.6],[-21,0,3.8]];
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const WORLD = {
  aquarium: { title:'Diep Water', water:true, gates:12, radius:5.1, top:29, speed:15.8, accel:10, turn:1.5, colors:[0xf8c648,0xf47981,0x93b8ff,0xd6f48b] },
  terrarium: { title:'Wildgroei', water:false, gates:12, radius:5.8, top:22, speed:20, accel:15, turn:1.9, colors:[0xf8c648,0xf47981,0x93b8ff,0xd6f48b] }
};
export function random(seed=9173){return ()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function terrainHeight(x,z){return 1.1+Math.sin(x*.105)*1.25+Math.cos(z*.16)*.65+Math.sin((x+z)*.13)*.45+Math.exp(-((x+18)**2+(z-8)**2)/60)*3.4;}
export function pathPoint(mode,t,time=0){
  const a=t*TAU, x=Math.cos(a)*29+Math.sin(3*a)*3, z=Math.sin(a)*20;
  const y=mode==='aquarium'?13+Math.sin(2*a)*6.2+Math.sin(time*.42+a)*1.2:terrainHeight(x,z)+1.3;
  return {x,y,z};
}
export function pathHeading(mode,t){const a=pathPoint(mode,t), b=pathPoint(mode,t+.001);return Math.atan2(b.x-a.x,b.z-a.z);}
export function currentAt(p,t){return {x:Math.sin(t*.5+p.z*.08)*1.2,y:Math.sin(t*.4+p.x*.07)*.35,z:Math.cos(t*.43+p.x*.065)*.9};}
export function surfaceAt(x,z){if(x < -17&&z>1&&z<15)return 'rock';if(z < -12&&x>0)return 'sand';if(x>15&&z>5)return 'plant';return 'soil';}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy,p.z-a.z-k*dz);}
export class Simulation {
 constructor(mode='aquarium',seed=43){this.mode=mode;this.config=WORLD[mode];if(!this.config)throw new Error('Unknown habitat');this.rng=random(seed);this.time=0;this.elapsed=0;this.phase='menu';this.countdown=3;this.events=[];this.food=[];this.waste=[];this.tongues=[];this.racers=[];this.animals=[];this.totalLaps=3;this.nextId=0;this.createRacers();this.createAnimals();}
 createRacers(){for(let i=0;i<4;i++){const t=-.024-i*.013,p=pathPoint(this.mode,t);p.x+=(i%2?1.1:-1.1);this.racers.push({id:i,name:['Jij','Gilly','Pebble','Moss'][i],...p,previous:{...p},vx:0,vy:0,vz:0,yaw:pathHeading(this.mode,t),pitch:0,roll:0,speed:0,gate:0,passed:0,lap:1,food:3,boost:100,boosting:false,slow:0,immune:0,foodCooldown:0,finished:false,finishTime:null,grounded:true,surface:'soil'});}}
 createAnimals(){const types=this.config.water?['guppy','guppy','guppy','guppy','guppy','piranha','piranha','piranha']:['spider','spider','snake','monitor','chameleon'];types.forEach((type,i)=>{const t=(i+.45)/types.length,p=pathPoint(this.mode,t);p.x*=.87;p.z*=.87;if(!this.config.water)p.y=terrainHeight(p.x,p.z)+.8;this.animals.push({id:i,type,...p,home:{...p},yaw:0,target:null,phase:i*1.8,radius:({guppy:1.5,piranha:2,spider:2.2,snake:2,monitor:2.9,chameleon:2})[type],dropAt:7+i*2.7,tongueAt:5,body:[]});});}
 start(){this.phase='countdown';this.countdown=3;}
 emit(text,type='info'){this.events.push({text,type,time:this.time});if(this.events.length>10)this.events.shift();}
 gatePoint(i){return pathPoint(this.mode,i/this.config.gates,this.time);}
 dropFood(racer=this.racers[0]){if(this.phase!=='racing'||racer.finished||racer.food<=0||racer.foodCooldown>0)return false;racer.food--;racer.foodCooldown=1.5;const f={id:++this.nextId,x:racer.x-Math.sin(racer.yaw)*4,y:racer.y,z:racer.z-Math.cos(racer.yaw)*4,ttl:9};if(!this.config.water)f.y=terrainHeight(f.x,f.z)+.4;this.food.push(f);if(!racer.id)this.emit('Voer gedropt. De bewoners komen eraan!','food');return true;}
 resetRacer(r=this.racers[0]){const index=(r.gate+this.config.gates-1)%this.config.gates,p=this.gatePoint(index);Object.assign(r,p,{yaw:pathHeading(this.mode,index/this.config.gates),vx:0,vy:0,vz:0,speed:0,immune:2,slow:0,previous:{...p}});if(!r.id)this.emit('Terug op koers · 3 seconden tijdstraf');if(!r.id)this.elapsed+=3;}
 aiInput(r){const p=this.gatePoint(r.gate),desired=Math.atan2(p.x-r.x,p.z-r.z),error=wrap(desired-r.yaw);let steer=clamp(error*1.7,-1,1),throttle=Math.abs(error)>1.15?.35:1;for(const a of this.animals){const d=distance(r,a);if(d<7&&d>2){const angle=wrap(Math.atan2(a.x-r.x,a.z-r.z)-r.yaw);if(Math.abs(angle)<.6)steer-=Math.sign(angle||1)*.6;}}return {throttle,steer:clamp(steer,-1,1),vertical:clamp((p.y-r.y)*.5,-1,1),boost:Math.abs(error)<.18&&distance(r,p)>11&&r.boost>40};}
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
  r.previous={x:r.x,y:r.y,z:r.z};r.slow=Math.max(0,r.slow-dt);r.immune=Math.max(0,r.immune-dt);r.foodCooldown=Math.max(0,r.foodCooldown-dt);
  const steer=clamp(input.steer||0,-1,1), throttle=clamp(input.throttle||0,-1,1), water=this.config.water;
  r.boosting=!!input.boost&&r.boost>1&&throttle>0&&r.slow===0;
  r.boost=clamp(r.boost+(r.boosting?-31:12)*dt,0,100);
  r.surface=water?'water':surfaceAt(r.x,r.z);
  const friction=water?.68:({rock:.91,sand:.74,plant:.67,soil:1})[r.surface];
  const max=this.config.speed*(r.id?.91+r.id*.014:1)*(r.boosting?1.55:1)*(r.slow>0?.35:1)*(water?1:friction);
  r.speed=clamp(r.speed+throttle*this.config.accel*dt-(throttle<=0?3.7:1.3)*dt,-4,max);
  if(throttle===0)r.speed*=Math.exp(-dt*.55);
  r.yaw+=steer*this.config.turn*dt*clamp(Math.abs(r.speed)/5,.22,1)*(r.speed<-.2?-1:1);
  const targetX=Math.sin(r.yaw)*r.speed,targetZ=Math.cos(r.yaw)*r.speed,grip=water?2.5:r.surface==='sand'?3.1:6;
  r.vx+=(targetX-r.vx)*(1-Math.exp(-dt*grip));r.vz+=(targetZ-r.vz)*(1-Math.exp(-dt*grip));
  if(water){const current=currentAt(r,this.time);r.vy+=((input.vertical||0)*8-r.vy)*(1-Math.exp(-dt*2));r.x+=(r.vx+current.x)*dt;r.z+=(r.vz+current.z)*dt;r.y+=(r.vy+current.y)*dt;r.pitch+=(-Math.atan2(r.vy,Math.max(2,Math.abs(r.speed)))-r.pitch)*dt*4;r.y=clamp(r.y,terrainHeight(r.x,r.z)+2,29);}
  else{r.x+=r.vx*dt;r.z+=r.vz*dt;const floor=terrainHeight(r.x,r.z)+1.1;r.vy-=20*dt;r.y+=r.vy*dt;if(r.y<=floor){const newVy=(floor-r.previous.y)/dt;r.y=floor;r.vy=clamp(newVy,-8,9);r.grounded=true;}else r.grounded=false;const ahead=terrainHeight(r.x+Math.sin(r.yaw)*1.8,r.z+Math.cos(r.yaw)*1.8);r.pitch+=(Math.atan2(terrainHeight(r.x,r.z)-ahead,1.8)-r.pitch)*Math.min(1,dt*10);}
  r.roll+=(-steer*Math.min(Math.abs(r.speed)*.012,.22)-r.roll)*dt*6;
  const bx=clamp(r.x,-41,41),bz=clamp(r.z,-29,29);if(bx!==r.x||bz!==r.z){r.x=bx;r.z=bz;r.speed*=.8;r.vx*=.6;r.vz*=.6;if(r.id===0&&r.immune<=0){this.emit('Glaswand! Stuur terug naar de poort.');r.immune=1;}}
 }
 checkGate(r){const p=this.gatePoint(r.gate);if(segmentDistance(p,r.previous,r)>this.config.radius)return;const heading=pathHeading(this.mode,r.gate/this.config.gates),dx=r.x-r.previous.x,dz=r.z-r.previous.z;if(dx*Math.sin(heading)+dz*Math.cos(heading)<=0)return;r.gate=(r.gate+1)%this.config.gates;r.passed++;if(r.passed>1&&(r.passed-1)%this.config.gates===0){r.lap++;r.food=Math.min(5,r.food+2);if(r.lap>this.totalLaps){r.finished=true;r.finishTime=this.elapsed;if(r.id===0)this.emit('FINISH!');}else if(!r.id)this.emit(`Ronde ${r.lap} / ${this.totalLaps} · +2 porties voer`,'lap');}else if(!r.id&&r.passed%3===0)this.emit(`Checkpoint ${r.gate+1} · hou koers!`);}
 updateFood(dt){for(const f of this.food){f.ttl-=dt;if(this.config.water){const c=currentAt(f,this.time);f.x+=c.x*dt*.4;f.z+=c.z*dt*.4;f.y-=dt*.23;}}this.food=this.food.filter(f=>f.ttl>0);}
 updateAnimals(dt){for(const a of this.animals){let nearest=null,nd=22;for(const f of this.food){const d=distance(a,f);if(d<nd){nearest=f;nd=d;}}a.target=nearest?.id??null;const speed=nearest?({guppy:8,piranha:10,spider:7,snake:6,monitor:7,chameleon:2})[a.type]:2.2;
   const target=nearest||{x:a.home.x+Math.cos(this.time*.24+a.phase)*6,y:a.home.y+Math.sin(this.time*.45+a.phase)*2,z:a.home.z+Math.sin(this.time*.31+a.phase)*5};
   const dx=target.x-a.x,dy=target.y-a.y,dz=target.z-a.z,d=Math.hypot(dx,dy,dz)||1;a.yaw+=wrap(Math.atan2(dx,dz)-a.yaw)*Math.min(1,dt*3);const step=Math.min(d,speed*dt);a.x+=dx/d*step;a.z+=dz/d*step;if(this.config.water)a.y=clamp(a.y+dy/d*step,4,27);else a.y=terrainHeight(a.x,a.z)+.75;
   if(this.phase==='racing'&&this.time>a.dropAt){a.dropAt=this.time+15+this.rng()*9;this.waste.push({id:++this.nextId,x:a.x,y:a.y,z:a.z,ttl:11,radius:this.config.water?1.8:1.3});}
   if(a.type==='chameleon'&&this.phase==='racing'&&this.time>a.tongueAt){a.tongueAt=this.time+5;const prey=this.racers.filter(r=>!r.finished).sort((r,s)=>distance(a,r)-distance(a,s))[0];if(prey&&distance(a,prey)<17)this.tongues.push({id:++this.nextId,from:{x:a.x,y:a.y+.7,z:a.z},to:{x:prey.x,y:prey.y,z:prey.z},ttl:1.4,age:0,hit:new Set()});}
  }
  for(const t of this.tongues){t.ttl-=dt;t.age+=dt;}this.tongues=this.tongues.filter(t=>t.ttl>0);
 }
 updateWaste(dt){for(const w of this.waste){w.ttl-=dt;if(this.config.water){w.y-=dt*.65;w.radius=Math.min(3.5,w.radius+dt*.13);}w.y=Math.max(terrainHeight(w.x,w.z)+.3,w.y);}this.waste=this.waste.filter(w=>w.ttl>0);}
 hit(r,text,duration=1.6){if(r.immune>0||r.finished)return;r.slow=duration;r.immune=2.2;r.speed*=.45;r.vx*=.55;r.vz*=.55;if(!r.id)this.emit(text,'hit');}
 collisions(){for(const r of this.racers){for(const [x,z,s] of ROCKS){const y=terrainHeight(x,z)+s*.6,rx=s+1,ry=s*1.4+.8,rz=s*.8+1,nx=(r.x-x)/rx,ny=(r.y-y)/ry,nz=(r.z-z)/rz,d=Math.hypot(nx,ny,nz);if(d<1){const f=1/(d||1);r.x=x+(d?nx*f:1)*rx;r.y=y+ny*f*ry;r.z=z+nz*f*rz;this.hit(r,'Rots geraakt! Terug naar de racelijn.');}}for(const a of this.animals){const tailLength=a.type==='snake'?5.8:a.type==='monitor'?4.8:0,tail={x:a.x-Math.sin(a.yaw)*tailLength,y:a.y,z:a.z-Math.cos(a.yaw)*tailLength};if(distance(r,a)<a.radius+1||(tailLength&&segmentDistance(r,a,tail)<1.35))this.hit(r,`${({guppy:'Guppy',piranha:'Piranha',spider:'Spin',snake:'Slang',monitor:'Varaan',chameleon:'Kameleon'})[a.type]} op je racelijn!`);}for(const w of this.waste){if(distance(r,w)<w.radius+.8)this.hit(r,'Bruine vlag. Dat was geen modder.',2.1);}for(const t of this.tongues){if(t.age>.22&&t.age<1.1&&segmentDistance(r,t.from,t.to)<1.5&&!t.hit.has(r.id)){this.hit(r,'Kameleontong! Even van het menu af.',2.6);t.hit.add(r.id);}}}
  for(let i=0;i<this.racers.length;i++)for(let j=i+1;j<this.racers.length;j++){const a=this.racers[i],b=this.racers[j],d=distance(a,b);if(d>0&&d<2.1){const push=(2.1-d)*.5,dx=(a.x-b.x)/d,dz=(a.z-b.z)/d;a.x+=dx*push;a.z+=dz*push;b.x-=dx*push;b.z-=dz*push;}}
 }
 ranking(){return [...this.racers].sort((a,b)=>{if(a.finished&&b.finished)return a.finishTime-b.finishTime;if(a.finished)return -1;if(b.finished)return 1;return b.passed-a.passed||distance(a,this.gatePoint(a.gate))-distance(b,this.gatePoint(b.gate));});}
}
