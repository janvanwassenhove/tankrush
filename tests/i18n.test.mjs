import test from 'node:test';
import assert from 'node:assert/strict';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
Object.defineProperty(globalThis,'navigator',{value:{language:'en-US'},configurable:true});globalThis.document={documentElement:{lang:''},querySelectorAll:()=>[]};
const {t,setLanguage,localizedHabitat}=await import('../dist/src/i18n.js');
const habitat={id:'costarica',region:'x',shapeLabel:'y',description:'z'};
for(const language of ['en','fr','nl','de']){setLanguage(language);assert.equal(document.documentElement.lang,language);assert.notEqual(t('start'),'start');assert.notEqual(t('settings'),'settings');if(language!=='nl')assert.notEqual(localizedHabitat(habitat).description,'z');}
