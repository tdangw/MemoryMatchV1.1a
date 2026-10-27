import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverGeometry, placeRegion, visibleMapTiles, boundedSpriteMotion } from '../../js/background/geometry.js';

test('center cover uses the real source aspect and rejects invalid measurements', () => {
  assert.deepEqual(coverGeometry(844, 390, 1536, 1024), { scale: 844 / 1536, x: 0, y: (390 - 1024 * 844 / 1536) / 2 });
  for (const width of [0, -1, NaN, Infinity]) assert.equal(coverGeometry(width, 390, 1536, 1024), null);
});

test('sprites remain fully inside their envelope throughout rotation and travel',()=>{
  for(const kind of ['fish','leaf','firefly'])for(const map of [false,true])for(const width of [9,12.3,17.2,32,120])for(const height of [9,12.3,18,40,90]){
    const m=boundedSpriteMotion(kind,{width,height},map);
    for(let step=0;step<=40;step++){
      const t=step/40,angle=m.rotation*t*Math.PI/180;
      const halfWidth=(m.width*Math.abs(Math.cos(angle))+m.height*Math.abs(Math.sin(angle)))/2;
      const halfHeight=(m.width*Math.abs(Math.sin(angle))+m.height*Math.abs(Math.cos(angle)))/2;
      const cx=m.left+m.width/2+m.endX*t,cy=m.top+m.height/2+m.endY*t;
      assert.ok(cx-halfWidth>=-1e-7&&cy-halfHeight>=-1e-7&&cx+halfWidth<=width+1e-7&&cy+halfHeight<=height+1e-7,`${kind} ${width}×${height} at ${t}`);
    }
  }
  assert.throws(()=>boundedSpriteMotion('leaf',{width:0,height:10}),RangeError);
});
test('map repetition handles negative origins and arbitrarily long chapters with three viewport slots', () => {
  assert.deepEqual(visibleMapTiles({scrollTop:0,positionY:200,tileHeight:660,viewportHeight:915}),[-1,0,1]);
  assert.equal(visibleMapTiles({scrollTop:1040000,positionY:312,tileHeight:660,viewportHeight:9000}).length,3);
  assert.deepEqual(visibleMapTiles({scrollTop:NaN,positionY:0,tileHeight:660,viewportHeight:915}),[]);
});
test('entire motion envelope must fit crop and avoid every interactive region', () => {
  const cover = coverGeometry(400, 800, 1000, 2000);
  const region = { x: 100, y: 500, width: 50, height: 100 };
  assert.deepEqual(placeRegion(region, cover, { width: 400, height: 800 }), { x: 40, y: 200, width: 20, height: 40 });
  assert.equal(placeRegion(region, cover, { width: 400, height: 800 }, [{ left: 59, right: 70, top: 210, bottom: 230 }]), null);
  assert.equal(placeRegion({ ...region, x: 990 }, cover, { width: 400, height: 800 }), null);
  assert.equal(placeRegion(region, null, { width: 400, height: 800 }), null);
});
