import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEnvironment } from '../src/config/environment.ts';
test('environment defaults and explicit configuration keep fixture mode without live services', () => { assert.equal(resolveEnvironment({}).dataMode, 'fixture'); assert.deepEqual(resolveEnvironment({ appEnv: 'development', dataMode: 'fixture', apiBaseUrl: 'http://localhost:3001' }), { appEnv: 'development', dataMode: 'fixture', apiBaseUrlConfigured: true, liveServicesEnabled: false }); });
test('nonfixture mode fails closed instead of contacting an API or Firebase', () => { assert.throws(() => resolveEnvironment({ dataMode: 'firebase' })); assert.throws(() => resolveEnvironment({ dataMode: 'api' })); assert.throws(() => resolveEnvironment({ appEnv: 'unknown' })); });
