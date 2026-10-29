import { assertIsolatedServer } from '../src/lib/isolated';
assertIsolatedServer();
const upstream = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('External HTTP requests are disabled in isolated tests.');
  return upstream(input, { ...init, redirect: 'error' });
};
