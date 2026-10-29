import { validateLocalBaseUrl } from '../../../../packages/catalogue/src/api-contracts.ts';
import { validateAdminEmulatorBaseUrl } from '../../../../packages/catalogue/src/admin-emulator-adapter.ts';
import { validateSharedApiBaseUrl } from '../../../../packages/catalogue/src/shared-api-adapter.ts';
export function resolveEnvironment(input: { appEnv?: string; dataMode?: string; apiBaseUrl?: string }) {
  const appEnv=input.appEnv?.trim()||'development', dataMode=input.dataMode?.trim()||'fixture';
  if(!['development','test','staging','production'].includes(appEnv))throw new Error('Invalid EXPO_PUBLIC_APP_ENV.');
  if(!['fixture','local-api','admin-emulator','shared-api'].includes(dataMode))throw new Error('Invalid catalogue data mode.');
  if(['local-api','admin-emulator'].includes(dataMode)&&!['development','test'].includes(appEnv))throw new Error('Local API requires development or test environment.');
  const typedEnv=appEnv as 'development'|'test'|'staging'|'production';
  return {appEnv:typedEnv,dataMode:dataMode as 'fixture'|'local-api'|'admin-emulator'|'shared-api',apiBaseUrlConfigured:!!input.apiBaseUrl?.trim(),...(dataMode==='admin-emulator'?{apiBaseUrl:validateAdminEmulatorBaseUrl(input.apiBaseUrl?.trim()||'http://127.0.0.1:3100')}:dataMode==='local-api'?{apiBaseUrl:validateLocalBaseUrl(input.apiBaseUrl?.trim()||'http://127.0.0.1:3001')}:dataMode==='shared-api'?{apiBaseUrl:validateSharedApiBaseUrl(input.apiBaseUrl?.trim()||'',typedEnv)}:{}),liveServicesEnabled:dataMode==='shared-api'};
}
export const environment=resolveEnvironment({appEnv:process.env.EXPO_PUBLIC_APP_ENV,dataMode:process.env.EXPO_PUBLIC_DATA_MODE,apiBaseUrl:process.env.EXPO_PUBLIC_API_BASE_URL});
