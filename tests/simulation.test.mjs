import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,pathPoint,pathHeading,terrainHeight,segmentDistance,distance,waterAt,surfaceAt} from '../dist/src/simulation.js';
import {HABITATS,constrainToTank} from '../dist/src/habitats.js';
import {joystickAxes} from '../dist/src/input.js';
function start(s){s.start();for(let i=0;i<190;i++)s.step(1/60);}
test('neutral coasting stops without reversing; reverse requires explicit input',()=>{
  for(const mode of ['aquarium','terrarium'])for(const speed of [-3,0,12]){
    const s=new Simulation(mode),r=s.racers[0];r.speed=speed;
    for(let i=0;i<900;i++){s.move(r,1/60,{});assert.ok(r.speed*speed>=0);if(speed===0)assert.equal(r.speed,0);}
    assert.equal(r.speed,0);
    for(let i=0;i<60;i++)s.move(r,1/60,{throttle:-1});assert.ok(r.speed<0);
  }
});
test('analog joystick limits speed, and steering changes progressively',()=>{
  for(const mode of ['aquarium','terrarium']){
    const s=new Simulation(mode),r=s.racers[0];Object.assign(r,{x:0,z:0,yaw:0});
    const input=joystickAxes(0,-.5);
    for(let i=0;i<120;i++)s.move(r,1/60,input);
    assert.ok(r.speed>2&&r.speed<s.config.speed*.5);
    s.move(r,1/60,{throttle:1,steer:1});assert.ok(r.steering>0&&r.steering<.2);
    const before=r.steering;s.move(r,1/60,{throttle:1,steer:-1});
    assert.ok(r.steering<before&&r.steering>-.2);
    for(let i=0;i<90;i++)s.move(r,1/60,{});assert.ok(Math.abs(r.steering)<.00001);
  }
});
test('opposite steering mirrors the turn, reverses in reverse gear, and cannot spin at rest',()=>{
  for(const mode of ['aquarium','terrarium'])for(const speed of [0,8,-3])for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const s=new Simulation(mode),r=s.racers[0];Object.assign(r,{x:0,z:0,yaw,speed,steering:0});
    s.move(r,1/60,{steer:1,throttle:speed>0?1:speed<0?-1:0});
    if(speed===0)assert.equal(r.yaw,yaw);else assert.ok((r.yaw-yaw)*Math.sign(speed)<0);
  }
});
test('all circuits leave room at the walls and checkpoints are spaced for reaction time',()=>{
  for(const habitat of HABITATS){
    const s=new Simulation(habitat.id);let length=0;
    for(let i=0;i<1000;i++){const p=pathPoint(habitat,i/1000);length+=distance(p,pathPoint(habitat,(i+1)/1000));assert.deepEqual(constrainToTank(habitat,p.x,p.z,12),{x:p.x,z:p.z});}
    assert.ok(length>300,habitat.id);
    for(let i=0;i<s.config.gates;i++)assert.ok(distance(s.gatePoint(i),s.gatePoint((i+1)%s.config.gates))>30,habitat.id);
  }
});
test('recovery before the first gate returns to the starting approach',()=>{
  const s=new Simulation(),r=s.racers[0];s.resetRacer();
  assert.ok(distance(r,s.gatePoint(0))<15);assert.equal(r.gate,0);assert.equal(r.steering,0);
});
test('aquarium course occupies the water column, terrarium follows terrain',()=>{const ys=[];for(let i=0;i<12;i++){const a=pathPoint('aquarium',i/12);ys.push(a.y);const t=pathPoint('terrarium',i/12);assert.equal(t.y,terrainHeight(t.x,t.z)+1.3);}assert.ok(Math.max(...ys)-Math.min(...ys)>10);});
test('aquarium residents fill the water column and stay above sloping substrate',()=>{
 for(const h of HABITATS.filter(h=>h.kind==='aquarium')){
  const s=new Simulation(h.id),heights=s.animals.map(a=>a.y);
  assert.ok(Math.max(...heights)-Math.min(...heights)>h.waterLevel*.35,h.id);
  for(let i=0;i<900;i++){
   s.step(1/60);
   for(const a of s.animals){
    assert.ok(a.y>s.groundAt(a.x,a.z),`${h.id}: ${a.speciesId} inside substrate`);
    assert.ok(a.y<s.config.top,`${h.id}: resident above water`);
    assert.deepEqual(constrainToTank(h,a.x,a.z,4),{x:a.x,z:a.z});
    if(a.type==='shrimp')assert.ok(Math.abs(a.y-s.groundAt(a.x,a.z)-.85)<1e-8);
   }
  }
 }
});
test('tetra and rasbora shoals stay together as they move',()=>{
 for(const id of ['amazon','asia']){
  const s=new Simulation(id),schools=new Map();
  for(const a of s.animals)if(a.shoal!==null){if(!schools.has(a.shoal))schools.set(a.shoal,[]);schools.get(a.shoal).push(a);}
  const start={...schools.get(0)[0]};
  for(let i=0;i<900;i++)s.step(1/60);
  assert.ok(distance(start,schools.get(0)[0])>3);
  for(const school of schools.values())for(const a of school)assert.ok(distance(a,school[0])<12);
 }
});
test('countdown prevents driving; pause freezes simulation',()=>{const s=new Simulation();s.start();const x=s.racers[0].x;s.step(.02,{throttle:1});assert.equal(x,s.racers[0].x);s.phase='paused';const t=s.time;s.step(.02,{throttle:1});assert.equal(s.time,t);});
test('vertical input changes submarine depth but has no effect on a buggy',()=>{for(const mode of ['aquarium','terrarium']){const s=new Simulation(mode),baseline=new Simulation(mode);start(s);start(baseline);for(let i=0;i<100;i++){s.step(1/60,{vertical:1});baseline.step(1/60,{});}if(mode==='aquarium')assert.ok(s.racers[0].y>baseline.racers[0].y+5);else assert.deepEqual(s.racers,baseline.racers);}});
test('boost consumes charge, regenerates and resets cleanly',()=>{const s=new Simulation();start(s);const r=s.racers[0];for(let i=0;i<60;i++)s.move(r,1/60,{throttle:1,boost:true});assert.ok(r.boost<80);for(let i=0;i<120;i++)s.move(r,1/60,{});assert.ok(r.boost>85);s.resetRacer();assert.equal(r.speed,0);assert.equal(r.passed,0);});
test('food is finite, spawns behind racer, attracts animals and expires',()=>{const s=new Simulation();start(s);const r=s.racers[0];assert.equal(s.dropFood(),true);assert.equal(r.food,2);assert.equal(s.dropFood(),false);const f=s.food[0];assert.ok((f.x-r.x)*Math.sin(r.yaw)+(f.z-r.z)*Math.cos(r.yaw)<0);s.animals[0].x=f.x+4;s.animals[0].y=f.y;s.animals[0].z=f.z;s.updateAnimals(.02);assert.equal(s.animals[0].target,f.id);s.updateFood(10);assert.equal(s.food.length,0);});
test('checkpoints cannot be skipped or counted in reverse',()=>{const s=new Simulation();const r=s.racers[0];const skip=s.gatePoint(5);Object.assign(r,skip);r.previous={...skip,x:skip.x-1};s.checkGate(r);assert.equal(r.passed,0);const p=s.gatePoint(0),h=pathHeading('aquarium',0);Object.assign(r,p);r.previous={x:p.x+Math.sin(h),y:p.y,z:p.z+Math.cos(h)};s.checkGate(r);assert.equal(r.passed,0);});
test('3 full laps required after crossing starting gate',()=>{for(const habitat of HABITATS){const s=new Simulation(habitat.id),r=s.racers[0],crossings=s.config.gates*3+1;for(let i=0;i<crossings;i++){const p=s.gatePoint(r.gate),h=pathHeading(s.habitat,s.gateParameter(r.gate));Object.assign(r,p);r.previous={x:p.x-Math.sin(h),y:p.y,z:p.z-Math.cos(h)};s.checkGate(r);if(i<crossings-1)assert.equal(r.finished,false);}assert.equal(r.finished,true);assert.equal(r.passed,crossings);}});
test('waste and tongue have actual collision effects',()=>{const s=new Simulation('terrarium');start(s);const r=s.racers[0];r.immune=0;s.waste.push({...r,radius:2,ttl:3});s.collisions();assert.ok(r.slow>0);r.immune=0;r.slow=0;s.waste=[];s.tongues=[{from:{...r,x:r.x-5},to:{...r,x:r.x+5},age:.4,ttl:1,hit:new Set()}];s.collisions();assert.ok(r.slow>2);assert.ok(segmentDistance(r,s.tongues[0].from,s.tongues[0].to)<1e-6);});
test('deterministic simulation and bounds over long run',()=>{for(const habitat of HABITATS){const a=new Simulation(habitat.id,55),b=new Simulation(habitat.id,55);start(a);start(b);for(let i=0;i<1200;i++){const input={throttle:1,steer:.35,vertical:Math.sin(i*.02)};a.step(1/60,input);b.step(1/60,input);}assert.deepEqual(a.racers,b.racers);for(const r of a.racers){assert.ok(Number.isFinite(r.x+r.y+r.z));assert.deepEqual(constrainToTank(habitat,r.x,r.z),{x:r.x,z:r.z});}}});
test('AI navigation can complete all ten habitats',()=>{for(const habitat of HABITATS){const s=new Simulation(habitat.id,123);start(s);for(let i=0;i<36000&&s.phase!=='finished';i++)s.step(1/60,s.aiInput(s.racers[0]));assert.equal(s.racers[0].finished,true,`${habitat.id}: ${s.racers[0].passed} gates`);}});

