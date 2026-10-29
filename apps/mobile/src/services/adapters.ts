import {createAdminEmulatorAdapter} from '../../../../packages/catalogue/src/admin-emulator-adapter.ts';
import {createSharedApiAdapter} from '../../../../packages/catalogue/src/shared-api-adapter.ts';
import type { CatalogueAdapter } from '../../../../packages/catalogue/src/api-contracts.ts';
import { createFixtureAdapter } from '../../../../packages/catalogue/src/fixture-adapter.ts';
import { createLocalApiAdapter, createStagingAdapter } from '../../../../packages/catalogue/src/http-adapter.ts';
export function createCatalogueAdapter(config:{dataMode:'fixture'|'local-api'|'admin-emulator'|'shared-api'|'staging';apiBaseUrl?:string;appEnv?:'development'|'test'|'staging'|'production'}):CatalogueAdapter {
  if(config.dataMode==='admin-emulator')return createAdminEmulatorAdapter(config.apiBaseUrl);
  if(config.dataMode==='shared-api')return createSharedApiAdapter(config.apiBaseUrl??'',config.appEnv??'development');
  if(config.dataMode==='fixture')return createFixtureAdapter();
  if(config.dataMode==='local-api')return createLocalApiAdapter(config.apiBaseUrl??'http://127.0.0.1:3001');
  return createStagingAdapter();
}
