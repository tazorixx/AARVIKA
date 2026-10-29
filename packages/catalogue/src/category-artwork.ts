/** Small deterministic vector library. Editorial category art, never product photography. */
export type ArtworkCategory={id:string;name:string;departmentId:string;parentId?:string|null};
const motifs:Record<string,string>={
 hanger:'<path d="M48 30c0-24 30-24 30-5 0 9-18 12-18 25L12 85q-8 13 8 13h80q16 0 8-13L60 50"/>',
 briefcase:'<rect x="12" y="36" width="96" height="65" rx="8"/><path d="M42 36V19h36v17M12 59c25 20 71 20 96 0M51 62h18v18H51z"/>',
 gift:'<rect x="23" y="43" width="74" height="60" rx="6"/><path d="M18 33h84v22H18zM60 33v70"/><path d="M60 33C28 34 28 6 44 12c12 5 16 21 16 21s4-16 16-21c16-6 16 22-16 21Z"/>',
 hamper:'<path d="m18 48 12 54h60l12-54zM28 48c0-47 64-47 64 0M20 66h80M35 48l7 54m18-54v54m25-54-7 54"/><path d="M37 32h19v16H37zm30-8h16v24H67z"/>',
 cake:'<path d="M20 75h80v28H20zm8-24h64v24H28zM40 32v19m20-19v19m20-19v19"/><path d="M28 58c6 18 12-8 18 4s12 12 18 0 12 14 18 0 10 0 10 0M40 22l2-7m18 7 2-7m18 7 2-7"/>',
 heart:'<path d="M60 100 22 64C-3 37 30 2 60 33c30-31 63 4 38 31Z"/><path d="m47 52 8 8 20-22"/>',
 rings:'<circle cx="43" cy="67" r="29"/><circle cx="77" cy="67" r="29"/><path d="m46 28 14-18 14 18-14 15z"/>',
 flower:'<path d="M60 67v39M60 86c-26 1-32-15-32-15 24-6 32 15 32 15m0 8s10-23 31-15c0 0-6 16-31 15"/><circle cx="60" cy="41" r="12"/><path d="M51 30C28 9 11 40 37 45c-20 24 11 42 20 16 23 21 43-9 18-19 21-22-9-44-17-18"/>',
 lamp:'<path d="M20 71h80c-5 22-18 30-40 30S25 93 20 71Zm40 0c-27-24 2-39 0-62 27 32 15 44 0 62ZM11 105h98"/>',
 mug:'<path d="M22 35h61v57c0 19-61 19-61 0ZM83 43h10c25 0 25 36 0 36H83M37 22c-7-7 7-11 0-18m22 18c-7-7 7-11 0-18"/>',
 bottle:'<path d="M47 12h26v19l12 14v51q0 13-13 13H48q-13 0-13-13V45l12-14ZM47 25h26M35 61h50v24H35"/>',
 notebook:'<rect x="29" y="16" width="68" height="91" rx="7"/><path d="M41 16v91M53 39h30M53 53h23M22 29h14m-14 20h14m-14 20h14m-14 20h14"/>',
 pen:'<path d="m25 100 9-28 56-56 19 19-56 56-28 9Zm10-28 19 19m25-64 19 19M18 108h84"/>',
 calendar:'<rect x="17" y="28" width="86" height="77" rx="7"/><path d="M17 49h86M35 14v28m50-28v28M35 67h9m14 0h9m14 0h9M35 86h9m14 0h9m14 0h9"/>',
 palette:'<path d="M64 15C3 4-4 99 55 105c20 2-2-23 17-24 46 7 43-58-8-66Z"/><circle cx="35" cy="40" r="5"/><circle cx="58" cy="31" r="5"/><circle cx="82" cy="41" r="5"/><circle cx="28" cy="65" r="5"/><path d="m72 109 27-42"/>',
 frame:'<rect x="15" y="16" width="90" height="89" rx="5"/><rect x="25" y="26" width="70" height="69" rx="2"/><circle cx="43" cy="44" r="8"/><path d="m25 86 22-23 16 12 16-23 16 34"/>',
 shirt:'<path d="m42 18-30 18 14 27 15-9v53h38V54l15 9 14-27-30-18c-7 15-29 15-36 0ZM50 53h20M50 64h20"/>',
 dress:'<path d="M42 12h12v20h12V12h12l5 29-15 19 31 48H21l31-48-15-19ZM52 60h16M44 84h32"/>',
 trousers:'<path d="M30 15h60l9 94H69l-9-58-9 58H21ZM30 31h60M60 15v36M35 31v15m50-15v15"/>',
 shoe:'<path d="M17 62V34h25c0 30 23 23 38 37l24 7v26H17zM17 91h87M59 62l-9 12m23-6-9 12"/>',
 watch:'<rect x="35" y="30" width="50" height="60" rx="15"/><path d="M42 30V9h36v21M42 90v21h36V90M60 44v19l13 8"/>',
 bag:'<rect x="22" y="37" width="76" height="70" rx="8"/><path d="M40 46V29c0-27 40-27 40 0v17M40 71h40M47 85h26"/>',
 jewellery:'<path d="M20 22c0 69 80 69 80 0M42 92l18-22 18 22-18 19zM32 20v14m56-14v14"/>',
 sofa:'<path d="M27 57V31q0-12 13-12h40q13 0 13 12v26M60 19v47M14 61q0-10 13-10v23h66V51q13 0 13 10v38H14ZM25 99v12m70-12v12M27 74v14h66V74"/>',
 bed:'<path d="M15 107V25h90v82M15 75h90M15 96h90M22 49h76v26M27 35h26v14H27zm40 0h26v14H67z"/>',
 chair:'<path d="M36 60V15h48v45M24 60h72v21H24zM33 81v28m54-28v28M48 29h24M48 42h24"/>',
 cabinet:'<rect x="22" y="11" width="76" height="96" rx="5"/><path d="M60 11v96M49 53v16m22-16v16M29 107v6m62-6v6"/>',
 plant:'<path d="M33 75h54l-9 34H42zM60 75V28M60 54C26 57 22 30 22 30c29-9 38 24 38 24m0-14C87 40 99 14 99 14c-29-10-39 26-39 26"/>',
 people:'<circle cx="44" cy="34" r="17"/><path d="M11 106V81c0-35 66-35 66 0v25M79 18c28-1 30 38 3 39m6 11c21 1 23 20 23 38"/>',
 truck:'<path d="M12 25h60v64H12zM72 48h23l15 24v17H72M82 48v24h28"/><circle cx="31" cy="94" r="12"/><circle cx="91" cy="94" r="12"/>',
 tag:'<path d="M12 54V15h39l58 58-39 39Z"/><circle cx="35" cy="38" r="6"/><path d="m53 59 25 25m1-26L53 85"/>',
 spark:'<path d="m60 10 12 32 34 13-34 13-12 34-12-34-34-13 34-13ZM94 7v18m-9-9h18M22 87v20m-10-10h20"/>',
 book:'<path d="M60 31C37 12 12 20 12 20v79s25-8 48 11c23-19 48-11 48-11V20S83 12 60 31Zm0 0v79M25 39l20 4M25 59l20 4m30-20 20-4m-20 24 20-4"/>',
 comb:'<path d="M20 19h80v22H20zM25 41v58m12-58v58m12-58v58m12-58v58m12-58v58m12-58v58m12-58v58"/>',
 medical:'<rect x="14" y="29" width="92" height="77" rx="9"/><path d="M42 29V14h36v15M52 47h16v15h15v16H68v15H52V78H37V62h15z"/>',
 shelf:'<path d="M20 13v98m80-98v98M20 43h80M20 77h80M20 105h80M30 21h18v22H30zm32-7h20v29H62zM29 57h50v20H29zM52 88h33v17H52z"/>',
 cushion:'<path d="M19 19c33 8 49 8 82 0-8 33-8 49 0 82-33-8-49-8-82 0 8-33 8-49 0-82Z"/><path d="m45 45 30 30m0-30L45 75"/>',
 music:'<path d="M44 87V29l51-12v58M44 45l51-12"/><ellipse cx="29" cy="91" rx="15" ry="11"/><ellipse cx="80" cy="79" rx="15" ry="11"/>',
 sport:'<circle cx="60" cy="60" r="45"/><path d="M60 15v90M15 60h90M28 28c40 4 60 24 64 64M92 28C52 32 32 52 28 92"/>',
 tree:'<path d="M60 8 26 48h18L17 83h86L76 48h18ZM53 83v26h14V83"/>',
 travel:'<rect x="29" y="29" width="62" height="76" rx="9"/><path d="M46 29V12h28v17M43 46v42m17-42v42m17-42v42M40 105v8m40-8v8"/>',
 dining:'<path d="M24 10v35m-12-35v22c0 20 25 20 25 0V10M24 46v65M92 10c-34 12-34 59 0 59V10Zm0 59v42"/>',
 yoga:'<circle cx="60" cy="21" r="12"/><path d="m30 62 16-21h28l16 21M46 41l-4 33-28 25h92L78 74l-4-33M42 74l18 16 18-16"/>',
 winter:'<path d="M60 8v104M15 34l90 52M15 86l90-52M45 18l15 15 15-15M45 102l15-15 15 15M15 50l21-4-4-21m72 45-21 4 4 21M15 70l21 4-4 21m72-45-21-4 4-21"/>',
 moon:'<path d="M84 16c-59-17-87 66-34 89 23 10 50 0 60-24-45 5-65-31-26-65Z"/>',
 towel:'<path d="M15 21h90v78H15zM15 33h90M15 86h90M24 99v12m18-12v12m18-12v12m18-12v12m18-12v12"/>',
 fabric:'<path d="M24 20c20-15 52-15 72 0v80c-20 15-52 15-72 0ZM40 14v93M60 10v102M80 14v93M24 40h72M24 62h72M24 84h72"/>',
 stamp:'<path d="M44 15h32v33l13 18v16H31V66l13-18ZM20 82h80v20H20zM15 111h90"/>',
 toy:'<circle cx="35" cy="27" r="15"/><circle cx="85" cy="27" r="15"/><circle cx="60" cy="43" r="29"/><ellipse cx="60" cy="89" rx="29" ry="24"/><path d="M46 39h1m26 0h1m-22 15 9 6 9-6"/>',
 saree:'<path d="M35 13h50l-8 30 24 65H20l23-65ZM35 13l42 30M43 43l34 37M35 66l42 42M52 18l-8 19"/>',
 shorts:'<path d="M25 20h70l10 76H67l-7-43-7 43H15ZM25 35h70M60 20v33"/>',
 mirror:'<ellipse cx="60" cy="45" rx="32" ry="38"/><path d="M60 83v24M39 111h42M45 44l23-23M46 60l29-29"/>',
 kitchen:'<path d="M14 40h92v69H14ZM14 61h92M62 61v48M29 77h17M76 77h17M33 40V15h32v25M65 24h15"/>',
 pram:'<path d="M25 56h72c0 31-72 31-72 0ZM62 56V13c27 0 35 16 35 43M25 56 17 31H5M36 81l-8 22m56-22 8 22"/><circle cx="30" cy="107" r="7"/><circle cx="90" cy="107" r="7"/>',
 stack:'<path d="m60 12 48 24-48 24L12 36ZM12 60l48 24 48-24M12 84l48 24 48-24"/>',
 suit:'<path d="M41 14h38l26 19-14 76H29L15 33ZM41 14l19 41 19-41M60 55v54M41 14l-8 32 15 12-10 15m41-59 8 32-15 12 10 15"/>',
 stage:'<path d="M12 12h96v87H12ZM12 12l29 42-29 27m96-69L79 54l29 27M7 109h106M40 99V63h40v36"/>',
 desk:'<path d="M10 49h100v14H10ZM20 63v46m80-46v46M72 63v31h28M26 17h42v32H26zM38 37h18"/>',
 game:'<path d="M28 38h64c24 0 32 65 12 65L80 82H40l-24 21C-4 103 4 38 28 38ZM29 52v24M17 64h24"/><circle cx="88" cy="57" r="3"/><circle cx="99" cy="70" r="3"/>',
 wand:'<path d="m13 108 62-62M81 9l8 17 19 3-14 13 3 19-16-9-17 9 3-19-14-13 19-3M15 17v20m-10-10h20"/>',
 store:'<path d="M15 44h90v65H15ZM8 44l15-31h74l15 31ZM36 109V71h23v38M73 65h20v22H73zM34 13l-5 31m31-31v31m26-31 5 31"/>',
 hospitality:'<path d="M13 92h94M20 84c0-61 80-61 80 0ZM60 31V17M49 17h22M11 107h98"/>',
 wrapping:'<rect x="20" y="28" width="80" height="80" rx="5"/><path d="M60 28v80M20 65h80M60 28c-33-3-26-30-13-19Zm0 0c33-3 26-30 13-19Z"/>',
};
const rules:[RegExp,string][]=[[/hood|sweat|winter|thermal/,'winter'],[/sleep|night|lounge/,'moon'],[/saree|lehenga|ethnic|kurta|salwar/,'saree'],[/trouser|jeans|pant|bottom|legging/,'trousers'],[/shorts/,'shorts'],[/dress|women|gown|skirt/,'dress'],[/shirt|tee|top|polo|men\b/,'shirt'],[/blazer|suit|formal/,'suit'],[/fabric|textile|cotton|linen|silk|knit/,'fabric'],[/shoe|footwear|sneaker/,'shoe'],[/baby|nursery|infant/,'pram'],[/kids|child|toddler|toy/,'toy'],[/bed|mattress/,'bed'],[/sofa|living|couch|recliner/,'sofa'],[/dining|restaurant|café|cafe/,'dining'],[/kitchen/,'kitchen'],[/chair|seat|stool|bench/,'chair'],[/wardrobe|cabinet|storage|cupboard|drawer/,'cabinet'],[/shelf|rack|warehouse/,'shelf'],[/desk|study|office|corporate|employee|client|conference/,'desk'],[/outdoor|balcony|garden/,'plant'],[/salon|\bspa\b|grooming|beauty|hair/,'comb'],[/clinic|healthcare|medical/,'medical'],[/hotel|hospitality/,'hospitality'],[/retail|shop furniture/,'store'],[/event|venue|stage/,'stage'],[/space.saving|fold|modular/,'stack'],[/mirror|vanity/,'mirror'],[/jewell|necklace|bracelet|ring|earring/,'jewellery'],[/mug|cup|drinkware|coffee/,'mug'],[/bottle|tumbler|flask/,'bottle'],[/photo|album|frame|portrait/,'frame'],[/pen|pencil|writing|marker/,'pen'],[/notebook|diar|journal/,'notebook'],[/planner|calendar|milestone/,'calendar'],[/\bart\b|craft|paint|draw/,'palette'],[/school|education|learn/,'book'],[/wrap|packag|ribbon/,'wrapping'],[/stamp/,'stamp'],[/stationery/,'notebook'],[/cushion|pillow/,'cushion'],[/light|lamp|candle/,'lamp'],[/decor|flower|vase/,'flower'],[/accessor|bag|pouch|wallet/,'bag'],[/watch/,'watch'],[/travel/,'travel'],[/bath|towel/,'towel'],[/relax|self.care|wellness|yoga/,'yoga'],[/music/,'music'],[/sport|fitness|active/,'sport'],[/game|tech|gadget/,'game'],[/couple|romantic|valentine|anniversary|love/,'heart'],[/recipient|her\b|him\b|friend|parent|bride|family/,'people'],[/budget|deal|price|under|value|discount/,'tag'],[/delivery|express|same.day/,'truck'],[/trend|popular|bestsell/,'spark'],[/christmas/,'tree'],[/diwali|festival/,'lamp'],[/wedding|engagement|ceremony|tradition/,'rings'],[/birthday|celebration/,'cake'],[/custom|create|diy|personal/,'wand'],[/hamper|combo|set|kit/,'hamper']];
const base:Record<string,string>={wedding:'rings',birthday:'cake',anniversary:'heart',personalized:'frame',hampers:'hamper',clothing:'shirt',stationery:'notebook',furniture:'sofa'};
const familyMotifs:Record<string,string[]>={wedding:['lamp','shirt','jewellery','flower','gift','hamper'],birthday:['gift','people','tag','spark','frame','hamper','calendar','truck','spark','gift'],anniversary:['gift','people','calendar','frame','hamper','tag','spark','truck','spark','heart'],personalized:['mug','notebook','frame','bag','flower','shirt','bag','jewellery','hamper'],hampers:['cake','lamp','rings','heart','briefcase','notebook','yoga','flower','toy','hamper'],clothing:['shirt','dress','shirt','hanger','fabric','calendar','spark','tag'],stationery:['notebook','pen','book','briefcase','calendar','palette','palette','desk','wrapping','book','hamper'],furniture:['sofa','bed','dining','kitchen','desk','pram','cabinet','plant','stack','desk','store','dining','hospitality','comb','book','medical','shelf','stage']};
export function motifFor(name:string,department:string,parentName='',id='') {
 const family=id.match(/^[a-z]+-(\d+)$/);if(family)return familyMotifs[department]?.[Number(family[1])-1]??base[department]??'gift';
 const clean=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const value=clean(name);
 if(/\b(fashion|wearables)\b/.test(value))return 'shirt';
 if(/\b(space.saving|folding|modular)\b/.test(value))return 'stack';
 if(/\b(art|craft|paint|drawing)\b/.test(value))return 'palette';
 return rules.find(([r])=>r.test(value))?.[1]??rules.find(([r])=>r.test(clean(parentName)))?.[1]??base[department]??'gift';
}
export const artworkHash=(s:string)=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function categoryArtworkSvg(category:ArtworkCategory,parentName='',hero:false|'mobile'|'desktop'=false){
 const seed=artworkHash(category.id),family=artworkHash(category.parentId||category.departmentId),kind=motifFor(category.name,category.departmentId,parentName,category.id);
 if(!motifs[kind])throw Error('Unknown category motif: '+kind);
 const palettes=[['#EEE5F5','#D1B5E5','#62298E'],['#FDE9DF','#E8B99E','#844C39'],['#E4F1EB','#AAD0C0','#326C59'],['#FBF0D7','#E8C876','#806124'],['#E9EBF8','#B6BEDF','#515A90'],['#F9E3ED','#DFA9C2','#923D67']];
 const [bg,accent,ink]=palettes[(family+seed%3)%palettes.length],layout=family%4,w=hero==='desktop'?1536:hero==='mobile'?768:512,h=hero==='desktop'?512:hero==='mobile'?576:512;
 const lines:string[]=[];for(const word of category.name.split(/\s+/)){if(!lines.length||lines.at(-1)!.length+word.length>25)lines.push(word);else lines[lines.length-1]+=' '+word;}
 const label=lines.slice(0,4).map((line,i)=>`<text x="40" y="${394+i*25}" font-size="${lines.length>3?20:23}" font-weight="600" fill="${ink}">${xml(line)}</text>`).join('');
 const shapes=layout===0?`<path d="M0 215Q245 50 512 220V512H0Z" fill="${accent}" opacity=".38"/><circle cx="425" cy="66" r="99" fill="white" opacity=".55"/>`:layout===1?`<rect x="47" y="24" width="418" height="326" rx="165" fill="${accent}" opacity=".35"/><path d="M0 425 512 290v222H0Z" fill="white" opacity=".6"/>`:layout===2?`<circle cx="256" cy="180" r="167" fill="white" opacity=".68"/><path d="M0 386q256-110 512 0v126H0Z" fill="${accent}" opacity=".4"/>`:`<path d="M0 0h250l262 278v234H0Z" fill="${accent}" opacity=".25"/><rect x="70" y="36" width="372" height="300" rx="36" fill="white" opacity=".6"/>`;
 const icon=`<g transform="translate(150 75) scale(1.8)" fill="${accent}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${motifs[kind]}</g><g transform="translate(${seed%2?365:56} 274) scale(.45)" fill="none" stroke="${ink}" stroke-width="3">${motifs[base[category.departmentId]||'gift']}</g>`;
 const content=hero?`<rect width="${w}" height="${h}" fill="${bg}"/><circle cx="${w*.79}" cy="${h*.5}" r="${h*.66}" fill="${accent}" opacity=".48"/><g transform="translate(${w*.60} ${h*.19}) scale(${h/170})" fill="${accent}" stroke="${ink}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${motifs[kind]}</g><text x="${w*.06}" y="${h*.32}" font-size="${h*.03}" letter-spacing="5" fill="${ink}">AARVIKA · COLLECTION</text>${lines.map((line,i)=>`<text x="${w*.06}" y="${h*(.46+i*.09)}" font-size="${h*.072}" font-weight="600" fill="${ink}">${xml(line)}</text>`).join('')}`:`<rect width="512" height="512" fill="${bg}"/>${shapes}${icon}<path d="M40 358h38" stroke="${ink}" stroke-width="3"/>${label}<text x="40" y="490" font-size="11" letter-spacing="2" fill="${ink}" opacity=".7">AARVIKA · ${xml(category.departmentId.toUpperCase())}</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, sans-serif"><title>${xml(category.name)} — category illustration</title>${content}</svg>`;
}
