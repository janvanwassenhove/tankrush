import * as THREE from 'three';
import {tankOutline,constrainToTank} from './habitats.js?v=14';
import {surfaceAt} from './simulation.js?v=14';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const up=new THREE.Vector3(0,1,0);
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...extra});
function add(parent,geo,mat,p=[0,0,0],s=[1,1,1],name=''){const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function beam(parent,a,b,r,mat,name=''){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=add(parent,new THREE.CylinderGeometry(r,r,d.length(),6),mat);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,d.normalize());m.name=name;return m;}
function slab(parent,size,mat,p,name=''){return add(parent,new THREE.BoxGeometry(...size),mat,p,[1,1,1],name);}
// Curved leaves use a few triangles rather than flattened spheres; each plant
// still becomes one mesh after batching, with a darker root and a bright tip.
function aquaticLeaf(parent,mat,{length,width,angle,bend,base=[0,0,0]}){
 if(parent.userData.maxLeafBend) bend=Math.min(bend,parent.userData.maxLeafBend);
 const positions=[],colors=[],indices=[],steps=7;
 for(let i=0;i<=steps;i++){
  const t=i/steps,spread=Math.sin(Math.PI*t)**.7*width+.015;
  const x=Math.sin(angle)*bend*t*t,y=length*t,z=Math.cos(angle)*bend*t*t;
  for(const side of [-1,1]){positions.push(base[0]+x+Math.cos(angle)*spread*side,base[1]+y,base[2]+z-Math.sin(angle)*spread*side);colors.push(.58+t*.34,.66+t*.34,.48+t*.3);}
  if(i<steps){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
 return add(parent,geo,mat,[0,0,0],[1,1,1],'Curved aquatic leaf');
}
function furnishRoom(room,h,w,d,rng){
 const themes={
  blackwater:[0x27322f,0xb86e45,0xd5b56b],planted:[0x20352f,0x5aa57d,0xe1c675],rift:[0x303a43,0x4f86ad,0xd8ba72],
  reef:[0x20384b,0x55a9b8,0xf08f68],jelly:[0x202644,0x7a6bd0,0xb9a8ff],outback:[0x4a2f28,0xb85f3e,0xe5b76e],
  desert:[0x4b3b32,0xc99761,0x78a18b],canopy:[0x25382e,0x57905d,0xe4b467],waterfall:[0x203a39,0x3a8b82,0xefd172],ferns:[0x29382f,0x77975c,0xd3a56b]
 },[wall,accent,soft]=themes[h.theme]||themes.planted,upholstery=material(accent),pale=material(soft),ink=material(0x202526),frame=material(0x6b5139);
 // A compact themed chamber: wall colour, framed art, seating, shelving and lived-in objects.
 room.children.find(o=>o.name==='Room wall').material.color.setHex(wall);
 slab(room,[w*1.35,1.2,d*1.45],material(soft,{roughness:1}),[0,-76,d*.12],'Room rug');
 const sofaX=w+42,sofaZ=-d*.38;
 slab(room,[38,12,16],upholstery,[sofaX,-66,sofaZ],'Lounge chair seat');
 slab(room,[38,30,7],upholstery,[sofaX,-52,sofaZ-7],'Lounge chair back');
 for(const sign of [-1,1])slab(room,[5,18,17],ink,[sofaX+sign*20,-58,sofaZ],'Chair arm');
 for(const sign of [-1,1])beam(room,[sofaX+sign*14,-72,sofaZ-5],[sofaX+sign*14,-78,sofaZ-5],1.2,ink,'Chair leg');
 const shelfX=-w-38;
 slab(room,[30,72,7],frame,[shelfX,-39,-d-55],'Display shelf');
 for(let y=-65;y<-5;y+=15)slab(room,[28,2,12],ink,[shelfX,y,-d-47],'Shelf');
 for(let i=0;i<9;i++)slab(room,[2+rng()*3,8+rng()*7,7],material(i%3===0?accent:i%3===1?soft:0x765849),[shelfX-11+i*2.8,-61+(i%3)*15,-d-40],'Book');
 for(let i=0;i<3;i++){
  const x=(i-1)*34,cy=55+(i%2)*18;
  slab(room,[29,cy===55?30:24,2.4],frame,[x,cy,-d-65],'Picture frame');
  slab(room,[24,cy===55?25:19,1],material(i===1?accent:soft,{emissive:i===1?accent:0,emissiveIntensity:.08}),[x,cy,-d-63.6],'Regional wall art');
 }
 const side=-w-18;
 for(let i=0;i<5;i++){
  const x=side+i*7,z=d+20+(i%2)*7,y=-74+(i%3)*2,color=[accent,soft,0x4f79b8,0xd76555][i%4];
  const toy=add(room,i%2?new THREE.SphereGeometry(3,8,6):new THREE.BoxGeometry(6,6,6),material(color),[x,y,z],[1,1,1],'Kids toy');toy.rotation.y=rng()*3;
 }
 const tableX=w+35,tableZ=d*.42;
 slab(room,[28,3,18],frame,[tableX,-58,tableZ],'Side table');
 for(const sx of [-1,1])for(const sz of [-1,1])beam(room,[tableX+sx*11,-59,tableZ+sz*6],[tableX+sx*11,-77,tableZ+sz*6],1.2,ink,'Table leg');
 const pot=add(room,new THREE.CylinderGeometry(5,4,7,10),material(0x9a6749),[tableX,-53,tableZ],[1,1,1],'Houseplant pot');
 for(let i=0;i<7;i++){const a=i*2.3;beam(room,[tableX,-49,tableZ],[tableX+Math.sin(a)*8,-31-rng()*8,tableZ+Math.cos(a)*6],.7,material(0x4f8051),'Houseplant');}
 if(['jelly','reef','waterfall'].includes(h.theme)){
  const lampX=-w-18;beam(room,[lampX,-77,-d*.2],[lampX,15,-d*.2],1.3,ink,'Floor lamp');
  add(room,new THREE.ConeGeometry(12,18,20,1,true),material(accent,{side:THREE.DoubleSide}),[lampX,15,-d*.2],[1,1,1],'Floor lamp shade');
 }else{
  add(room,new THREE.SphereGeometry(9,12,8),material(soft),[-w-18,-66,d+35],[1,1,1],'Play ball');
 }
}
function mergeStatic(parent){
 const batches=new Map();for(const m of [...parent.children]){if(!m.isMesh||m.material.transparent)continue;const a=m.material,key=[a.color.getHex(),a.emissive.getHex(),a.emissiveIntensity,a.roughness,a.metalness,a.side,Object.keys(m.geometry.attributes).sort().join(',')].join('/');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);}
 for(const meshes of batches.values()){if(meshes.length<2)continue;const copies=meshes.map(m=>{m.updateMatrix();return (m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix);});const geo=mergeGeometries(copies,false);if(geo){add(parent,geo,meshes[0].material,[0,0,0],[1,1,1],'Static scenery');for(const m of meshes)parent.remove(m);}copies.forEach(g=>g.dispose());}
}
function surface(h,height){
 const corners=tankOutline(h),outline=[];for(let i=0;i<corners.length;i++){const a=corners[i],b=corners[(i+1)%corners.length],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/8));for(let j=0;j<n;j++)outline.push({x:a.x+(b.x-a.x)*j/n,z:a.z+(b.z-a.z)*j/n});}
 const n=outline.length,rings=24,vertices=[0,height(0,0),0],indices=[];
 for(let r=1;r<=rings;r++)for(const p of outline){const x=p.x*r/rings,z=p.z*r/rings;vertices.push(x,height(x,z),z);}
 for(let i=0;i<n;i++)indices.push(0,1+(i+1)%n,1+i);
 for(let r=0;r<rings-1;r++)for(let i=0;i<n;i++){const a=1+r*n+i,b=1+r*n+(i+1)%n,c=a+n,d=b+n;indices.push(a,b,c,b,d,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildDecor(scene,sim,rng){
 const h=sim.habitat,p=h.palette,w=h.halfWidth,d=h.halfDepth,top=h.height,water=sim.config.water;
 const shell=new THREE.Group();shell.name='Home tank · '+h.shape;scene.add(shell);
 const room=new THREE.Group();room.name='Living room and aquarium cabinet';scene.add(room);
 const dark=material(0x242b2b),wood=material(p.wood),metal=material(0x454d4e,{metalness:.65,roughness:.3}),glass=material(0xd5edf0,{transparent:true,opacity:.09,roughness:.08,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
 slab(room,[1400,4,1100],material(0x393c40),[0,-79,80],'Room floor');
 slab(room,[1400,440,4],material(0x424b4e),[0,140,-d-68],'Room wall');
 slab(room,[1400,4,2],material(0x737d7b),[0,-73,-d-64],'Skirting');
 for(let x=-600;x<650;x+=70)slab(room,[.5,.08,1100],material(0x555b5c),[x,-76.95,80]);
 slab(room,[w*2+8,66,d*2+8],wood,[0,-39,0],'Display cabinet');
 slab(room,[w*2+12,5,d*2+12],dark,[0,-4,0],'Cabinet top');
 for(const sign of [-1,1]){slab(room,[w-3,55,1.5],material(0x635246),[sign*w*.5,-39,d+5],'Cabinet door');slab(room,[1,10,2],metal,[sign*5,-35,d+7],'Door handle');}
 furnishRoom(room,h,w,d,rng);
 const outline=tankOutline(h),waterfalls=[],aquaticEffects=[],plants=[],shellMaterials=[glass];
 add(shell,surface(h,()=>-1),dark,[0,0,0],[1,1,1],'Tank base');
 const groundGeo=surface(h,(x,z)=>sim.groundAt(x,z));
 {const pos=groundGeo.attributes.position,colors=[],soil=new THREE.Color(p.ground),rock=new THREE.Color(p.rock),wet=new THREE.Color(0x475e50),sand=new THREE.Color(h.theme==='blackwater'?0xc2a96f:h.theme==='reef'?0xf1e9cc:p.ground);for(let i=0;i<pos.count;i++){let c;if(water){const height=Math.max(0,pos.getY(i)),mix=Math.min(.45,height/35);c=soil.clone().lerp(h.theme==='rift'?rock:sand,mix);}else{const kind=surfaceAt(pos.getX(i),pos.getZ(i),h);c=kind==='stream'?wet:kind==='rock'?rock:soil;}colors.push(c.r,c.g,c.b);}groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));}
 const ground=add(scene,groundGeo,material(0xffffff,{vertexColors:true}),[0,0,0],[1,1,1],'Ecosystem substrate');
 const pools=[];
 for(const f of h.pools||[]){const m=add(scene,new THREE.CircleGeometry(1,64),material(0x60b9b7,{transparent:true,opacity:.62,roughness:.13,metalness:.18,depthWrite:false}),[f.x,f.level+.03,f.z],[f.rx,f.rz,1],'Shallow pool');m.rotation.x=-Math.PI/2;m.castShadow=false;pools.push(m);
  const ripples=new THREE.Group();ripples.position.set(f.x,f.level+.06,f.z);scene.add(ripples);for(let i=0;i<3;i++){const r=add(ripples,new THREE.RingGeometry(.32+i*.21,.33+i*.21,48),material(0xc2fff0,{transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}),[0,0,0],[f.rx,f.rz,1],'Pool ripple');r.rotation.x=-Math.PI/2;r.castShadow=false;}pools.push(ripples);
 }

 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],length=Math.hypot(b.x-a.x,b.z-a.z),angle=Math.atan2(b.z-a.z,b.x-a.x);
  const pane=add(shell,new THREE.PlaneGeometry(length,top),glass,[(a.x+b.x)/2,top/2,(a.z+b.z)/2],[1,1,1],'Glass wall');pane.rotation.y=-angle;
  for(const y of [0,top])beam(shell,[a.x,y,a.z],[b.x,y,b.z],h.shape==='cube'?.28:1.1,dark,'Tank rim');
  if(h.shape!=='cylinder'&&h.shape!=='bowfront')beam(shell,[a.x,0,a.z],[a.x,top,a.z],water?.32:.8,metal,'Corner seam');
  beam(shell,[a.x,3,a.z],[b.x,3,b.z],1.5,material(p.ground),'Substrate edge');
 }
 if(water){
  add(shell,surface(h,()=>h.waterLevel),material(p.light,{transparent:true,opacity:.1,roughness:.15,side:THREE.DoubleSide,depthWrite:false}),[0,0,0],[.995,1,.995],'Waterline');
  if(h.theme==='jelly'){
   for(const y of [4,top-3])add(shell,new THREE.CylinderGeometry(w,w,5,64,true),dark,[0,y,0],[1,1,d/w],'Circular filter housing');
   add(shell,new THREE.TorusGeometry(w-2,.7,6,64),material(p.accent,{emissive:p.accent,emissiveIntensity:1.4}),[0,top-4,0]).rotation.x=Math.PI/2;
  }else{
   const fx=-w+8,fz=-d+9;
   slab(shell,[8,top*.52,7],dark,[fx,top*.32,fz],'Internal filter');
   for(let i=0;i<8;i++)slab(shell,[6,.6,.2],metal,[fx,9+i*2,fz+3.6],'Intake slot');
   beam(shell,[fx,top*.58,fz],[fx,top*.87,fz],1.2,metal,'Return tube');beam(shell,[fx,top*.87,fz],[fx+14,top*.87,fz],1.2,metal);
   beam(shell,[w-5,10,-d+5],[w-5,top*.56,-d+5],.9,dark,'Heater');
  }
  for(const sign of [-1,1])beam(shell,[sign*w*.65,top,0],[sign*w*.65,top+8,0],.8,metal,'Light bracket');
  slab(shell,[w*1.45,3,9],dark,[0,top+9,0],'Aquarium LED bar');
  slab(shell,[w*1.36,.3,6],material(p.light,{emissive:p.light,emissiveIntensity:2}),[0,top+7.3,0],'LED strip');
 }else{
  // Functional-looking front doors, screen lid and lamps distinguish vivariums from fish tanks.
  if(h.shape!=='hexagon'){
   slab(shell,[w*2,4,2],dark,[0,9,d+.2],'Front ventilation strip');
   for(let i=0;i<28;i++)slab(shell,[w*1.8/40,1,.4],metal,[-w*.9+i*w*1.8/27,9,d+1.3]);
   beam(shell,[0,11,d+.4],[0,top,d+.4],.5,metal,'Door seam');
   for(const sign of [-1,1])slab(shell,[1.4,8,2],dark,[sign*3,top*.42,d+1.5],'Door latch');
  }
  for(let i=-10;i<=10;i++){const x=w*i/11,a=constrainToTank(h,x,-d,1),b=constrainToTank(h,x,d,1);beam(shell,[a.x,top,a.z],[b.x,top,b.z],.16,metal,'Mesh lid');}
  for(let i=-10;i<=10;i++){const z=d*i/11,a=constrainToTank(h,-w,z,1),b=constrainToTank(h,w,z,1);beam(shell,[a.x,top,a.z],[b.x,top,b.z],.16,metal);}
  const lamp=add(shell,new THREE.ConeGeometry(10,9,24,1,true),dark,[-w*.4,top+8,0],[1,1,1],'Heat lamp');
  add(shell,new THREE.SphereGeometry(3,12,8),material(p.light,{emissive:p.light,emissiveIntensity:2}),[-w*.4,top+5,0]);
  slab(shell,[w*.8,3,6],dark,[w*.3,top+5,-d*.45],'UVB fixture');
  const bowl=add(scene,new THREE.CylinderGeometry(6,7,2.4,20),material(p.rock),[w*.66,sim.groundAt(w*.66,d*.5)+.9,d*.5],[1,1,1],'Water dish');
  add(scene,new THREE.CircleGeometry(5.4,20),material(0x638f95,{roughness:.1}),[bowl.position.x,bowl.position.y+1.3,bowl.position.z]).rotation.x=-Math.PI/2;
 }
 const rockGeo=new THREE.IcosahedronGeometry(1,1),rockMat=material(p.rock);
 for(const [x,z,s] of sim.rocks)add(scene,rockGeo,rockMat,[x,sim.groundAt(x,z)+s*.6,z],[s,s*1.4,s*.8],'Collision boulder');
 for(let i=0;i<h.rocks;i++){
  const a=rng()*Math.PI*2,k=.2+rng()*.45,x=Math.cos(a)*h.trackX*k,z=Math.sin(a)*h.trackZ*k,s=3+rng()*(h.theme==='rift'?12:6);
  const r=add(scene,rockGeo,rockMat,[x,sim.groundAt(x,z)+s*.6,z],[s*1.3,s*(h.theme==='outback'?.4:1.1),s],'Hardscape rock');r.rotation.y=rng()*6;
 }
 function plant(x,z,height,style=h.theme){
  const g=new THREE.Group();g.position.set(x,sim.groundAt(x,z),z);g.name=style==='reef'?'Branching coral':'Live plant';scene.add(g);const m=material(style==='reef'?[0xe5a580,0xbb8ada,0x7baab8][Math.floor(rng()*3)]:p.leaf,{side:THREE.DoubleSide});
  if(water&&style!=='reef'){
   const ribbon=style==='rift'||(style==='planted'&&rng()<.4),stem=style==='planted'&&!ribbon&&rng()<.55;
   g.name=ribbon?'Ribbon grass':stem?'Stem plant thicket':'Sword plant rosette';
   g.userData.maxLeafBend=Math.max(1,Math.min(w-Math.abs(x),d-Math.abs(z))-6);
   m.color.setHex(style==='blackwater'?[0x659f43,0x77984e,0x478851][Math.floor(rng()*3)]:style==='rift'?0x6b9351:[0x59ab49,0x7bb950,0x32845e,0xa6794b][Math.floor(rng()*4)]);m.vertexColors=true;
   height=Math.min(height,h.waterLevel-g.position.y-12);
   if(stem){for(let i=0;i<4;i++){const angle=i*2.4,len=height*(.7+rng()*.3),base=[Math.sin(angle)*3,0,Math.cos(angle)*3];aquaticLeaf(g,m,{length:len,width:.13,angle,bend:2,base});for(let j=1;j<=6;j++)for(const sign of [-1,1])aquaticLeaf(g,m,{length:len*.075,width:1.25,angle:angle+(sign>0?Math.PI:0)+j*.3,bend:5,base:[base[0],len*j/7,base[2]]});}}
   else for(let i=0;i<9;i++)aquaticLeaf(g,m,{length:height*(.45+rng()*.55),width:ribbon?.65:2.4,angle:i*2.4,bend:height*(ribbon?.12:.34)});
  }else if(style==='desert'||style==='outback'){
   for(let i=0;i<7;i++){const a=i*2.4,leaf=add(g,new THREE.ConeGeometry(.9,height,4),m,[Math.sin(a)*2,height*.37,Math.cos(a)*2],[1,1,.4]);leaf.rotation.z=Math.sin(a)*.6;leaf.rotation.x=Math.cos(a)*.6;}
  }else if(style==='reef'){
   for(let i=0;i<5;i++){const a=i*2.4,b=[Math.sin(a)*height*.4,height*(.5+rng()*.5),Math.cos(a)*height*.4];beam(g,[0,0,0],b,.5,m);for(const sign of [-1,1])beam(g,b,[b[0]+sign*2,b[1]+3,b[2]+1],.35,m);}
  }else{
   for(let i=0;i<5;i++){
    const a=i*2.4,stem=[Math.sin(a)*3,height*(.65+rng()*.35),Math.cos(a)*3];beam(g,[0,0,0],stem,.15,m);
    for(let j=1;j<=3;j++){const leaf=add(g,new THREE.SphereGeometry(1,6,4),m,[stem[0]*j/3,stem[1]*j/3,stem[2]*j/3],[style==='ferns'?1.2:2.2,.16,style==='planted'?3.8:5]);leaf.rotation.set(.3,a+j,.35);if(style==='ferns')for(let k=-2;k<=2;k++)beam(g,[stem[0]*j/3,stem[1]*j/3,stem[2]*j/3],[stem[0]*j/3+k,stem[1]*j/3+.3,stem[2]*j/3+3-Math.abs(k)],.12,m);}
   }
  }
  if(style==='reef'){
   // Hard coral stays fixed and batches with the rest of the reef scenery.
   for(const child of [...g.children]){child.position.add(g.position);scene.add(child);}scene.remove(g);
  }else plants.push({g,phase:rng()*6});
 }
 for(let i=0;i<h.plants;i++){
  const a=rng()*Math.PI*2,k=i%3===0?.25+rng()*.3:1.28+rng()*.08;
  const pt=constrainToTank(h,Math.cos(a)*h.trackX*k,Math.sin(a)*h.trackZ*k,8);
  const background=pt.z<-d*.45||Math.abs(pt.x)>w*.72;
  plant(pt.x,pt.z,water?(background?28+h.height*.3+rng()*h.height*.2:12+rng()*h.height*.22):12+rng()*h.height*.3);
 }
 const bark=material(p.wood);
 for(let i=0;i<h.branches;i++){
  const x=(rng()-.5)*h.trackX,z=(rng()-.5)*h.trackZ,y=sim.groundAt(x,z),height=water?20+rng()*h.height*.25:22+rng()*h.height*.55;
  const b=[x+8,y+height,z-7];beam(scene,[x,y,z],b,1.5+rng(),bark,'Driftwood / climbing branch');beam(scene,b,[b[0]-10,b[1]+8,b[2]+5],.8,bark);
 }
 for(const a of sim.animals.filter(a=>a.profile.behavior==='climb'))beam(scene,[a.home.x-4,sim.groundAt(a.home.x-4,a.home.z),a.home.z],[a.home.x+4,a.home.y-.6,a.home.z],.7,bark,'Animal perch');
 if(h.theme==='blackwater'||h.theme==='ferns')for(let i=0;i<65;i++){const x=(rng()-.5)*w*1.7,z=(rng()-.5)*d*1.7,leaf=add(scene,new THREE.SphereGeometry(1,5,3),material(i%2?0x82603c:0xa47b45),[x,sim.groundAt(x,z)+.1,z],[1.4,.08,3]);leaf.rotation.y=rng()*6;}
 if(h.theme==='reef'){
  for(let i=0;i<38;i++)plant((rng()-.5)*h.trackX*1.7,(rng()-.5)*h.trackZ*1.65,6+rng()*17,'reef');
  for(let i=0;i<5;i++){const x=(i-2)*21,z=i%2?18:-18,g=new THREE.Group();g.name='Soft anemone';g.position.set(x,sim.groundAt(x,z),z);scene.add(g);const m=material(i%2?0xbce6aa:0xf3b6cf);for(let j=0;j<16;j++){const a=j*2.4,r=2+rng()*4;beam(g,[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(a)*(r+1),5+rng()*5,Math.sin(a)*(r+1)],.35,m,'Anemone tentacle');}plants.push({g,phase:rng()*6});}
  const coralColors=[0xff8c73,0xf6c85f,0x9d7bea,0x48b9b2,0xeaa1c4];
  for(let i=0;i<18;i++){const x=(rng()-.5)*w*1.65,z=(rng()-.5)*d*1.55,y=sim.groundAt(x,z),c=material(coralColors[i%coralColors.length]),height=5+rng()*9,radius=1.4+rng();add(scene,new THREE.CylinderGeometry(radius,2+rng(),height,9,1,true),c,[x,y+height/2,z],[1,1,1],'Tube sponge');add(scene,new THREE.CylinderGeometry(radius*.72,radius*.72,.15,9),material(0x473553),[x,y+height-.8,z],[1,1,1],'Sponge opening');if(i%3===0){beam(scene,[x+6,y,z],[x+6,y+8,z],.65,c,'Plate coral stalk');for(let tier=0;tier<3;tier++)add(scene,new THREE.CylinderGeometry(5-tier*.8,4.3-tier*.8,.7,14),c,[x+6,y+6+tier*2,z],[1,1,.8],'Plate coral');}}
  for(const sign of [-1,1]){const x=sign*47,z=sign*-22,y=sim.groundAt(x,z);beam(scene,[x-11,y,z],[x,y+15,z],5,rockMat,'Reef arch');beam(scene,[x,y+15,z],[x+12,y,z],5,rockMat,'Reef arch');}
 }
 if(h.theme==='blackwater'){
  // Flooded-bank roots spread into the open water and frame the race line.
  for(const sign of [-1,1])for(let i=0;i<7;i++){const x=sign*(w-10),z=-d+10+i*d*.27,y=sim.groundAt(x,z);beam(scene,[x,y+32,z],[x-sign*(18+rng()*20),y+4,z+(rng()-.5)*17],1.2+rng()*1.3,bark,'Flooded root');}
  for(let i=0;i<16;i++)plant((rng()-.5)*w*1.7,(rng()-.5)*d*1.55,6+rng()*10,'blackwater');
 }
 if(h.theme==='planted'){
  // Low foreground carpet and layered moss stones make the planted cube feel full at every height.
  const carpetGeo=new THREE.ConeGeometry(.28,2.8,4),carpetMat=material(0x65ad54);
  for(let cluster=0;cluster<14;cluster++){const cx=(rng()-.5)*w*1.7,cz=(rng()-.5)*d*1.7;for(let i=0;i<9;i++){const x=cx+(rng()-.5)*12,z=cz+(rng()-.5)*12;add(scene,carpetGeo,carpetMat,[x,sim.groundAt(x,z)+1.3,z],[1,1,1],'Plant carpet');}}
  for(let i=0;i<12;i++){const x=(rng()-.5)*w*1.55,z=(rng()-.5)*d*1.55,y=sim.groundAt(x,z),moss=add(scene,new THREE.IcosahedronGeometry(1,1),material(0x477b45),[x,y+2,z],[3+rng()*3,2+rng()*2,3+rng()*3],'Moss stone');moss.rotation.y=rng()*6;}
 }
 if(h.theme==='rift'){
  // Tall side rock piles and caves echo a Lake Malawi mbuna rockscape while leaving the circuit readable.
  for(const sign of [-1,1])for(let i=0;i<8;i++){const x=sign*(w-18-rng()*27),z=-d+10+i*d*.23,s=7+rng()*8;add(scene,rockGeo,rockMat,[x,sim.groundAt(x,z)+s*.7,z],[s*1.3,s,s*.9],'Rift rock wall').rotation.y=rng()*4;}
  for(const x of [-76,0,76]){const z=d*.42,y=sim.groundAt(x,z);add(scene,new THREE.BoxGeometry(18,4,13),rockMat,[x,y+13,z],[1,1,1],'Cichlid cave roof');for(const sign of [-1,1])add(scene,rockGeo,rockMat,[x+sign*8,y+6,z],[5,8,6],'Cichlid cave pillar');}
 }
 if(h.theme==='jelly'){
  // Keep the water column unobstructed; the housing lights and fine suspended
  // particles reveal circulation without adding floating hoops or air stones.
  for(const y of [7,top-7]){const glow=material(p.accent,{emissive:p.accent,emissiveIntensity:1.1,transparent:true,opacity:.32,depthWrite:false});const ring=add(shell,new THREE.TorusGeometry(w-2,.55,6,64),glow,[0,y,0],[1,1,d/w],'Kreisel rim light');ring.rotation.x=Math.PI/2;ring.castShadow=false;ring.userData.currentRing=true;aquaticEffects.push(ring);}
  const coords=[];for(let i=0;i<136;i++){const a=rng()*Math.PI*2,r=w*(.12+Math.sqrt(rng())*.72);coords.push(Math.cos(a)*r,8+rng()*(h.waterLevel-16),Math.sin(a)*r*d/w);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));const flow=new THREE.Points(g,new THREE.PointsMaterial({color:0xd7ecff,size:.3,transparent:true,opacity:.4,depthWrite:false}));flow.name='Suspended current particles';flow.userData.currentParticles=true;scene.add(flow);aquaticEffects.push(flow);
 }
 if(h.waterfall){const f=h.waterfall;
  for(let i=0;i<6;i++)add(scene,rockGeo,rockMat,[f.x-3,6+i*12,f.z-8],[10-i*.6,10,7],'Waterfall rock wall');
  const sheet=slab(scene,[7,f.height,.4],material(0x96dadd,{transparent:true,opacity:.48,roughness:.2,side:THREE.DoubleSide}),[f.x,f.height/2+3,f.z],'Waterfall');waterfalls.push(sheet);

  const coords=[];for(let i=0;i<100;i++)coords.push(f.x+(rng()-.5)*7,rng()*f.height+3,f.z+(rng()-.5)*2);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));const drops=new THREE.Points(g,new THREE.PointsMaterial({color:0xddfff5,size:.6,transparent:true,opacity:.8}));drops.userData.fall=f;scene.add(drops);waterfalls.push(drops);
 }
 plants.forEach(({g})=>mergeStatic(g));mergeStatic(room);mergeStatic(shell);mergeStatic(scene);
 return {plants,waterfalls,aquaticEffects,shellMaterials,ground,shell,room,pools};
}
