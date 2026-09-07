import test from 'node:test';
import assert from 'node:assert/strict';
import {HABITATS,SPECIES,tankOutline,constrainToTank,getHabitat} from '../dist/src/habitats.js';
import {pathPoint} from '../dist/src/simulation.js';

test('collection contains five aquariums and five terrariums with varied home-tank shapes',()=>{
 assert.equal(HABITATS.filter(h=>h.kind==='aquarium').length,5);
 assert.equal(HABITATS.filter(h=>h.kind==='terrarium').length,5);
 assert.ok(new Set(HABITATS.map(h=>h.shape)).size>=6);
 assert.ok(HABITATS.some(h=>h.shape==='cylinder'&&h.theme==='jelly'));
 assert.ok(HABITATS.some(h=>h.shape==='paludarium'&&h.waterfall));
});
test('every habitat has a valid regional theme, palette and modeled species roster',()=>{
 const ids=new Set();for(const h of HABITATS){assert.ok(!ids.has(h.id));ids.add(h.id);assert.equal(getHabitat(h.id),h);assert.ok(h.region&&h.description&&h.shapeLabel&&h.size);assert.ok(h.roster.length>0);for(const color of Object.values(h.palette))assert.ok(Number.isInteger(color)&&color>=0&&color<=0xffffff);for(const id of h.roster){const s=SPECIES[id];assert.ok(s,`${h.id}: ${id}`);assert.ok(s.name&&s.latin&&s.model&&s.radius>0);}}
});
test('every habitat has its own course silhouette and aquariums contain visible schools',()=>{
 assert.equal(new Set(HABITATS.map(h=>h.course)).size,HABITATS.length);
 const signatures=HABITATS.map(h=>Array.from({length:16},(_,i)=>{const p=pathPoint(h,i/16);return `${(p.x/h.trackX).toFixed(2)},${(p.z/h.trackZ).toFixed(2)}`;}).join('|'));
 assert.equal(new Set(signatures).size,HABITATS.length);
 for(const h of HABITATS.filter(h=>h.kind==='aquarium'))assert.ok(h.animalCount>=24,h.id);
});
test('aquariums define ecosystem-specific water and aquascapes',()=>{
 const tanks=HABITATS.filter(h=>h.kind==='aquarium');
 assert.equal(tanks.filter(h=>h.waterType==='freshwater').length,3);
 assert.equal(tanks.filter(h=>h.waterType==='saltwater').length,2);
 assert.equal(new Set(tanks.map(h=>h.aquascape)).size,5);
 for(const h of tanks){assert.ok(h.aquascape);if(h.theme!=='jelly')assert.ok(h.relief?.length>=2,`${h.id} needs underwater slopes`);}
});
test('tank outlines are clockwise convex polygons and boundary projection works for every shape',()=>{
 for(const h of HABITATS){const p=tankOutline(h);assert.ok(p.length>=4);let sign=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],c=p[(i+2)%p.length],cross=(b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x);if(Math.abs(cross)>1e-8){if(!sign)sign=Math.sign(cross);assert.equal(Math.sign(cross),sign,h.id);}}
  assert.deepEqual(constrainToTank(h,0,0),{x:0,z:0});const q=constrainToTank(h,h.halfWidth*3,h.halfDepth*3);assert.ok(Math.abs(q.x)<h.halfWidth*1.01&&Math.abs(q.z)<h.halfDepth*1.01);
 }
});
