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
assert.equal(meta.width,source.sourceWidth);assert.equal(meta.height,source.sourceHeight);assert(meta.hasAlpha);
assert.equal(meta.width,meta.height,'Source cells must form a square grid');
assert.equal(source.sourceColumns,source.sourceRows);
assert.equal(source.glyphBounds.length,source.alphabet.length);
const output='public/assets/rewards/letters';await fs.mkdir(output,{recursive:true});
for(const size of source.cellSizes){
 const sprites=[];
 for(const [index,letter] of source.alphabet.entries()){
  const col=index%source.columns,row=Math.floor(index/source.columns);
  const [left,top,right,bottom]=source.glyphBounds[index];
  const sourceCol=index%source.sourceColumns,sourceRow=Math.floor(index/source.sourceColumns);
  assert(left>sourceCol*meta.width/source.sourceColumns&&right<(sourceCol+1)*meta.width/source.sourceColumns);
  assert(top>sourceRow*meta.height/source.sourceRows&&bottom<(sourceRow+1)*meta.height/source.sourceRows);
  const crop=await sharp(image).extract({left,top,width:right-left,height:bottom-top}).toBuffer();
  const trimmed=await sharp(crop).trim({threshold:12}).toBuffer();
  const inner=Math.round(size*.84);
  // Equal cap height across all letters; a narrow I must not be stretched.
  const sprite=await sharp(trimmed).resize({height:inner}).toBuffer({resolveWithObject:true});
  assert(sprite.info.width<=Math.floor(size*.96),'Glyph exceeds its sprite cell');
  sprites.push({input:sprite.data,left:col*size+Math.floor((size-sprite.info.width)/2),top:row*size+Math.floor((size-sprite.info.height)/2)});
  assert(letter.length===1);
 }
 const atlas=await sharp({create:{width:size*source.columns,height:size*source.rows,channels:4,background:'#00000000'}}).composite(sprites).webp({quality:90,alphaQuality:100}).toBuffer();
 assert(atlas.length<350000,'Letter atlas exceeds350KB budget');
 await fs.writeFile(`${output}/${source.assetPrefix}-${size}.webp`,atlas);
 console.log(`Letter atlas ${size}: ${atlas.length}B;17glyphs, alpha preserved.`);
}
