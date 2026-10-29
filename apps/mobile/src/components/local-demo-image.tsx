import {useContext, useEffect, useRef, useState, type ReactNode, type ComponentRef} from 'react';
import {PixelRatio, Platform, View, useWindowDimensions, type ImageStyle, type StyleProp} from 'react-native';
import {Image} from 'expo-image';
import {environment} from '../config/environment';
import {publicMedia} from '../config/public-media';
import {boundedImageKitUrl, type ImageUse} from '../domain/image-url';
import {isLocalMediaPath} from '../../../../packages/catalogue/src/media-policy';
import {MotionContext} from '../state/motion-context';
import {categoryArtworkData} from '../../../../packages/catalogue/src/category-media';
import {isOwnerHeroPath, ownerHeroEndpoint} from '../../../../packages/catalogue/src/hero-images';
import {categoryPhotoAssets} from '../config/category-photo-assets';
const watchers = new Set<()=>void>();
let lastScroll = 0;
export function notifyImageViewport() { const now = Date.now(); if(now-lastScroll<120)return; lastScroll=now; for(const check of watchers)check(); }
const prefetched = new Set<string>();
/** Bounded native prefetch; browsers use their lazy loader and HTTP cache. */
export function prefetchProductImages(paths: string[], width: number) {
  if(Platform.OS==='web')return;
  for(const path of paths.slice(0,2)) {
    const url=boundedImageKitUrl(path,publicMedia.imageKitEndpoint,width,PixelRatio.get(),'detail');
    if(!url)continue;
    if(prefetched.has(url))continue;
    if(prefetched.size>=48)prefetched.delete(prefetched.values().next().value!);
    prefetched.add(url);
    void Image.prefetch(url,'memory-disk').then(ok=>{if(!ok)prefetched.delete(url);}).catch(()=>prefetched.delete(url));
  }
}
/** Existing API, local demo paths or the configured public ImageKit account only. */
export function LocalDemoImage({path,label,style,fallback=null,fallbackPath,use='grid',priority=false,fit='contain'}:{path?:string;label:string;style:StyleProp<ImageStyle>;fallback?:ReactNode;fallbackPath?:string;use?:ImageUse;priority?:boolean;fit?:'contain'|'cover'}) {
  const reduced=useContext(MotionContext),{height}=useWindowDimensions(),ref=useRef<ComponentRef<typeof View>>(null);
  const [failure,setFailure]=useState<string>(),[width,setWidth]=useState(0),[near,setNear]=useState(false);
  const generated=categoryArtworkData(path),photo=path?categoryPhotoAssets[path]:undefined;
  const local=environment.dataMode==='admin-emulator'&&isLocalMediaPath(path);
  const uri=generated||(photo?`local:${path}`:path?(local?environment.apiBaseUrl+path:boundedImageKitUrl(path,publicMedia.imageKitEndpoint ?? (isOwnerHeroPath(path) ? ownerHeroEndpoint : undefined),width,PixelRatio.get(),use)):undefined);
  const fallbackUri=categoryArtworkData(fallbackPath);
  const allowed=!!uri;
  useEffect(()=>{
    if(!allowed||near)return;
    if(Platform.OS==='web') {
      const node=ref.current as unknown as HTMLElement;
      if(!node)return;
      if(typeof IntersectionObserver==='undefined'){queueMicrotask(()=>setNear(true));return;}
      const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'180px'});
      observer.observe(node);return()=>observer.disconnect();
    }
    const check=()=>ref.current?.measureInWindow((_x,y,_w,h)=>{if(h>0&&y+h>=-180&&y<height+180)setNear(true);});
    watchers.add(check);check();return()=>{watchers.delete(check);};
  },[allowed,near,height]);
  if(!allowed||failure===uri)return fallbackUri?<Image source={{uri:fallbackUri}} accessibilityLabel={label+' · category illustration'} style={style} contentFit="contain" cachePolicy="memory-disk"/>:fallback;
  const active=width>0&&near;
  return <View ref={ref} collapsable={false} onLayout={e=>{setWidth(old=>Math.abs(old-e.nativeEvent.layout.width)>1?e.nativeEvent.layout.width:old);notifyImageViewport();}} style={[style,{backgroundColor:'#F4F0F7',overflow:'hidden'}]}>
    {active&&<Image key={uri} source={photo||{uri,cacheKey:uri}} accessibilityLabel={label} style={{width:'100%',height:'100%'}} contentFit={fit} cachePolicy="memory-disk" recyclingKey={uri} priority={priority?'high':'low'} loading={priority?'eager':'lazy'} transition={reduced?0:{duration:140,skipOnCacheHit:'all'}} onError={()=>setFailure(uri)}/>}
  </View>;
}
