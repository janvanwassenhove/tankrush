import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='three')specifier=new URL('../dist/vendor/three/three.module.js',import.meta.url).href;else if(specifier.startsWith('three/addons/'))specifier=new URL('../dist/vendor/three/addons/'+specifier.slice(13),import.meta.url).href;return next(specifier,context);}});
const THREE=await import('../dist/vendor/three/three.module.js');
const {RaceScene,racerPose}=await import('../dist/src/scene.js');
const {Simulation}=await import('../dist/src/simulation.js');
const {joystickAxes}=await import('../dist/src/input.js');
const {HABITATS}=await import('../dist/src/habitats.js');
globalThis.innerWidth=1280;globalThis.innerHeight=800;
test('keyboard and joystick right/left turn toward that side in the actual chase camera',()=>{
  for(const mode of ['aquarium','terrarium']){
    const v=Object.create(RaceScene.prototype);Object.assign(v,{scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(64,1,.1,500),target:new THREE.Vector3(),effects:new Map(),racers:[],animals:[],gates:[],plants:[],renderer:{render(){}}});
    const sim=new Simulation(mode);v.setWorld(sim);const r=sim.racers[0];
    for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const side of [-1,1])for(const touch of [false,true]){
      Object.assign(r,{x:0,y:13,z:0,yaw,speed:8,vx:0,vy:0,vz:0,steering:0});v.cameraReady=false;v.update(sim,1/60,false);v.camera.updateMatrixWorld(true);
      const origin=new THREE.Vector3(r.x,r.y,r.z);
      const before=origin.clone().add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(3)).project(v.camera).x;
      sim.move(r,1/60,touch?joystickAxes(side,-1):{throttle:1,steer:side});
      const after=origin.clone().add(new THREE.Vector3(Math.sin(r.yaw),0,Math.cos(r.yaw)).multiplyScalar(3)).project(v.camera).x;
      assert.ok((after-before)*side>0,`${mode} ${yaw}: ${side} must turn toward the matching side of the screen`);
    }
    v.clear();
  }
});
test('render interpolation fills physics frames and crosses the yaw wrap without spinning',()=>{
  const r={x:10,y:6,z:4,yaw:-Math.PI+.02,pitch:.2,roll:.1,previous:{x:8,y:4,z:2,yaw:Math.PI-.02,pitch:0,roll:0}};
  const p=racerPose(r,.5);assert.equal(p.x,9);assert.equal(p.y,5);assert.equal(p.z,3);assert.ok(Math.abs(Math.abs(p.yaw)-Math.PI)<1e-8);
  assert.equal(racerPose(r,0).x,8);assert.equal(racerPose(r,1).x,10);
});
for(const habitat of HABITATS)test(`${habitat.id} home tank builds and updates without a browser`,()=>{const v=Object.create(RaceScene.prototype);Object.assign(v,{lowPower:true,scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(48,1,.1,1400),target:new THREE.Vector3(),effects:new Map(),racers:[],animals:[],gates:[],plants:[],renderer:{render(){},setViewport(){}}});const sim=new Simulation(habitat.id);v.setWorld(sim);assert.equal(v.gates.length,sim.config.gates);assert.equal(v.racers.length,4);assert.equal(v.animals.length,sim.animals.length);assert.ok(v.tankShell);assert.equal(v.room.visible,true);let sharedDisposals=0;v.animals[0].traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>sharedDisposals++);});if(habitat.waterfall)assert.ok(v.waterfalls.length>=2);v.update(sim,.016,true);sim.start();for(let i=0;i<300;i++){sim.step(1/60,sim.aiInput(sim.racers[0]));if(i%20===0)v.update(sim,1/60,false);}assert.ok(Number.isFinite(v.camera.position.x+v.camera.position.y+v.camera.position.z));sim.dropFood();sim.waste.push({id:1000,x:0,y:4,z:0,ttl:2,radius:2});sim.tongues.push({id:1001,from:{x:0,y:1,z:0},to:{x:6,y:2,z:3},ttl:.5,age:.8});v.update(sim,.016,false);assert.ok(v.effects.size>=2);v.clear();assert.equal(v.scene.children.length,0);assert.equal(sharedDisposals,0,'reusable animal geometry survives a world switch');});

test('quality settings retain antialias-independent shadows and model detail',()=>{
 globalThis.devicePixelRatio=3;let ratio;
 const v=Object.create(RaceScene.prototype);v.renderer={setPixelRatio(n){ratio=n;},shadowMap:{enabled:false}};v.resize=()=>{};
 v.setQuality('high');assert.equal(ratio,2);assert.equal(v.renderer.shadowMap.enabled,true);
 v.setQuality('balanced');assert.equal(ratio,1.25);assert.equal(v.renderer.shadowMap.enabled,true);
 v.setQuality('performance');assert.equal(ratio,1);assert.equal(v.renderer.shadowMap.enabled,false);
});
