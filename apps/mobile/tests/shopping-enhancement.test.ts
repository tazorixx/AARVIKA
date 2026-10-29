import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imagePixels,optimizedImageUrl,trustedImageKit,boundedImageKitUrl} from '../src/domain/image-url.ts';
import {isCatalogueMedia} from '../../../packages/catalogue/src/media-policy.ts';
import {normalizeRecent,rememberSearch} from '../src/domain/recent-searches.ts';
import {deliverySummary,validCoordinates} from '../src/domain/delivery.ts';
import {addressFromGoogle} from '../src/services/google-maps.ts';
const endpoint='https://ik.imagekit.io/demo-account';
test('ImageKit account boundary and scheme are strict; unrelated URLs are unchanged',()=>{
  const url=endpoint+'/gift.png';assert.equal(trustedImageKit(url,endpoint),true);
  for(const bad of ['https://ik.imagekit.io/demo-account-evil/gift.png','https://ik.imagekit.io.evil.test/demo-account/gift.png','http://ik.imagekit.io/demo-account/gift.png','https://secret@ik.imagekit.io/demo-account/gift.png','https://ik.imagekit.io/demo-account/%2fother.png'])assert.equal(trustedImageKit(bad,endpoint),false);
  const other='https://example.invalid/photo.png';assert.equal(optimizedImageUrl(other,endpoint,100,3,'grid'),other);
  assert.equal(isCatalogueMedia('//evil.test/p.png'),false);assert.equal(isCatalogueMedia('/../private.png'),false);assert.equal(isCatalogueMedia('/demo-art/box.png'),true);assert.equal(isCatalogueMedia(url),true);
});
test('responsive images cap originals, preserve item framing and stable cache URLs',()=>{
  assert.equal(imagePixels(150,3,'grid'),450);assert.equal(imagePixels(1000,4,'grid'),450);assert.equal(imagePixels(1000,4,'detail'),1000);assert.equal(imagePixels(1000,4,'zoom'),2000);assert.equal(imagePixels(60,2,'category'),150);
  const source=endpoint+'/gift.png?version=2',grid=optimizedImageUrl(source,endpoint,150,3,'grid');
  assert.match(grid,/w-450/);assert.match(grid,/c-at_max/);assert.match(grid,/f-auto/);assert.match(grid,/q-80/);assert.equal(new URL(grid).searchParams.get('version'),'2');
  assert.equal(grid,optimizedImageUrl(source,endpoint,150,3,'grid'));
  const signed=source+'&ik-s=signature';assert.equal(optimizedImageUrl(signed,endpoint,150,3,'grid'),signed);
  assert.equal(boundedImageKitUrl(signed,endpoint,150,3,'grid'),undefined);
  assert.equal(boundedImageKitUrl(signed,endpoint,150,3,'zoom'),signed);
  assert.match(grid,/h-450/);
});
test('recent searches are bounded, local strings and deduplicated',()=>{
  assert.deepEqual(rememberSearch(['Mug','Journal'],' mug '),['mug','Journal']);assert.equal(normalizeRecent(Array.from({length:20},(_,i)=>'Gift '+i)).length,8);assert.deepEqual(normalizeRecent({invalid:true}),[]);assert.deepEqual(normalizeRecent([null,12,'  ','A']),['A']);
});
test('delivery coordinates and Google postal components are explicit; no invented serviceability',()=>{
  assert.equal(validCoordinates({latitude:19,longitude:73}),true);assert.equal(validCoordinates({latitude:NaN,longitude:73}),false);assert.equal(validCoordinates({latitude:91,longitude:73}),false);
  assert.equal(deliverySummary(),'Choose delivery location');
  const fields=addressFromGoogle([{types:['street_number'],longText:'12'},{types:['route'],longText:'Demo Road'},{types:['locality'],longText:'Pune'},{types:['administrative_area_level_1'],longText:'Maharashtra'},{types:['postal_code'],longText:'411001'}]);
  assert.equal(fields.line,'12 Demo Road');assert.equal(fields.pincode,'411001');assert.equal(fields.city,'Pune');assert.equal(addressFromGoogle([]).pincode,'');
});
