import {useEffect,useRef,useState} from 'react';
import {Image,Platform,View} from 'react-native';
import {Button,Label,Notice,Sheet} from './ui';
import {pickSearchPhoto,visualSearchProvider,type VisualSearchPhoto} from '../services/visual-search';
export function VisualSearch({visible,onClose}:{visible:boolean;onClose:()=>void}) {
  const [photo,setPhoto]=useState<VisualSearchPhoto|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),generation=useRef(0),current=useRef<VisualSearchPhoto|null>(null);
  function release(value:VisualSearchPhoto|null){if(Platform.OS==='web'&&value?.uri.startsWith('blob:'))URL.revokeObjectURL(value.uri);}
  function clear(){generation.current++;release(current.current);current.current=null;setPhoto(null);setBusy(false);setMessage('');}
  useEffect(()=>()=>{generation.current++;release(current.current);},[]);
  async function pick(source:'camera'|'gallery') {const token=++generation.current;setBusy(true);setMessage('');try{const next=await pickSearchPhoto(source);if(token!==generation.current){release(next);return;}if(next){release(current.current);current.current=next;setPhoto(next);}}catch(e){if(token===generation.current)setMessage((e as Error).message);}finally{if(token===generation.current)setBusy(false);}}
  function close(){clear();onClose();}
  return <Sheet title="Search with a photo" visible={visible} onClose={close}><Label muted>Your photo stays on this device. No image upload or paid search service.</Label><View style={{flexDirection:'row',gap:8}}><Button title="Take a photo" icon="camera" onPress={()=>{void pick('camera');}}/><Button title={photo?'Replace image':'Choose from gallery'} secondary icon="gift" onPress={()=>{void pick('gallery');}}/></View>{busy&&<Label muted>Waiting for your image… You can close this sheet if the picker was cancelled.</Label>}{photo&&<><Image source={{uri:photo.uri}} accessibilityLabel="Visual search photo preview" resizeMode="contain" style={{width:'100%',height:180,borderRadius:10,backgroundColor:'#F4F0F7'}}/><Button title="Remove image" secondary icon="trash" onPress={clear}/><Notice>Image matching is not configured. No matches have been generated. Try describing the gift in text search.</Notice><Button title="Find similar products" secondary onPress={()=>{void visualSearchProvider.findSimilar(photo).catch(e=>setMessage(e.message));}}/></>}{!!message&&<Notice>{message}</Notice>}</Sheet>;
}
