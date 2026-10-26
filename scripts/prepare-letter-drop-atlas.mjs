import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { LETTER_ALPHABET } from '../js/liveops/config.js';
const require=createRequire(import.meta.url);
const sharp=require(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const root='design/rewards-letters/drop';
const source=JSON.parse(await fs.readFile(`${root}/source.json`,'utf8'));
assert.deepEqual(source.alphabet,LETTER_ALPHABET);
const image=await fs.readFile(`${root}/${source.source}`);
const meta=await sharp(image).metadata();
assert.equal(meta.width,1254);assert.equal(meta.height,1254);assert(meta.hasAlpha);
const output='public/assets/rewards/letters';await fs.mkdir(output,{recursive:true});
for(const size of source.cellSizes){
 const sprites=[];
 for(const [index,letter] of source.alphabet.entries()){
  const col=index%source.columns,row=Math.floor(index/source.columns);
  const [left,top,right,bottom]=source.glyphBounds[index];
  const crop=await sharp(image).extract({left,top,width:right-left,height:bottom-top}).toBuffer();
  const trimmed=await sharp(crop).trim({threshold:12}).toBuffer();
  const inner=Math.round(size*.84);
  const sprite=await sharp(trimmed).resize(inner,inner,{fit:'inside'}).toBuffer({resolveWithObject:true});
  sprites.push({input:sprite.data,left:col*size+Math.floor((size-sprite.info.width)/2),top:row*size+Math.floor((size-sprite.info.height)/2)});
  assert(letter.length===1);
 }
 const atlas=await sharp({create:{width:size*source.columns,height:size*source.rows,channels:4,background:'#00000000'}}).composite(sprites).webp({quality:90,alphaQuality:100}).toBuffer();
 assert(atlas.length<350000,'Letter atlas exceeds350KB budget');
 await fs.writeFile(`${output}/letters-${size}.webp`,atlas);
 console.log(`Letter atlas ${size}: ${atlas.length}B;17glyphs, alpha preserved.`);
}
