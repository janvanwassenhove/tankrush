// Original typographic app tile. Requires ImageMagick locally; output is committed.
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
mkdirSync('dist/icons',{recursive:true});
for(const size of [192,512]){const r=spawnSync('convert',['-size',`${size}x${size}`,'xc:#08262b','-fill','#c8f65f','-font','DejaVu-Sans-Bold','-gravity','center','-pointsize',String(size*.42),'-annotate','+0+0','TR',`dist/icons/icon-${size}.png`],{stdio:'inherit'});if(r.status!==0)throw new Error('Icon generation failed');}
