import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.glb':'model/gltf-binary','.gltf':'model/gltf+json'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let p=resolve(root,'.'+decodeURIComponent(url.pathname));if(p!==root&&!p.startsWith(root+'/')){res.writeHead(403).end();return;}if((await stat(p)).isDirectory())p=resolve(p,'index.html');res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(p));}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('TankRush ready on http://localhost:'+Number(process.env.PORT||4173)));
