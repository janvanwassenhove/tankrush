// Offline render of the actual scene meshes; no browser or GPU required.
import {registerHooks} from 'node:module';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
registerHooks({resolve(s,c,next){if(s==='three')s=new URL('../dist/vendor/three/three.module.js',import.meta.url).href;else if(s.startsWith('three/addons/'))s=new URL('../dist/vendor/three/addons/'+s.slice(13),import.meta.url).href;return next(s,c);}});
const T=await import('three');
const {HABITATS}=await import('../dist/src/habitats.js');
const {Simulation,random}=await import('../dist/src/simulation.js');
const {buildDecor}=await import('../dist/src/decor.js');
const {animalModel}=await import('../dist/src/assets.js');
mkdirSync('dist/previews',{recursive:true});
for(const h of HABITATS){
 const sim=new Simulation(h.id),scene=new T.Scene();buildDecor(scene,sim,random(h.seed));
 for(const a of sim.animals){const g=animalModel(a.speciesId);g.position.set(a.x,a.y,a.z);g.rotation.y=a.yaw;scene.add(g);}
 const extent=Math.max(h.halfWidth*2.6,h.height+135),camera=new T.OrthographicCamera(-extent*.85,extent*.85,extent*.567,-extent*.567,1,2500);
 const target=new T.Vector3(0,h.height*.32-20,0);camera.position.copy(target).add(new T.Vector3(240,145,520));camera.lookAt(target);camera.updateMatrixWorld();scene.updateMatrixWorld(true);
 const triangles=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3(),light=new T.Vector3(-.4,.85,.4).normalize(),instance=new T.Matrix4();
 scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const mat=o.material;if(Array.isArray(mat)||mat.opacity<.25)return;
 const p=o.geometry.attributes.position,idx=o.geometry.index;
 for(let n=0;n<(o.isInstancedMesh?o.count:1);n++){
  let matrix=o.matrixWorld;if(o.isInstancedMesh){o.getMatrixAt(n,instance);matrix=o.matrixWorld.clone().multiply(instance);}
  for(let i=0;i<(idx?.count??p.count);i+=3){const v=[a,b,c];for(let j=0;j<3;j++)v[j].fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(matrix);
   normal.subVectors(b,a).cross(c.clone().sub(a)).normalize();const shade=.56+.44*Math.abs(normal.dot(light));const color=mat.color.clone().multiplyScalar(shade).convertLinearToSRGB();const rgb=color.toArray().map(x=>Math.round(Math.min(1,x)*255));
   const projected=v.map(x=>x.clone().project(camera));if(['x','y'].some(k=>projected.every(x=>x[k]>1.2)||projected.every(x=>x[k]<-1.2)))continue;
   triangles.push([projected.reduce((s,x)=>s+x.z,0)/3,projected.flatMap(x=>[Math.round((x.x+1)*600),Math.round((1-x.y)*400),x.z]),rgb]);
  }
 }
 });triangles.sort((a,b)=>b[0]-a[0]);const path=`dist/previews/${h.id}.json`;writeFileSync(path,JSON.stringify(triangles));
 const r=spawnSync('python',['scripts/render-previews.py',path,`dist/previews/${h.id}.webp`],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);unlinkSync(path);console.log(h.id,r.stdout.trim());
}
