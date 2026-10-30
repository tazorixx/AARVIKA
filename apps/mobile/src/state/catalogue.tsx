import { useEffect, useState, useRef, type ReactNode } from 'react';
import type { CatalogueSnapshot } from '../../../../packages/catalogue/src/api-contracts.ts';
import { environment, environmentStartupError } from '../config/environment';
import { createCatalogueAdapter } from '../services/adapters';
import { AppState, View } from 'react-native';
import { Page, State, Label, Button } from '../components/ui';
import { CatalogueContext } from './catalogue-context';
export { useCatalogue } from './catalogue-context';
let adapter: ReturnType<typeof createCatalogueAdapter> | undefined;
let startupError = environmentStartupError;
if (!startupError) {
  try { adapter = createCatalogueAdapter(environment); }
  catch (error) { startupError = error instanceof Error ? error.message : String(error); }
}
export function CatalogueProvider({children}:{children:ReactNode}) {
  const [data,setData]=useState<CatalogueSnapshot>(),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const [catalogueRevision,setCatalogueRevision]=useState(0),last=useRef('');
  useEffect(()=>{if (!adapter) return;
    const service=adapter;let active=true,busy=false;
    const refresh=async()=>{if(busy)return;busy=true;try{const next=await service.bootstrap();if(active){const encoded=JSON.stringify(next);if(encoded!==last.current){last.current=encoded;setData(next);setCatalogueRevision(r=>r+1);}setError('');}}catch(e){if(active)setError((e as Error).message);}finally{busy=false;}};
    void refresh();
    const interval=service.mode==='admin-emulator'||service.mode==='shared-api'?setInterval(()=>{void refresh();},service.mode==='shared-api'?30000:3000):undefined;
    const foreground=service.mode==='admin-emulator'||service.mode==='shared-api'?AppState.addEventListener('change',state=>{if(state==='active')void refresh();}):undefined;
    return()=>{active=false;if(interval)clearInterval(interval);foreground?.remove();};
  },[attempt]);
  if(!adapter || startupError)return <Page navigationEnabled={false}><State title="Deployment configuration needs attention" message={startupError || 'The catalogue adapter could not be started.'}/></Page>;
  if(!data)return <Page navigationEnabled={false}><State title={error?'Catalogue unavailable':'Welcome to AARVIKA'} message={error||`Loading your ${adapter.mode==='shared-api'?'published':'demo'} catalogue…`} loading={!error} retry={error?()=>{setError('');setAttempt(a=>a+1);}:undefined}/></Page>;
  return <CatalogueContext.Provider value={{...data,catalogService:adapter,catalogueRevision}}>{!!error&&<View style={{padding:8,backgroundColor:"#E9DDF7"}}><Label>Showing the last {adapter.mode==='shared-api'?'published':'demo'} snapshot. {error}</Label><Button title="Retry catalogue refresh" secondary onPress={()=>setAttempt(a=>a+1)}/></View>}{children}</CatalogueContext.Provider>;
}
