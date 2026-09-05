import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createVehicle,createAnimal} from './models.js';
const cache=new Map(),names=['submarine','buggy','guppy','piranha','spider','snake','monitor','chameleon'];
export async function preloadModels(){const loader=new GLTFLoader();return Promise.allSettled(names.map(async name=>{const gltf=await loader.loadAsync(new URL(`../models/${name}.glb`,import.meta.url).href);gltf.scene.userData.kind=name;cache.set(name,gltf.scene);}));}
function clone(name){if(!cache.has(name))return null;const root=cache.get(name).clone(true);root.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=o.material.clone();o.castShadow=true;o.receiveShadow=true;}});return root;}
export function vehicleModel(mode,color){const root=clone(mode==='aquarium'?'submarine':'buggy')||createVehicle(mode,color);root.traverse(o=>{if(o.isMesh&&o.name.startsWith('paint'))o.material.color.setHex(color);});return root;}
export function animalModel(type){return clone(type)||createAnimal(type);}
