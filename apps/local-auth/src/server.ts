import {createServer, type Server} from 'node:http';
import {createHash, createHmac, randomBytes, randomInt, timingSafeEqual} from 'node:crypto';

export const LOCAL_PROJECT_ID = 'demo-aarvika-local';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIFE_MS = 5 * 60_000;
const RESEND_MS = 30_000;
const WINDOW_MS = 60 * 60_000;

interface Challenge {digest: Buffer; expiresAt: number; attempts: number}
interface SendHistory {lastSentAt: number; windowStart: number; sentInWindow: number}

export function createCodeService(now: () => number = Date.now, generate: () => string = () => String(randomInt(0, 1_000_000)).padStart(6, '0')) {
  const secret = randomBytes(32);
  const challenges = new Map<string, Challenge>();
  const sendHistory = new Map<string, SendHistory>();
  const normalize = (email: string) => email.trim().toLowerCase();
  const digest = (email: string, code: string) => createHmac('sha256', secret).update(email + ':' + code).digest();
  function request(rawEmail: string) {
    const email = normalize(rawEmail);
    if (!EMAIL.test(email) || email.length > 254) throw new Error('Enter a valid email address.');
    const current = sendHistory.get(email), time = now();
    if (current && time - current.lastSentAt < RESEND_MS) throw new Error('Wait 30 seconds before requesting another code.');
    const withinWindow = current && time - current.windowStart < WINDOW_MS;
    const sentInWindow = withinWindow ? current.sentInWindow + 1 : 1;
    if (sentInWindow > 5) throw new Error('Too many codes requested. Try again later.');
    const code = generate();
    if (!/^\d{6}$/.test(code)) throw new Error('Invalid local code generator.');
    sendHistory.set(email, {lastSentAt: time, windowStart: withinWindow ? current.windowStart : time, sentInWindow});
    challenges.set(email, {digest: digest(email, code), expiresAt: time + LIFE_MS, attempts: 0});
    return {email, previewCode: code, expiresInSeconds: LIFE_MS / 1000};
  }
  function verify(rawEmail: string, code: string) {
    const email = normalize(rawEmail), challenge = challenges.get(email);
    if (!challenge || now() > challenge.expiresAt || challenge.attempts >= 5 || !/^\d{6}$/.test(code)) throw new Error('Code invalid or expired. Request a new code.');
    challenge.attempts += 1;
    if (!timingSafeEqual(challenge.digest, digest(email, code))) throw new Error('Code invalid or expired. Request a new code.');
    challenges.delete(email);
    const uid = 'customer-' + createHash('sha256').update(email).digest('hex').slice(0, 28);
    return {uid, email, customToken: makeEmulatorCustomToken(uid, now())};
  }
  return {request, verify};
}

function makeEmulatorCustomToken(uid: string, time: number) {
  const issued = Math.floor(time / 1000);
  const header = Buffer.from(JSON.stringify({alg: 'none', typ: 'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({iss: 'local-auth@demo-aarvika-local.iam.gserviceaccount.com', sub: 'local-auth@demo-aarvika-local.iam.gserviceaccount.com', aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iat: issued, exp: issued + 3600, uid})).toString('base64url');
  return `${header}.${payload}.`;
}

export function assertLocalAuthEnvironment(env: NodeJS.ProcessEnv) {
  if (env.LOCAL_AUTH_HOST && env.LOCAL_AUTH_HOST !== '127.0.0.1') throw new Error('Local auth binds only to loopback.');
  if (env.LOCAL_AUTH_PROJECT_ID && env.LOCAL_AUTH_PROJECT_ID !== LOCAL_PROJECT_ID) throw new Error('Use only the demo Firebase project.');
  if (Object.keys(env).some(key => /^(GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_TOKEN|GOOGLE_CLOUD_PROJECT|GCLOUD_PROJECT)$/.test(key) && env[key])) throw new Error('Cloud credentials are not allowed in local auth.');
}

export function createLocalAuthServer(service = createCodeService()): Server {
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, body: unknown) => {res.writeHead(status); res.end(JSON.stringify(body));};
    const host = req.headers.host ?? '';
    if (!/^(127\.0\.0\.1|localhost|10\.0\.2\.2):\d+$/.test(host)) return send(403, {error: 'Local emulator host required.'});
    const origin = req.headers.origin;
    if (origin) {
      let allowed = false;
      try {const parsed = new URL(origin); allowed = parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname) && !!parsed.port;} catch {}
      if (!allowed) return send(403, {error: 'Local origin required.'});
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.writeHead(204); return res.end();}
    if (req.url === '/health' && req.method === 'GET') return send(200, {mode: 'firebase-auth-emulator', projectId: LOCAL_PROJECT_ID});
    if (!['/v1/email/request', '/v1/email/verify'].includes(req.url ?? '') || req.method !== 'POST') return send(404, {error: 'Local auth route not found.'});
    let body = '';
    try {
      for await (const chunk of req) {body += chunk.toString(); if (body.length > 4096) throw new Error('Request too large.');}
      const input = JSON.parse(body) as Record<string, unknown>;
      if (typeof input.email !== 'string') throw new Error('Enter an email address.');
      if (req.url === '/v1/email/request') return send(200, {data: service.request(input.email)});
      if (typeof input.code !== 'string') throw new Error('Enter your six-digit code.');
      return send(200, {data: service.verify(input.email, input.code)});
    } catch (error) {return send(400, {error: (error as Error).message});}
  });
}

export async function startLocalAuthServer(port = 3002, env: NodeJS.ProcessEnv = process.env) {
  assertLocalAuthEnvironment(env);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local auth port.');
  const server = createLocalAuthServer();
  server.requestTimeout = 10_000;
  server.headersTimeout = 5_000;
  await new Promise<void>((resolve, reject) => {server.once('error', reject); server.listen(port, '127.0.0.1', () => {server.off('error', reject); resolve();});});
  return server;
}
