import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertLocalAuthEnvironment, createCodeService, createLocalAuthServer} from '../src/server.ts';

test('six-digit codes expire, reject guesses and are consumed once', () => {
  let time = 1_000;
  const service = createCodeService(() => time, () => '123456');
  assert.equal(service.request(' A@Example.com ').previewCode, '123456');
  assert.throws(() => service.verify('a@example.com', '999999'), /invalid or expired/i);
  const verified = service.verify('a@example.com', '123456');
  assert.match(verified.uid, /^customer-/);
  assert.equal(verified.email, 'a@example.com');
  assert.equal(verified.customToken.split('.').length, 3);
  assert.throws(() => service.verify('a@example.com', '123456'), /invalid or expired/i);
  time += 30_001;
  service.request('a@example.com');
  time += 300_001;
  assert.throws(() => service.verify('a@example.com', '123456'), /invalid or expired/i);
});

test('code requests have resend and hourly limits', () => {
  let time = 1_000;
  const service = createCodeService(() => time, () => '654321');
  service.request('a@example.com');
  assert.throws(() => service.request('a@example.com'), /Wait 30 seconds/);
  for (let index = 0; index < 4; index++) {time += 30_001; service.request('a@example.com');}
  time += 30_001;
  assert.throws(() => service.request('a@example.com'), /Too many codes/);
});

test('successful verification does not reset request limits', () => {
  let time = 1_000;
  const service = createCodeService(() => time, () => '654321');
  for (let index = 0; index < 5; index++) {
    if (index) time += 30_001;
    service.request('a@example.com');
    service.verify('a@example.com', '654321');
  }
  time += 30_001;
  assert.throws(() => service.request('a@example.com'), /Too many codes/);
});

test('local auth refuses cloud credentials and non-demo projects', () => {
  assert.throws(() => assertLocalAuthEnvironment({LOCAL_AUTH_PROJECT_ID: 'real-project'}), /demo Firebase/);
  assert.throws(() => assertLocalAuthEnvironment({GOOGLE_APPLICATION_CREDENTIALS: 'key.json'}), /Cloud credentials/);
});

test('HTTP responses stay local and require a valid code', async () => {
  const server = createLocalAuthServer(createCodeService(() => 1_000, () => '123456'));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    const base = `http://127.0.0.1:${address.port}`;
    const request = await fetch(base + '/v1/email/request', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'shopper@example.com'})});
    assert.equal(request.status, 200);
    const preview = await request.json();
    assert.equal(preview.data.previewCode, '123456');
    const wrong = await fetch(base + '/v1/email/verify', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'shopper@example.com',code:'000000'})});
    assert.equal(wrong.status, 400);
    const verified = await fetch(base + '/v1/email/verify', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'shopper@example.com',code:'123456'})});
    assert.equal(verified.status, 200);
  } finally {server.close();}
});
