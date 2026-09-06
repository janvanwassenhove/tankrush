import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createVehicle} from './models.js?v=4';
import {createCreature,colorSpecies} from './creatures.js?v=4';
import {getHabitat,SPECIES} from './habitats.js?v=4';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const cache=new Map(),loading=new Map();
export async function preloadModels(key='aquarium'){
 const h=getHabitat(key),names=[h.kind==='aquarium'?'submarine':'buggy',...new Set(h.roster.map(id=>SPECIES[id].model))],loader=new GLTFLoader();
 return Promise.allSettled(names.map(name=>{
  if(cache.has(name))return cache.get(name);
  if(!loading.has(name))loading.set(name,loader.loadAsync(new URL(`../models/${name}.glb`,import.meta.url).href).then(gltf=>{gltf.scene.userData.kind=name;cache.set(name,gltf.scene);return gltf.scene;}).finally(()=>loading.delete(name)));
  return loading.get(name);
 }));
}
function clone(name){if(!cache.has(name))return null;const root=cache.get(name).clone(true);root.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=o.material.clone();o.castShadow=true;o.receiveShadow=true;}});return root;}
function mergeRigid(root){
 root.traverse(g=>{if(g.isMesh)return;const batches=new Map();for(const m of [...g.children]){if(!m.isMesh||m.material.transparent)continue;const a=m.material,key=[a.color.getHex(),a.emissive.getHex(),a.roughness,a.side,Object.keys(m.geometry.attributes).sort().join(',')].join('/');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);}
  for(const meshes of batches.values()){if(meshes.length<2)continue;const copies=meshes.map(m=>{m.updateMatrix();return (m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix);});const geo=mergeGeometries(copies,false);if(geo){const merged=meshes[0].clone();merged.geometry=geo;merged.position.set(0,0,0);merged.rotation.set(0,0,0);merged.scale.set(1,1,1);merged.name='Rigid body';for(const m of meshes){g.remove(m);m.geometry.dispose();}g.add(merged);}copies.forEach(c=>c.dispose());}
 });return root;
}
export function vehicleModel(mode,color){const root=clone(mode==='aquarium'?'submarine':'buggy')||createVehicle(mode,color);root.traverse(o=>{if(o.isMesh&&o.name.startsWith('paint'))o.material.color.setHex(color);});return mergeRigid(root);}
export function animalModel(speciesId){const profile=SPECIES[speciesId];if(!profile)throw new Error(`Unknown species: ${speciesId}`);return mergeRigid(colorSpecies(clone(profile.model)||createCreature(profile.model),profile));}
