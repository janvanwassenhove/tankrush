import * as THREE from '../vendor/three/three.module.js';
import {createAnimal} from './models.js?v=14';
export const CREATURE_MODELS=['tetra','discus','rasbora','gourami','cichlid','clownfish','tang','shrimp','jellyfish','bearded','skink','gecko','crested','frog','scorpion'];
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.6,...extra});
function part(g,name,geo,color,p=[0,0,0],s=[1,1,1],extra={}){const m=new THREE.Mesh(geo,mat(color,extra));m.name=name;m.position.set(...p);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const ball=(g,name,c,p,s,extra)=>part(g,name,new THREE.SphereGeometry(1,12,8),c,p,s,extra);
function group(g,name,p){const a=new THREE.Group();a.name=name;a.position.set(...p);g.add(a);return a;}
function rod(g,name,a,b,r,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=part(g,name,new THREE.CylinderGeometry(r,r,d.length(),6),c);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function eye(g,p,r=.12,color=0x141f25){ball(g,'eye',color,p,[r,r,r]);ball(g,'eye-glint',0xffffff,[p[0]+r*.3,p[1]+r*.3,p[2]+r*.7],[r*.24,r*.24,r*.24]);}
function fin(g,name,p,color,size=.6){const f=group(g,name,p);const m=part(f,'accent',new THREE.ConeGeometry(size,size,3),color,[0,0,-size*.2],[.12,1,1]);m.rotation.x=-Math.PI/2;return f;}
export function createCreature(type){
 if(!CREATURE_MODELS.includes(type))return createAnimal(type);
 const g=new THREE.Group();g.name=type;g.userData.kind=type;
 if(['tetra','discus','rasbora','gourami','cichlid','clownfish','tang'].includes(type)){
  const shapes={tetra:[.3,.4,1.2],discus:[.34,1.35,1.25],rasbora:[.32,.52,1.15],gourami:[.4,.95,1.65],cichlid:[.5,.7,1.45],clownfish:[.42,.62,1.2],tang:[.3,1.05,1.5]};
  const [x,y,z]=shapes[type];ball(g,'skin',0x65aab7,[0,0,0],[x,y,z]);
  fin(g,'tail',[0,0,-z*.96],0xe6ae5b,type==='discus'?.55:.7);fin(g,'fin1',[x,0,.1],0xe6ae5b,.36);fin(g,'fin-1',[-x,0,.1],0xe6ae5b,.36);
  part(g,'skin',new THREE.ConeGeometry(z*.55,y*.62,3),0x65aab7,[0,y*.85,-.25],[.07,1,1]);
  for(const sign of [-1,1]){
   eye(g,[sign*x*.8,y*.24,z*.7],.13);
   if(type==='clownfish'){for(const k of [-.65,0,.7])ball(g,'accent',0xfff1ce,[sign*x*.55,0,k*z],[x*.51,y*Math.sqrt(1-k*k)*1.01,.14]);}
   else if(type==='tetra'){ball(g,'accent',0xec4348,[sign*x*.72,-.2,-.1],[.12,.2,z*.8]);rod(g,'skin',[sign*x*.96,.06,-z*.7],[sign*x*.96,.06,z*.7],.055,0x3dd8ef);}
   else if(type==='rasbora'){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([sign*x*1.01,-.35,.1,sign*x*1.01,.3,.1,sign*x*.65,0,-z*.8],3));geo.computeVertexNormals();part(g,'accent',geo,0x29303b,[0,0,0],[1,1,1],{side:THREE.DoubleSide});}
   else if(type==='tang'){ball(g,'mark',0x15233c,[sign*x*.85,.05,-.15],[.12,y*.57,z*.65]);ball(g,'skin',0x457ae7,[sign*x*1.1,.15,.18],[.035,y*.35,z*.35]);}
   else for(let i=0;i<6;i++){const zz=-z*.65+i*z*.24,yy=y*Math.sqrt(Math.max(.1,1-(zz/z)**2));rod(g,'accent',[sign*x*.95,-yy*.8,zz],[sign*x*.95,yy*.8,zz+.1],type==='discus'?.035:.065,0x263f64);}
   if(type==='gourami'){rod(g,'accent',[sign*.2,-y*.6,.4],[sign*.45,-y*1.8,-.3],.025,0xf5dc9a);for(let i=0;i<10;i++)ball(g,'pearl',0xeaf0d1,[sign*x*.97,Math.sin(i*2.4)*y*.6,Math.cos(i*2.4)*z*.65],[.03,.035,.04]);}
  }
 }else if(type==='jellyfish'){
  const bell=group(g,'bell',[0,.5,0]);part(bell,'skin',new THREE.SphereGeometry(1.5,24,12,0,Math.PI*2,0,Math.PI*.52),0xc4d9ff,[0,0,0],[1,.6,1],{transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false,emissive:0x5269a4,emissiveIntensity:.35});
  const rim=part(bell,'accent',new THREE.TorusGeometry(1.49,.055,6,32),0xe4ceff);rim.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const a=i*Math.PI*.5,m=part(bell,'organ',new THREE.TorusGeometry(.3,.045,6,12),0xe5b6ef,[Math.cos(a)*.48,.08,Math.sin(a)*.48]);m.rotation.x=Math.PI/2;}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,t=group(g,'tentacle'+i,[Math.cos(a)*1.37,.4,Math.sin(a)*1.37]);const pts=Array.from({length:7},(_,j)=>new THREE.Vector3(Math.sin(j*.9+i)*.12,-j*.38,Math.cos(j*.8+i)*.09));part(t,'accent',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),8,.025,4,false),0xc5ccfa,[0,0,0],[1,1,1],{transparent:true,opacity:.65,depthWrite:false});}
  for(let i=0;i<4;i++){const t=group(g,'tentacle'+(16+i),[Math.sin(i*2)*.4,.3,Math.cos(i*2)*.4]);ball(t,'accent',0xebd8fc,[0,-.7,0],[.18,1,.16],{transparent:true,opacity:.55,depthWrite:false});}
 }else if(type==='shrimp'){
  for(let i=0;i<6;i++){const seg=group(g,'segment'+i,[0,Math.sin(i*.4)*.18,-i*.35]);ball(seg,'skin',0xe1694e,[0,0,0],[.3-i*.02,.35-i*.035,.28]);}
  ball(g,'skin',0xe1694e,[0,.06,.38],[.32,.37,.65]);for(const sign of [-1,1]){rod(g,'accent',[sign*.15,.3,.55],[sign*.75,1.2,2.9],.025,0xffe8b7);eye(g,[sign*.23,.35,.65],.07);for(let i=0;i<4;i++){const leg=group(g,'leg'+(i*2+(sign>0?1:0)),[sign*.2,-.1,.3-i*.35]);rod(leg,'accent',[0,0,0],[sign*.55,-.45,.2],.035,0xf4b586);}fin(g,'fin'+sign,[sign*.12,0,-1.9],0xe1694e,.4);}
 }else if(['bearded','skink','gecko','crested'].includes(type)){
  const heavy=type==='bearded'||type==='skink',body=0xb99b66;
  ball(g,'skin',body,[0,.2,0],[heavy?.72:.46,heavy?.45:.31,heavy?1.3:1.1]);ball(g,'skin',body,[0,.3,1.25],[type==='bearded'?.68:.43,.32,.6]);
  for(let i=0;i<8;i++){const seg=group(g,'segment'+i,[0,.08,-1.15-i*.33]);ball(seg,'skin',body,[0,0,0],[.34*(1-i/9),.23*(1-i/9),.29]);}
  for(const sign of [-1,1]){eye(g,[sign*.39,.5,1.42],heavy?.1:.2);for(let i=0;i<2;i++){const leg=group(g,'leg'+(i*2+(sign>0?1:0)),[sign*.4,.1,i===0?.7:-.7]);rod(leg,'skin',[0,0,0],[sign*.45,-.12,-.2],.13,body);rod(leg,'skin',[sign*.45,-.12,-.2],[sign*.7,-.43,.2],.085,body);for(let j=0;j<4;j++){const toe=[sign*(.7+j*.05),-.46,.15+j*.13];rod(leg,'accent',[sign*.7,-.43,.2],toe,.025,0xe5d3a5);if(!heavy)ball(leg,'toe-pad',0xd3c695,toe,[.075,.03,.07]);}}
   if(type==='bearded'||type==='crested')for(let i=0;i<9;i++)part(g,'accent',new THREE.ConeGeometry(.08,type==='bearded'?.24:.13,4),0xe4d199,[sign*(type==='bearded'?.62:.37),.36,1.6-i*.27]);
  }
  for(let i=0;i<9;i++)ball(g,'accent',0x715338,[Math.sin(i*2.4)*.4,.49,-.7+(i%5)*.4],[.13,.03,.13]);
  if(type==='skink')part(g,'blue-tongue',new THREE.BoxGeometry(.18,.035,.45),0x5d8fe8,[0,.2,1.96]);
 }else if(type==='frog'){
  ball(g,'skin',0x6ebd4c,[0,.35,0],[.65,.43,.78]);ball(g,'skin',0x6ebd4c,[0,.45,.6],[.64,.36,.48]);ball(g,'belly',0xe5e3ad,[0,.1,.1],[.52,.23,.62]);
  for(const sign of [-1,1]){ball(g,'eye-lid',0x87c453,[sign*.45,.76,.74],[.24,.26,.24]);eye(g,[sign*.47,.8,.89],.19,0xd83e2c);for(let i=0;i<2;i++){const leg=group(g,'leg'+(i*2+(sign>0?1:0)),[sign*.4,.2,i===0?.4:-.5]);ball(leg,'skin',0x6ebd4c,[sign*.27,.02,-.12],[.33,.24,.45]);rod(leg,'accent',[sign*.5,0,-.3],[sign*.7,-.4,.5],.07,0xeaa355);for(let j=0;j<3;j++){const toe=[sign*(.7+j*.1),-.4,.6+j*.1];rod(leg,'accent',[sign*.7,-.4,.5],toe,.035,0xeaa355);ball(leg,'accent',0xeaa355,toe,[.075,.045,.075]);}}}
 }else if(type==='scorpion'){
  ball(g,'skin',0xc5a46b,[0,.3,-.1],[.65,.35,1]);for(let i=0;i<7;i++){const a=i*.3,seg=group(g,'segment'+i,[0,.3+Math.sin(a)*1.8,-.9-Math.sin(a*.9)*1.2]);ball(seg,'skin',0xc5a46b,[0,0,0],[.22,.23,.26]);}part(g,'sting',new THREE.ConeGeometry(.12,.55,6),0x503e34,[0,2.2,-1.9]).rotation.x=1.2;
  for(const sign of [-1,1]){for(let i=0;i<4;i++){const leg=group(g,'leg'+(i*2+(sign>0?1:0)),[sign*.4,.2,.6-i*.4]);rod(leg,'skin',[0,0,0],[sign*1.3,-.1,-.3],.065,0xc5a46b);rod(leg,'skin',[sign*1.3,-.1,-.3],[sign*1.5,-.35,.05],.04,0xc5a46b);}rod(g,'skin',[sign*.4,.3,.7],[sign*1,.3,1.55],.12,0xc5a46b);const claw=group(g,'fin'+sign,[sign*1,.3,1.55]);ball(claw,'skin',0xc5a46b,[0,0,0],[.35,.22,.48]);for(const j of [-1,1])rod(claw,'accent',[j*.17,0,.2],[j*.08,0,.76],.065,0x685542);eye(g,[sign*.12,.58,.65],.06);}
 }
 return g;
}
export function colorSpecies(root,profile){
 root.scale.multiplyScalar(profile.scale);root.userData.species=profile.name;
 root.traverse(o=>{if(!o.isMesh)return;if(/^(skin|body|head|abdomen|scale|tail-scale)$/.test(o.name))o.material.color.setHex(profile.color);else if(/^(accent|belly|dapple|mark|tail-fan|tail-band|pectoral)$/.test(o.name))o.material.color.setHex(profile.accent);});return root;
}
