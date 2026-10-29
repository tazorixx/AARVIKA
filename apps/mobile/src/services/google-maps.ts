import type {Coordinates,DeliveryDraft} from '../domain/delivery.ts';
import {validCoordinates} from '../domain/delivery.ts';
type LatLng = {lat():number;lng():number};
type Listener = {remove():void};
type MapEvent = {latLng?:LatLng};
type MapInstance = {panTo(point:{lat:number;lng:number}):void;setZoom(zoom:number):void;addListener(name:string,fn:(event:MapEvent)=>void):Listener};
type MarkerInstance = {position?:{lat:number;lng:number}|LatLng;map?:MapInstance|null;addListener(name:string,fn:(event:MapEvent)=>void):Listener};
type Component = {types:string[];longText?:string;shortText?:string;long_name?:string;short_name?:string};
type Place = {location?:LatLng;formattedAddress?:string;addressComponents?:Component[];fetchFields(input:{fields:string[]}):Promise<unknown>};
type GoogleApi = {importLibrary(name:string):Promise<unknown>};
let loading:Promise<GoogleApi>|undefined;
let authFailed=false;
function mapsApi(){return (window as unknown as {google?:{maps?:GoogleApi}}).google?.maps;}
export function loadGoogleMaps(key:string):Promise<GoogleApi> {
  if(authFailed)return Promise.reject(new Error('This Google Maps key/origin was rejected. Continue with manual entry.'));
  if(mapsApi())return Promise.resolve(mapsApi()!);
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.async=true;script.id='aarvika-google-maps';script.referrerPolicy='strict-origin-when-cross-origin';
    let timer:ReturnType<typeof setTimeout>;
    const host=window as unknown as {aarvikaMapsReady?:()=>void;gm_authFailure?:()=>void};
    const fail=()=>{clearTimeout(timer);script.remove();delete host.aarvikaMapsReady;loading=undefined;reject(new Error('Google Maps is unavailable or this key/origin is not authorized. Continue with manual entry.'));};
    host.gm_authFailure=()=>{authFailed=true;window.dispatchEvent(new Event('aarvika-maps-auth-error'));fail();};
    host.aarvikaMapsReady=()=>{clearTimeout(timer);delete host.aarvikaMapsReady;const api=mapsApi();if(api)resolve(api);else fail();};
    script.onerror=fail;
    script.src='https://maps.googleapis.com/maps/api/js?'+new URLSearchParams({key,v:'weekly',loading:'async',callback:'aarvikaMapsReady',auth_referrer_policy:'origin'});
    timer=setTimeout(fail,12000);document.head.appendChild(script);
  });
  return loading;
}
export function addressFromGoogle(components:Component[],formattedAddress=''):Partial<DeliveryDraft> {
  const text=(...types:string[])=>{const item=components.find(c=>types.some(type=>c.types.includes(type)));return item?.longText??item?.long_name??'';};
  const line=[text('street_number'),text('route')].filter(Boolean).join(' ')||formattedAddress;
  return {line,locality:text('sublocality_level_1','sublocality','neighborhood'),city:text('locality','postal_town','administrative_area_level_2'),state:text('administrative_area_level_1'),pincode:text('postal_code')};
}
/** Called only after an explicit user opt-in. Never loads Google on ordinary page startup. */
export async function mountGoogleSelector(input:{key:string;mapNode:HTMLElement;searchNode:HTMLElement;point?:Coordinates;onSelect:(patch:Partial<DeliveryDraft>)=>void;onStatus:(message:string)=>void}) {
  const api=await loadGoogleMaps(input.key);
  const {Map}=await api.importLibrary('maps') as {Map:new(node:HTMLElement,options:Record<string,unknown>)=>MapInstance};
  const {AdvancedMarkerElement}=await api.importLibrary('marker') as {AdvancedMarkerElement:new(options:Record<string,unknown>)=>MarkerInstance};
  const center=input.point?{lat:input.point.latitude,lng:input.point.longitude}:{lat:20.5937,lng:78.9629};
  const map=new Map(input.mapNode,{center,zoom:input.point?16:4,mapId:'DEMO_MAP_ID',disableDefaultUI:true,zoomControl:true,gestureHandling:'cooperative'});
  const marker=new AdvancedMarkerElement({map,position:input.point?center:undefined,gmpDraggable:true,title:'Drag to choose delivery location'});
  const listeners:Listener[]=[];
  function select(location?:LatLng){if(!location)return;const coordinates={latitude:location.lat(),longitude:location.lng()};if(!validCoordinates(coordinates))return;marker.position={lat:coordinates.latitude,lng:coordinates.longitude};input.onSelect({coordinates});input.onStatus('Pin selected. Confirm or enter the postal address below; delivery eligibility is not verified.');}
  listeners.push(map.addListener('click',event=>select(event.latLng)),marker.addListener('dragend',event=>select(event.latLng)));
  let autocomplete:HTMLElement|undefined;
  try {
    const {PlaceAutocompleteElement}=await api.importLibrary('places') as {PlaceAutocompleteElement:new(options:Record<string,unknown>)=>HTMLElement};
    autocomplete=new PlaceAutocompleteElement({includedRegionCodes:['in']});autocomplete.setAttribute('placeholder','Search city, area or address');autocomplete.setAttribute('aria-label','Search Google Places');
    autocomplete.addEventListener('gmp-select',event=>{void(async()=>{try{const selected=event as Event&{placePrediction:{toPlace():Place}};const place=selected.placePrediction.toPlace();await place.fetchFields({fields:['location','addressComponents','formattedAddress']});select(place.location);if(place.location){map.panTo({lat:place.location.lat(),lng:place.location.lng()});map.setZoom(16);}input.onSelect(addressFromGoogle(place.addressComponents??[],place.formattedAddress));}catch{input.onStatus('Places search is unavailable. Select a pin or enter your address manually.');}})();});
    autocomplete.addEventListener('gmp-error',()=>input.onStatus('Places API is unavailable or restricted. The map and manual entry remain available.'));
    input.searchNode.replaceChildren(autocomplete);
    input.onStatus('Google Maps enabled. Searches and selected map coordinates are shared with Google.');
  } catch {input.onStatus('Places search is unavailable. Use the map pin or enter your address manually.');}
  return {update(point:Coordinates){if(validCoordinates(point)){const position={lat:point.latitude,lng:point.longitude};marker.position=position;map.panTo(position);map.setZoom(16);}},dispose(){listeners.forEach(l=>l.remove());marker.map=null;autocomplete?.remove();input.mapNode.replaceChildren();}};
}