test('terrarium routes have climbable relief and themed water crossings',()=>{
 for(const h of HABITATS.filter(h=>h.kind==='terrarium')){const heights=[];let crossings=0;
  for(let i=0;i<600;i++){const p=pathPoint(h,i/600),y=terrainHeight(p.x,p.z,h);heights.push(y);const grade=Math.hypot((terrainHeight(p.x+.1,p.z,h)-y)/.1,(terrainHeight(p.x,p.z+.1,h)-y)/.1);assert.ok(grade<.9,`${h.id} has a sharp ledge`);if(waterAt(p.x,p.z,h))crossings++;}
  assert.ok(Math.max(...heights)-Math.min(...heights)>9,`${h.id} needs real elevation`);assert.equal(crossings>0,!!h.pools);
  for(const pool of h.pools||[])for(let i=0;i<50;i++){const x=pool.x+Math.cos(i)*pool.rx*.8,z=pool.z+Math.sin(i)*pool.rz*.8,w=waterAt(x,z,h);assert.ok(w);assert.ok(Math.abs(terrainHeight(x,z,h)-(w.level-w.depth))<1e-9);assert.ok(w.depth<=.9);assert.equal(surfaceAt(x,z,h),'stream');}
 }
});
test('water slows buggies and keeps their bodies above shallow water',()=>{
 const s=new Simulation('costarica'),r=s.racers[0],p=s.habitat.pools[0];Object.assign(r,{x:p.x,z:p.z,y:s.groundAt(p.x,p.z)+1.1,speed:20,vx:0,vz:0});
 for(let i=0;i<30;i++)s.move(r,1/60,{throttle:1});assert.equal(r.surface,'stream');assert.ok(r.speed<17);assert.ok(r.y>p.level);
});
