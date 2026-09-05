import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=await walk('dist');
for(const f of [...files.filter(p=>p.endsWith('.js')), ...await walk('scripts')]){if(!/\.(m?js)$/.test(f))continue;const result=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
const html=await readFile('dist/index.html','utf8');for(const m of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)){await stat(resolve('dist',m[1].split('?')[0]));}
// Public source deliberately has no private hosting configuration.
for(const f of ['dist/manifest.webmanifest','package.json'])JSON.parse(await readFile(f,'utf8'));
const sw=await readFile('dist/sw.js','utf8');const assets=sw.match(/const ASSETS=(\[[\s\S]*?\]);/)[1];for(const m of assets.matchAll(/'\.\/([^']*)'/g))await stat(resolve('dist',m[1].split('?')[0]));
// Verify exact cache keys, including versions, across entrypoints and local module imports.
const origin='https://tankrush.invalid/',cached=new Set(JSON.parse(assets.replaceAll("'",'"')).map(p=>new URL(p,origin).href));
for(const m of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g))assert.ok(cached.has(new URL(m[1],origin).href),`Entrypoint missing from offline cache: ${m[1]}`);
for(const f of files.filter(p=>p.startsWith('dist/src/')&&p.endsWith('.js'))){const source=await readFile(f,'utf8');for(const m of source.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g))assert.ok(cached.has(new URL(m[1],new URL(f.slice(5),origin)).href),`Module missing from offline cache: ${f} -> ${m[1]}`);}
console.log(`Validated ${files.length} public assets, JavaScript syntax, entrypoint, manifest and offline cache.`);
