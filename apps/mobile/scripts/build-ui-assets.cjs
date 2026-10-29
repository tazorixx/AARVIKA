/* global __dirname */
// Original code-drawn artwork. All product images remain labelled illustrative demos.
const { chromium }=require('@playwright/test');
const { mkdirSync,writeFileSync }=require('node:fs');
const path=require('node:path');
const icons={
 home:'<path d="M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9"/>',
 categories:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 offers:'<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7" cy="7" r="1"/>',
 heart:'<path d="M12 21 3.5 12.5C-2 6 6 0 12 6c6-6 14 0 8.5 6.5Z"/>',
 account:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
 cart:'<path d="M2 3h3l2.5 13h12L22 7H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
 search:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 6 6"/>',
 back:'<path d="m14 4-8 8 8 8M6 12h15"/>',right:'<path d="m9 5 7 7-7 7"/>',
 close:'<path d="m5 5 14 14M19 5 5 19"/>',filter:'<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="9" cy="18" r="2" fill="white"/>',
 gift:'<rect x="3" y="9" width="18" height="5" rx="1"/><path d="M5 14v8h14v-8M12 9v13M12 9C1 9 5-2 12 9c7-11 11 0 0 0Z"/>',
 check:'<path d="m4 12 5 5L21 5"/>',plus:'<path d="M12 4v16M4 12h16"/>',minus:'<path d="M4 12h16"/>',trash:'<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',edit:'<path d="m4 16 12-12 4 4L8 20l-5 1Z"/><path d="m13 7 4 4"/>',
 bag:'<rect x="4" y="7" width="16" height="15" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
 camera:'<path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/>',
 wedding:'<circle cx="9" cy="14" r="6"/><circle cx="16" cy="14" r="6"/><path d="m9 8-3-4 3-2 3 2-3 4"/>',
 birthday:'<path d="M3 13h18v9H3ZM5 13V9h14v4M8 9V6M12 9V4M16 9V6M3 17h18"/>',
 personalized:'<path d="M4 20 11 3h2l7 17M7 14h10M18 2v5M15.5 4.5h5"/>',
 clothing:'<path d="m8 3-6 5 4 5 2-2v11h8V11l2 2 4-5-6-5c0 4-8 4-8 0Z"/>',
 stationery:'<path d="M4 3h13v19H4ZM7 3v19M10 7h4M10 11h4M20 5v13l-1 3-1-3V5Z"/>',
 furniture:'<path d="M4 10V3h16v7M3 10h18v7H3ZM5 17v5M19 17v5M4 3v7M20 3v7"/>'
};
icons.anniversary=icons.heart;icons.hampers=icons.gift;
const art={
 box:'<rect x="27" y="62" width="106" height="68" rx="5" fill="#D7BDEB"/><rect x="21" y="49" width="118" height="22" rx="4" fill="#E9DDF7"/><path d="M70 49h20v81H70Z" fill="#62298E"/><path d="M80 50C26 53 38 10 62 27L80 50c54 3 42-40 18-23Z" fill="#FFC5AF" stroke="#62298E" stroke-width="2"/><path d="m30 117 17-8" stroke="#B18DCB" stroke-width="2"/>',
 mug:'<path d="M111 56h10c30 0 29 43-1 43h-9" fill="none" stroke="#B18DCB" stroke-width="10"/><path d="M37 47h78v59c0 30-78 30-78 0Z" fill="#E9DDF7" stroke="#B18DCB" stroke-width="2"/><ellipse cx="76" cy="47" rx="39" ry="10" fill="#FAF8FC" stroke="#B18DCB" stroke-width="2"/><path d="m77 69 5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z" fill="#62298E"/>',
 journal:'<rect x="38" y="24" width="89" height="115" rx="6" fill="#E6F5EF" stroke="#3E155C" stroke-width="2"/><path d="M49 24v115M111 24v115" stroke="#62298E" stroke-width="5"/><path d="M62 52h36M62 61h27" stroke="#8BAF9E" stroke-width="3"/><path d="m65 24 0-7h23v7" fill="none" stroke="#3E155C" stroke-width="2"/><path d="M117 124h10" stroke="#FFC5AF" stroke-width="5"/>',
 frame:'<rect x="25" y="21" width="111" height="118" rx="4" fill="#D6AE89"/><rect x="33" y="29" width="95" height="102" rx="2" fill="#FFF1D9"/><rect x="41" y="37" width="79" height="75" fill="#E9DDF7"/><circle cx="65" cy="60" r="10" fill="#FFC5AF"/><path d="m41 104 24-27 17 15 16-19 22 31" fill="#B18DCB"/><path d="M68 122h25" stroke="#B18DCB" stroke-width="2"/>',
 shirt:'<path d="m58 29-36 23 16 28 16-9v68h58V71l16 9 17-28-37-23c-10 15-37 15-50 0Z" fill="#D6C2E7" stroke="#62298E" stroke-width="2"/><path d="M64 28c4 22 33 22 39 0M81 49v20M96 66h12v17H96Z" fill="none" stroke="#B18DCB" stroke-width="2"/><path d="M66 130h34" stroke="#B18DCB" stroke-width="2"/>',
 chair:'<rect x="42" y="20" width="80" height="69" rx="14" fill="#D7BDEB" stroke="#62298E" stroke-width="2"/><path d="M38 90h89v18H38Z" fill="#62298E"/><path d="m47 108-9 35M118 108l9 35M54 108v22M111 108v22" stroke="#B88E67" stroke-width="7"/><path d="M52 38h60M52 48h60" stroke="#E9DDF7" stroke-width="2"/>',
 pen:'<path d="m38 133 8-30 72-72 17 17-72 72Z" fill="#62298E"/><path d="m46 103 17 17-25 13Z" fill="#D6AE89"/><path d="m109 40 16 16M52 98l17 17" stroke="#FFC5AF" stroke-width="4"/><path d="m119 31 8-8 17 17-9 8M131 32l10-2 8 8-21 22" fill="#E9DDF7" stroke="#62298E" stroke-width="2"/>',
 pouch:'<path d="M27 62q53-22 106 0l9 68H18Z" fill="#E6F5EF" stroke="#3E155C" stroke-width="2"/><path d="M28 62h105" stroke="#B88E67" stroke-width="5"/><path d="M42 56V35q38-18 76 0v21M35 75l-6 43" fill="none" stroke="#8BAF9E" stroke-width="3"/><circle cx="125" cy="68" r="5" fill="#FFC5AF"/>',
 jewellery:'<path d="M39 28c-18 120 100 120 82 0" fill="none" stroke="#C49A55" stroke-width="4"/><path d="m80 91 14 19-14 20-14-20Z" fill="#D7BDEB" stroke="#62298E" stroke-width="2"/><path d="m80 98 8 12-8 12-8-12Z" fill="#F7F0FF"/>',
 lamp:'<path d="m50 25-21 68h102l-21-68Z" fill="#FFF1D9" stroke="#C49A55" stroke-width="2"/><path d="M80 94v39M53 137h54" stroke="#C49A55" stroke-width="6"/><path d="M62 33 50 82M96 33l12 49" stroke="#E7D7BC" stroke-width="2"/>',
 tray:'<ellipse cx="81" cy="99" rx="61" ry="28" fill="#C49A55"/><ellipse cx="81" cy="93" rx="61" ry="25" fill="#FFF1D9" stroke="#C49A55" stroke-width="3"/><ellipse cx="81" cy="93" rx="46" ry="16" fill="#E9DDF7"/><path d="M27 88V72H16v18M133 88V72h11v18" fill="none" stroke="#C49A55" stroke-width="4"/>',
 card:'<path d="M33 27h72l25 25v85H33Z" fill="#FFF1D9" stroke="#D6AE89" stroke-width="2"/><path d="M105 27v25h25" fill="#FFC5AF"/><path d="M81 97 60 77c-11-12 4-24 21-8 17-16 32-4 21 8Z" fill="#D7BDEB"/><path d="M52 117h51" stroke="#D6AE89" stroke-width="2"/>'
};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const [folder,items,size,scale]of [['ui-icons',icons,24,3],['demo-art',art,160,2]]){
  const dir=path.resolve(__dirname,'../assets',folder);mkdirSync(dir,{recursive:true});const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:scale});
  for(const [name,body]of Object.entries(items)){
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${folder==='ui-icons'?'fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"':''}>${folder==='demo-art'?'<ellipse cx="80" cy="145" rx="55" ry="5" fill="#3E155C" opacity=".08"/>':''}${body}</svg>`;
   writeFileSync(path.join(dir,`${name}.svg`),svg);await page.setContent(`<html style="background:transparent"><body style="margin:0;background:transparent">${svg}</body></html>`);await page.screenshot({path:path.join(dir,`${name}.png`),omitBackground:true});
  }await page.close();
 }await browser.close();
})();
