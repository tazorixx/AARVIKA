import {test,expect} from '@playwright/test';
import path from 'node:path';
const demoPhoto=path.resolve('assets/demo-art/mug.png');
test('focused search, local recents and gallery/camera previews without uploads',async({page})=>{
  const unexpected:string[]=[];page.on('pageerror',e=>unexpected.push(e.name));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning'&&message.text().includes('Require cycle'))unexpected.push(message.text());});
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();unexpected.push(u.hostname);return route.abort();});
  await page.goto('/search');
  const search=page.getByRole('textbox',{name:'Search catalogue',exact:true});await search.fill('mug');await search.press('Enter');
  await expect(page.getByRole('button',{name:'View Your-name ceramic mug',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();await expect(page.getByRole('button',{name:'mug',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('button',{name:'mug',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Open visual search',exact:true}).click();
  for(const button of ['Choose from gallery','Take a photo']){
    const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:button,exact:true}).click();await(await chooser).setFiles(demoPhoto);
    await expect(page.getByRole('img',{name:'Visual search photo preview',exact:true})).toBeVisible();
    await expect(page.getByText('Image matching is not configured. No matches have been generated. Try describing the gift in text search.',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Find similar products',exact:true}).click();await expect(page.getByText('Image matching is not configured. Your photo has not been uploaded. Use text search or browse a category.',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Remove image',exact:true}).click();await expect(page.getByRole('img',{name:'Visual search photo preview',exact:true})).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Close search with a photo',exact:true}).click();
  await search.fill('no-such-demo-design-936');await expect(page.getByText('No matching gifts',{exact:true})).toBeVisible();expect(unexpected).toEqual([]);
});

test('focused delivery address, current-location denial, map/Places pin and local persistence',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.name));
  await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>{fail?.({code:1,message:'Permission denied',PERMISSION_DENIED:1,POSITION_UNAVAILABLE:2,TIMEOUT:3} as GeolocationPositionError);};});
  await page.route('https://maps.googleapis.com/maps/api/js?**',route=>route.fulfill({contentType:'application/javascript',body:`
    class DemoMap{constructor(node){this.node=node;node.textContent='Demo map interaction fixture';}panTo(){}setZoom(){}addListener(name,fn){const f=()=>fn({latLng:{lat:()=>18.5204,lng:()=>73.8567}});this.node.addEventListener(name,f);return{remove:()=>this.node.removeEventListener(name,f)}}}
    class Marker{constructor(o){Object.assign(this,o)}addListener(){return{remove(){}}}}
    class Places extends HTMLElement{constructor(){super();const input=document.createElement('input');input.setAttribute('aria-label','Search Google Places');input.addEventListener('change',()=>{const event=new Event('gmp-select');event.placePrediction={toPlace:()=>({location:{lat:()=>18.5204,lng:()=>73.8567},formattedAddress:'12 Demo Road',addressComponents:[{types:['locality'],longText:'Pune'},{types:['administrative_area_level_1'],longText:'Maharashtra'},{types:['postal_code'],longText:'411001'}],fetchFields:async()=>{}})};this.dispatchEvent(event)});this.appendChild(input)}}
    customElements.define('demo-google-places',Places);window.google={maps:{importLibrary:async name=>name==='maps'?{Map:DemoMap}:name==='marker'?{AdvancedMarkerElement:Marker}:{PlaceAutocompleteElement:Places}}};window.aarvikaMapsReady();
  `}));
  await page.goto('/account');await page.getByRole('button',{name:'Continue with local demo profile'}).click();await page.getByRole('textbox',{name:'Demo profile name',exact:true}).fill('Focused location QA');await page.getByRole('button',{name:'Open demo profile',exact:true}).click();await expect(page.getByText('Hello, Focused location QA',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Change delivery location',exact:true}).click();await page.getByRole('button',{name:'Add delivery address',exact:true}).click();
  await page.getByRole('button',{name:'Use current location',exact:true}).click();await expect(page.getByText(/permission.*declined|denied/i).last()).toBeVisible();
  const maps=page.getByRole('button',{name:'Use Google Maps',exact:true});if(await maps.count()){
    await maps.click();const places=page.getByRole('textbox',{name:'Search Google Places',exact:true});await places.fill('Pune');await places.press('Tab');await expect(page.getByRole('textbox',{name:'City',exact:true})).toHaveValue('Pune');
    await page.getByTestId('delivery-map').click();await expect(page.getByText(/Pin selected · 18.5204, 73.8567/)).toBeVisible();
    await page.getByRole('button',{name:'Continue with manual entry',exact:true}).click();
  }
  await page.getByRole('button',{name:'Work',exact:true}).click();
  for(const [label,value] of Object.entries({'Recipient name':'Sample Shopper','Mobile number':'9876543210','Flat / house number':'12','Street address':'Demo Building, Sample Road','Landmark (optional)':'Sample park','Area / locality':'Demo locality','City':'Pune','State':'Maharashtra','PIN code':'411001'}))await page.getByRole('textbox',{name:label,exact:true}).fill(value);
  await page.getByRole('button',{name:'Confirm delivery address',exact:true}).click();await expect(page.getByRole('button',{name:'Selected delivery address',exact:true})).toBeVisible();
  await page.reload();await page.getByRole('tab',{name:'Home',exact:true}).click();await expect(page.getByRole('button',{name:'Change delivery location',exact:true})).toContainText('Work · Demo locality 411001');
  await page.getByRole('button',{name:'Change delivery location',exact:true}).click();await page.getByRole('button',{name:'Edit address 411001',exact:true}).click();await expect(page.getByRole('textbox',{name:'Flat / house number',exact:true})).toHaveValue('12');await page.getByRole('textbox',{name:'Area / locality',exact:true}).fill('Edited locality');await page.getByRole('button',{name:'Confirm delivery address',exact:true}).click();await page.getByRole('tab',{name:'Home',exact:true}).click();await expect(page.getByRole('button',{name:'Change delivery location',exact:true})).toContainText('Edited locality');
  expect(errors).toEqual([]);
});

test('Maps network failure retains compact manual address entry',async({page})=>{
  await page.route('https://maps.googleapis.com/**',route=>route.abort());await page.goto('/account');await page.getByRole('button',{name:'Continue with local demo profile'}).click();await page.getByRole('textbox',{name:'Demo profile name',exact:true}).fill('Map fallback QA');await page.getByRole('button',{name:'Open demo profile',exact:true}).click();await expect(page.getByText('Hello, Map fallback QA',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Add sample address',exact:true}).click();const maps=page.getByRole('button',{name:'Use Google Maps',exact:true});if(await maps.count()){await maps.click();await expect(page.getByText(/Google Maps could not load/)).toBeVisible();}await expect(page.getByRole('textbox',{name:'Street address',exact:true})).toBeVisible();
});
