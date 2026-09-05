import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='three')specifier=new URL('../dist/vendor/three/three.module.js',import.meta.url).href;else if(specifier.startsWith('three/addons/'))specifier=new URL('../dist/vendor/three/addons/'+specifier.slice(13),import.meta.url).href;return next(specifier,context);}});
const THREE=await import('../dist/vendor/three/three.module.js');
const {RaceScene}=await import('../dist/src/scene.js');
const {Simulation}=await import('../dist/src/simulation.js');
globalThis.innerWidth=1280;globalThis.innerHeight=800;
for(const mode of ['aquarium','terrarium'])test(`${mode} world builds and updates without a browser`,()=>{const v=Object.create(RaceScene.prototype);Object.assign(v,{scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(48,1,.1,250),target:new THREE.Vector3(),effects:new Map(),racers:[],animals:[],gates:[],plants:[],renderer:{render(){}}});const sim=new Simulation(mode);v.setWorld(sim);assert.equal(v.gates.length,12);assert.equal(v.racers.length,4);assert.equal(v.animals.length,sim.animals.length);v.update(sim,.016,true);sim.start();for(let i=0;i<600;i++){sim.step(1/60,sim.aiInput(sim.racers[0]));if(i%10===0)v.update(sim,1/60,false);}assert.ok(Number.isFinite(v.camera.position.x+v.camera.position.y+v.camera.position.z));sim.dropFood();sim.waste.push({id:1000,x:0,y:4,z:0,ttl:2,radius:2});sim.tongues.push({id:1001,from:{x:0,y:1,z:0},to:{x:6,y:2,z:3},ttl:.5,age:.8});v.update(sim,.016,false);assert.ok(v.effects.size>=2);v.clear();assert.equal(v.scene.children.length,0);});
