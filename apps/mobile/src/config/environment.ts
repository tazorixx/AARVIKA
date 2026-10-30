import { validateLocalBaseUrl } from '../../../../packages/catalogue/src/api-contracts.ts';
import { validateAdminEmulatorBaseUrl } from '../../../../packages/catalogue/src/admin-emulator-adapter.ts';
import { validateSharedApiBaseUrl } from '../../../../packages/catalogue/src/shared-api-adapter.ts';
export function resolveEnvironment(input: { appEnv?: string; dataMode?: string; apiBaseUrl?: string; browserOrigin?:string }) {
  const appEnv=input.appEnv?.trim()||'development', dataMode=input.dataMode?.trim()||'fixture';
  if(!['development','test','staging','production'].includes(appEnv))throw new Error('Invalid EXPO_PUBLIC_APP_ENV.');
  if(!['fixture','local-api','admin-emulator','shared-api'].includes(dataMode))throw new Error('Invalid catalogue data mode.');
  if(['staging','production'].includes(appEnv)&&dataMode!=='shared-api')throw new Error('Published applications must use the real shared catalogue.');
  if(input.apiBaseUrl==='same-origin')input={...input,apiBaseUrl:input.browserOrigin};
  if(['local-api','admin-emulator'].includes(dataMode)&&!['development','test'].includes(appEnv))throw new Error('Local API requires development or test environment.');
  const typedEnv=appEnv as 'development'|'test'|'staging'|'production';
  return {appEnv:typedEnv,dataMode:dataMode as 'fixture'|'local-api'|'admin-emulator'|'shared-api',apiBaseUrlConfigured:!!input.apiBaseUrl?.trim(),...(dataMode==='admin-emulator'?{apiBaseUrl:validateAdminEmulatorBaseUrl(input.apiBaseUrl?.trim()||'http://127.0.0.1:3100')}:dataMode==='local-api'?{apiBaseUrl:validateLocalBaseUrl(input.apiBaseUrl?.trim()||'http://127.0.0.1:3001')}:dataMode==='shared-api'?{apiBaseUrl:validateSharedApiBaseUrl(input.apiBaseUrl?.trim()||'',typedEnv)}:{}),liveServicesEnabled:dataMode==='shared-api'};
}
// Preserve strict environment validation, but never throw while importing the app.
// An invalid production configuration must display an actionable error, not silently
// load demo content or leave Firebase Hosting showing a white screen.
const inputEnvironment = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  browserOrigin: typeof window !== 'undefined' ? window.location?.origin : undefined,
};
let startupProblem: string | null = null;
let resolved: ReturnType<typeof resolveEnvironment>;
try {
  resolved = resolveEnvironment(inputEnvironment);
} catch (error) {
  startupProblem = error instanceof Error ? error.message : String(error);
  // This config only allows an error screen to mount. CatalogueProvider refuses
  // to bootstrap whenever startupProblem is set; it does NOT serve fixtures.
  resolved = resolveEnvironment({appEnv: 'development', dataMode: 'fixture'});
}
export const environment = resolved;
export const environmentStartupError = startupProblem;

