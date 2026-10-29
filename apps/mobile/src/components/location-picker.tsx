import {useEffect,useRef,useState,type ComponentRef} from 'react';
import {Platform,View} from 'react-native';
import * as Location from 'expo-location';
import {publicMedia} from '../config/public-media';
import type {Coordinates,DeliveryDraft} from '../domain/delivery';
import {Button,Label,Notice} from './ui';
export function LocationPicker({point,onSelect}:{point?:Coordinates;onSelect:(patch:Partial<DeliveryDraft>)=>void}) {
  const [enabled,setEnabled]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
  const mapNode=useRef<ComponentRef<typeof View>>(null),searchNode=useRef<ComponentRef<typeof View>>(null),selection=useRef(onSelect),control=useRef<{update(point:Coordinates):void;dispose():void}>(null);
  useEffect(()=>{selection.current=onSelect;},[onSelect]);
  useEffect(()=>{if(Platform.OS!=='web')return;const fail=()=>{setEnabled(false);setStatus('Google Maps rejected this key or browser origin. Manual entry remains available.');};window.addEventListener('aarvika-maps-auth-error',fail);return()=>window.removeEventListener('aarvika-maps-auth-error',fail);},[]);
  useEffect(()=>{
    if(!enabled||Platform.OS!=='web'||!publicMedia.googleMapsKey)return;
    let active=true;
    import('../services/google-maps').then(module=>module.mountGoogleSelector({key:publicMedia.googleMapsKey!,mapNode:mapNode.current as unknown as HTMLElement,searchNode:searchNode.current as unknown as HTMLElement,point,onSelect:patch=>{if(active)selection.current(patch);},onStatus:message=>{if(active)setStatus(message);}})).then(value=>{if(active)control.current=value;else value.dispose();}).catch(()=>{if(active){setStatus('Google Maps could not load. Check connection, key restrictions and enabled APIs; manual entry remains available.');setEnabled(false);}});
    return()=>{active=false;control.current?.dispose();control.current=null;};
    // The map stays mounted while the pin moves. Subsequent coordinates update it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[enabled]);
  useEffect(()=>{if(point)control.current?.update(point);},[point]);
  async function current(){setBusy(true);try{const permission=await Location.requestForegroundPermissionsAsync();if(!permission.granted)throw Error('Location permission was declined. Search or enter your address manually.');const result=await Promise.race([Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}),new Promise<never>((_,reject)=>setTimeout(()=>reject(Error('Location timed out. Enter your address manually.')),12000))]);selection.current({coordinates:{latitude:result.coords.latitude,longitude:result.coords.longitude}});setStatus('Current position selected. Enter and confirm your full postal address below.');}catch(e){setStatus((e as Error).message||'Location unavailable. Enter your address manually.');}finally{setBusy(false);}}
  return <View style={{gap:8}}><Label heading>Choose your delivery location</Label><Label muted>Saved on this device only. No courier availability or delivery date is promised.</Label>{Platform.OS==='web'&&!enabled&&publicMedia.googleMapsKey&&<><Label muted>Optional: Google receives map requests and searches when enabled.</Label><Button title="Use Google Maps" secondary onPress={()=>{setStatus('Loading Google Maps…');setEnabled(true);}}/></>}{Platform.OS!=='web'&&<Label muted>Native Google Maps is not configured for this app. Use current location or manual address entry.</Label>}{Platform.OS==='web'&&!publicMedia.googleMapsKey&&<Label muted>Google Maps is not configured. Manual entry is available.</Label>}{enabled&&Platform.OS==='web'&&<><View ref={searchNode} testID="places-search"/><View ref={mapNode} testID="delivery-map" accessibilityLabel="Delivery map: select or drag the pin" style={{height:220,borderRadius:12,overflow:'hidden',backgroundColor:'#E9DDF7'}}/><Button title="Continue with manual entry" secondary onPress={()=>{setEnabled(false);setStatus('Enter your delivery address below.');}}/></>}<Button title={busy?'Finding location…':'Use current location'} secondary icon="home" disabled={busy} onPress={()=>{void current();}}/>{point&&<Label muted>Pin selected · {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}. Confirm the postal fields below.</Label>}{!!status&&<Notice>{status}</Notice>}</View>;
}
