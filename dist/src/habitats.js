// Home-display habitats inspired by regions; this is a game roster, not a stocking guide.
const species=(name,latin,model,color,accent,scale=1,radius=1.8,behavior='swim')=>({name,latin,model,color,accent,scale,radius,behavior,speed:behavior==='jelly'?3:behavior==='walk'?6:8});
export const SPECIES={
 cardinal:species('Kardinaaltetra','Paracheirodon axelrodi','tetra',0x27d9ed,0xe83848,1.1,1.4),
 discus:species('Discus','Symphysodon sp.','discus',0xef9b4b,0x42d0c1,1.8,2.8),
 piranha:species('Roodbuikpiranha','Pygocentrus nattereri','piranha',0x748d83,0xde725a,1.15,2.1),
 rasbora:species('Kegelvlekbarbeel','Trigonostigma heteromorpha','rasbora',0xe1a16b,0x242935,1.25,1.5),
 gourami:species('Parelgoerami','Trichopodus leerii','gourami',0x8fc4b7,0xf4ddb4,1.65,2.3),
 shrimp:species('Vuurgarnaal','Neocaridina davidi','shrimp',0xe45842,0xf7a667,1.3,1.3),
 yellowlab:species('Gele labidochromis','Labidochromis caeruleus','cichlid',0xf4d640,0x24303c,1.6,2),
 zebra:species('Blauwe zebra','Maylandia zebra','cichlid',0x508fea,0x183553,1.7,2),
 peacock:species('Pauwcichlide','Aulonocara sp.','cichlid',0xe78048,0x376dde,1.65,2),
 clownfish:species('Driebandanemoonvis','Amphiprion ocellaris','clownfish',0xf48a24,0xfff9e0,1.45,1.8),
 tang:species('Blauwe doktersvis','Paracanthurus hepatus','tang',0x3674ed,0xf0d54f,1.65,2.3),
 cleaner:species('Poetsgarnaal','Lysmata amboinensis','shrimp',0xdd5549,0xffffdf,1.5,1.5),
 moonjelly:species('Oorkwal','Aurelia sp.','jellyfish',0xc1d8ff,0xefb8ff,1.8,2.9,'jelly'),
 beardie:species('Baardagaam','Pogona vitticeps','bearded',0xcb924f,0xeee0a0,1.25,2.4,'walk'),
 skink:species('Blauwtongskink','Tiliqua scincoides','skink',0xc2a078,0x54463b,1.25,2.3,'walk'),
 monitor:species('Goulds varaan','Varanus gouldii','monitor',0x9b915d,0xdcc787,1.05,2.9,'walk'),
 bandedgecko:species('Westelijke bandgekko','Coleonyx variegatus','gecko',0xe3c68e,0x78503b,1.4,1.9,'walk'),
 scorpion:species('Woestijnschorpioen','Hadrurus arizonensis','scorpion',0xc8a067,0x624d36,1.15,2.1,'walk'),
 tarantula:species('Arizona-blondvogelspin','Aphonopelma chalcodes','spider',0xc4a376,0x4c342a,1.1,2.6,'walk'),
 panther:species('Panterkameleon','Furcifer pardalis','chameleon',0x6ab647,0xe37357,1.15,2.2,'climb'),
 daygecko:species('Madagaskardaggekko','Phelsuma grandis','gecko',0x74c656,0xe65b48,1.6,2,'climb'),
 treefrog:species('Roodoogmakikikker','Agalychnis callidryas','frog',0x8ccc49,0xf27234,1.25,1.8,'hop'),
 dartfrog:species('Aardbeikikker','Oophaga pumilio','frog',0xe54235,0x244c9c,1,1.5,'hop'),
 viper:species('Wimpergroefkopadder','Bothriechis schlegelii','snake',0xe3c24e,0x817746,1.1,2,'walk'),
 crestedgecko:species('Wimpergekko','Correlophus ciliatus','crested',0xba8b63,0xf1d69c,1.5,2,'climb')
};
const palette=(ground,rock,leaf,water,light,accent,wood=0x65503b)=>({ground,rock,leaf,water,light,accent,wood});
export const HABITATS=[
 {id:'amazon',kind:'aquarium',name:'Amazonas · Blackwater',region:'Zuid-Amerika',shape:'rectangle',shapeLabel:'Panoramabak',size:'120 × 70 × 56 cm',halfWidth:112,halfDepth:64,height:104,trackX:86,trackZ:44,wobble:5,phase:.2,depth:45,swing:12,waterLevel:96,theme:'blackwater',course:'river',animalCount:22,plants:32,rocks:12,branches:12,seed:101,roster:['cardinal','discus','piranha'],description:'Amberkleurig water, wortelhout en een bed van bladeren.',palette:palette(0xa88a53,0x6a6954,0x638746,0x574c29,0xffe0a4,0xe7bd6c)},
 {id:'asia',kind:'aquarium',name:'Mekong · Emerald Cube',region:'Zuidoost-Azië',shape:'cube',shapeLabel:'Rimless kubus',size:'60 × 60 × 60 cm',halfWidth:82,halfDepth:82,height:164,trackX:58,trackZ:58,wobble:4,phase:1.2,depth:72,swing:16,waterLevel:155,theme:'planted',course:'hourglass',animalCount:24,plants:62,rocks:10,branches:5,seed:202,roster:['rasbora','gourami','shrimp'],description:'Dichte stengelplanten, mosstenen en helder groen water.',palette:palette(0x48493b,0x52625a,0x5fa64e,0x1b5142,0xe5ffcd,0x99dc79)},
 {id:'malawi',kind:'aquarium',name:'Malawi · Rift Valley',region:'Oost-Afrika',shape:'rectangle',shapeLabel:'Lange rotsbak',size:'150 × 75 × 55 cm',halfWidth:134,halfDepth:66,height:98,trackX:106,trackZ:45,wobble:5,phase:2.1,depth:42,swing:10,waterLevel:91,theme:'rift',course:'chicane',animalCount:22,plants:4,rocks:32,branches:0,seed:303,roster:['yellowlab','zebra','peacock'],description:'Wit zand, gestapelde rotsen en felgekleurde cichliden.',palette:palette(0xe0d5ad,0x939a98,0x688353,0x216b87,0xd4efff,0xf5d656)},
 {id:'reef',kind:'aquarium',name:'Coral Triangle · Blue Reef',region:'Indo-Pacific',shape:'bowfront',shapeLabel:'Gebogen voorruit',size:'110 × 80 × 64 cm',halfWidth:104,halfDepth:74,height:120,trackX:77,trackZ:46,wobble:6,phase:2.8,depth:52,swing:14,waterLevel:112,theme:'reef',course:'kidney',animalCount:24,plants:0,rocks:19,branches:0,seed:404,roster:['clownfish','tang','cleaner'],description:'Koraaleilanden, anemonen en blauwe rifverlichting.',palette:palette(0xe6e1c6,0x91859a,0xb67cad,0x163e78,0x92bdff,0x73cfff)},
 {id:'jelly',kind:'aquarium',name:'Monterey · Moon Orbit',region:'Noordoostelijke Stille Oceaan',shape:'cylinder',shapeLabel:'Ronde kwallencilinder',size:'Ø 65 × 56 cm',halfWidth:88,halfDepth:88,height:150,trackX:61,trackZ:61,wobble:0,phase:0,depth:65,swing:20,waterLevel:143,theme:'jelly',course:'orbit',animalCount:16,plants:0,rocks:0,branches:0,seed:505,roster:['moonjelly'],description:'Een gladde ronde bak, langzaam pulserende kwallen en circulerende stroming.',palette:palette(0x192944,0x41526c,0x678593,0x142c60,0x95bdff,0xc1b8ff)},
 {id:'outback',kind:'terrarium',name:'Australia · Red Centre',region:'Australië',shape:'rectangle',shapeLabel:'Breed woestijnterrarium',size:'120 × 72 × 50 cm',halfWidth:120,halfDepth:72,height:100,trackX:90,trackZ:48,wobble:6,phase:.4,theme:'outback',course:'mesa',animalCount:9,plants:8,rocks:25,branches:4,seed:606,roster:['beardie','skink','monitor'],description:'Rood zand, zonwarme steenplaten en droge takken.',palette:palette(0xbb7549,0x9d6241,0x94954e,0x775642,0xffcf83,0xf5b25d)},
 {id:'sonora',kind:'terrarium',name:'Sonora · Desert Afterglow',region:'Noord-Amerika',shape:'rectangle',shapeLabel:'Laag zandterrarium',size:'110 × 64 × 45 cm',halfWidth:106,halfDepth:62,height:86,trackX:78,trackZ:40,wobble:4,phase:2,theme:'desert',course:'cactus',animalCount:9,plants:7,rocks:17,branches:3,seed:707,roster:['bandedgecko','scorpion','tarantula'],description:'Lichte duinen, schuilholen, vetplanten en avondlicht.',palette:palette(0xd4b889,0xb29d78,0x779070,0x745d48,0xffd9aa,0xeac391)},
 {id:'madagascar',kind:'terrarium',name:'Madagascar · Canopy Cube',region:'Afrika · Madagaskar',shape:'cube',shapeLabel:'Hoog glazen kubusterrarium',size:'60 × 60 × 60 cm',halfWidth:80,halfDepth:80,height:160,trackX:55,trackZ:55,wobble:3,phase:1.6,theme:'canopy',course:'clover',animalCount:10,plants:44,rocks:8,branches:12,seed:808,roster:['panther','daygecko'],description:'Klimtakken, ficusbladeren en kameleons boven de racelijn.',palette:palette(0x5c4930,0x61714e,0x529451,0x264a35,0xe6f4b8,0xaadf64)},
 {id:'costarica',kind:'terrarium',name:'Costa Rica · Cloud Falls',region:'Midden-Amerika',shape:'paludarium',shapeLabel:'Hoog paludarium',size:'90 × 64 × 65 cm',halfWidth:108,halfDepth:76,height:156,trackX:78,trackZ:50,wobble:5,phase:3.4,theme:'waterfall',course:'cascade',animalCount:11,plants:49,rocks:19,branches:7,seed:909,roster:['treefrog','dartfrog','viper'],waterfall:{x:-49,z:-31,height:74,pool:13},description:'Een rotswaterval, een ondiepe beek en glanzende jungleplanten.',palette:palette(0x574b38,0x58746a,0x399363,0x377f81,0xc8ffe3,0x7ee4c6)},
 {id:'caledonia',kind:'terrarium',name:'New Caledonia · Fern Spire',region:'Oceanië',shape:'hexagon',shapeLabel:'Zeshoekig bosterrarium',size:'70 × 64 × 67 cm',halfWidth:90,halfDepth:82,height:172,trackX:54,trackZ:48,wobble:3,phase:4.1,theme:'ferns',course:'spiral',animalCount:9,plants:48,rocks:12,branches:14,seed:1010,roster:['crestedgecko'],description:'Een zeshoekige vitrinekast met kurkstammen, varens en wimpergekko’s.',palette:palette(0x70553b,0x687365,0x83ab52,0x3c4c3c,0xffedbd,0xcddd8b)}
];
export function getHabitat(key='aquarium'){if(typeof key==='object')return key;const id=key==='aquarium'?'amazon':key==='terrarium'?'outback':key;const h=HABITATS.find(h=>h.id===id);if(!h)throw new Error(`Unknown habitat: ${key}`);return h;}
export function tankOutline(key,detail=48){const h=getHabitat(key),w=h.halfWidth,d=h.halfDepth;
 if(h.shape==='cylinder'||h.shape==='hexagon'){const n=h.shape==='hexagon'?6:detail;return Array.from({length:n},(_,i)=>({x:Math.cos(i/n*Math.PI*2)*w,z:Math.sin(i/n*Math.PI*2)*d}));}
 if(h.shape==='bowfront')return [{x:-w,z:-d},{x:w,z:-d},...Array.from({length:25},(_,i)=>({x:Math.cos(i/24*Math.PI)*w,z:d*.72+Math.sin(i/24*Math.PI)*d*.28}))];
 return [{x:-w,z:-d},{x:w,z:-d},{x:w,z:d},{x:-w,z:d}];
}
const boundaryCache=new WeakMap();
export function constrainToTank(key,x,z,margin=3){const h=getHabitat(key);if(!boundaryCache.has(h))boundaryCache.set(h,new Map());const cache=boundaryCache.get(h);if(!cache.has(margin))cache.set(margin,tankOutline(h).map(p=>({x:p.x*(1-margin/h.halfWidth),z:p.z*(1-margin/h.halfDepth)})));const points=cache.get(margin);let outside=false,nearest={x,z},best=Infinity;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.z-a.z;if(dx*(z-a.z)-dz*(x-a.x)<-1e-7)outside=true;const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));const p={x:a.x+dx*t,z:a.z+dz*t},d=(x-p.x)**2+(z-p.z)**2;if(d<best){best=d;nearest=p;}}
 return outside?nearest:{x,z};
}
