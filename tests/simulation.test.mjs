import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,pathPoint,pathHeading,terrainHeight,segmentDistance,HABITAT,distance} from '../dist/src/simulation.js';
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
test('longer circuits give at least 29 units between gates, with space around the course',()=>{
  for(const mode of ['aquarium','terrarium']){
    let length=0;for(let i=0;i<1000;i++){const p=pathPoint(mode,i/1000);length+=distance(p,pathPoint(mode,(i+1)/1000));assert.ok(Math.abs(p.x)+12<HABITAT.halfWidth&&Math.abs(p.z)+12<HABITAT.halfDepth);}
    assert.ok(length>430);
    for(let i=0;i<12;i++)assert.ok(distance(pathPoint(mode,i/12),pathPoint(mode,(i+1)/12))>29);
  }
});
test('recovery before the first gate returns to the starting approach',()=>{
  const s=new Simulation(),r=s.racers[0];s.resetRacer();
  assert.ok(distance(r,s.gatePoint(0))<15);assert.equal(r.gate,0);assert.equal(r.steering,0);
});
test('aquarium course occupies the water column, terrarium follows terrain',()=>{const ys=[];for(let i=0;i<12;i++){const a=pathPoint('aquarium',i/12);ys.push(a.y);const t=pathPoint('terrarium',i/12);assert.equal(t.y,terrainHeight(t.x,t.z)+1.3);}assert.ok(Math.max(...ys)-Math.min(...ys)>10);});
test('countdown prevents driving; pause freezes simulation',()=>{const s=new Simulation();s.start();const x=s.racers[0].x;s.step(.02,{throttle:1});assert.equal(x,s.racers[0].x);s.phase='paused';const t=s.time;s.step(.02,{throttle:1});assert.equal(s.time,t);});
test('vertical input changes submarine depth and never lifts buggy with Q/E',()=>{for(const mode of ['aquarium','terrarium']){const s=new Simulation(mode);start(s);const r=s.racers[0],y=r.y;for(let i=0;i<100;i++)s.step(1/60,{vertical:1});if(mode==='aquarium')assert.ok(r.y>y+5);else assert.ok(Math.abs(r.y-y)<.8);}});
test('boost consumes charge, regenerates and resets cleanly',()=>{const s=new Simulation();start(s);const r=s.racers[0];for(let i=0;i<60;i++)s.move(r,1/60,{throttle:1,boost:true});assert.ok(r.boost<80);for(let i=0;i<120;i++)s.move(r,1/60,{});assert.ok(r.boost>85);s.resetRacer();assert.equal(r.speed,0);assert.equal(r.passed,0);});
test('food is finite, spawns behind racer, attracts animals and expires',()=>{const s=new Simulation();start(s);const r=s.racers[0];assert.equal(s.dropFood(),true);assert.equal(r.food,2);assert.equal(s.dropFood(),false);const f=s.food[0];assert.ok((f.x-r.x)*Math.sin(r.yaw)+(f.z-r.z)*Math.cos(r.yaw)<0);s.animals[0].x=f.x+4;s.animals[0].y=f.y;s.animals[0].z=f.z;s.updateAnimals(.02);assert.equal(s.animals[0].target,f.id);s.updateFood(10);assert.equal(s.food.length,0);});
test('checkpoints cannot be skipped or counted in reverse',()=>{const s=new Simulation();const r=s.racers[0];const skip=s.gatePoint(5);Object.assign(r,skip);r.previous={...skip,x:skip.x-1};s.checkGate(r);assert.equal(r.passed,0);const p=s.gatePoint(0),h=pathHeading('aquarium',0);Object.assign(r,p);r.previous={x:p.x+Math.sin(h),y:p.y,z:p.z+Math.cos(h)};s.checkGate(r);assert.equal(r.passed,0);});
test('3 full laps required after crossing starting gate',()=>{const s=new Simulation();const r=s.racers[0];for(let i=0;i<37;i++){const p=s.gatePoint(r.gate),h=pathHeading('aquarium',r.gate/12);Object.assign(r,p);r.previous={x:p.x-Math.sin(h),y:p.y,z:p.z-Math.cos(h)};s.checkGate(r);if(i<36)assert.equal(r.finished,false);}assert.equal(r.finished,true);assert.equal(r.passed,37);});
test('waste and tongue have actual collision effects',()=>{const s=new Simulation('terrarium');start(s);const r=s.racers[0];r.immune=0;s.waste.push({...r,radius:2,ttl:3});s.collisions();assert.ok(r.slow>0);r.immune=0;r.slow=0;s.waste=[];s.tongues=[{from:{...r,x:r.x-5},to:{...r,x:r.x+5},age:.4,ttl:1,hit:new Set()}];s.collisions();assert.ok(r.slow>2);assert.ok(segmentDistance(r,s.tongues[0].from,s.tongues[0].to)<1e-6);});
test('deterministic simulation and bounds over long run',()=>{for(const mode of ['aquarium','terrarium']){const a=new Simulation(mode,55),b=new Simulation(mode,55);start(a);start(b);for(let i=0;i<1200;i++){const input={throttle:1,steer:.35,vertical:Math.sin(i*.02)};a.step(1/60,input);b.step(1/60,input);}assert.deepEqual(a.racers,b.racers);for(const r of a.racers){assert.ok(Number.isFinite(r.x+r.y+r.z));assert.ok(Math.abs(r.x)<HABITAT.halfWidth&&Math.abs(r.z)<HABITAT.halfDepth);}}});
test('AI navigation can complete both habitats',()=>{for(const mode of ['aquarium','terrarium']){const s=new Simulation(mode,123);start(s);for(let i=0;i<36000&&s.phase!=='finished';i++)s.step(1/60,s.aiInput(s.racers[0]));assert.equal(s.racers[0].finished,true,`${mode}: ${s.racers[0].passed} gates`);}});
