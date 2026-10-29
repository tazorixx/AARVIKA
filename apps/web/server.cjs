const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = __dirname;
const port = 4173;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function adminAvailable() {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 3100 });
    let done = false;
    const finish = available => { if (done) return; done = true; socket.destroy(); resolve(available); };
    socket.setTimeout(400);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function catalogue() {
  try {
    if (!await adminAvailable()) throw new Error('Admin is stopped');
    const response = await fetch('http://127.0.0.1:3100/api/mobile/v2/catalog', { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Admin is unavailable');
    const envelope = await response.json();
    if (envelope.meta?.projectId !== 'demo-aarvika-local' || envelope.data?.meta?.projectId !== 'demo-aarvika-local') throw new Error('Unexpected catalogue source');
    return { source: 'admin', data: envelope.data };
  } catch {
    return { source: 'fixture', data: JSON.parse(await fs.readFile(path.join(root, 'data', 'demo-catalogue.json'), 'utf8')) };
  }
}

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/catalog') {
      const payload = JSON.stringify(await catalogue());
      response.writeHead(200, { 'Content-Type': mime['.json'], 'Cache-Control': 'no-store' });
      response.end(payload);
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^\/+/, '');
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep) || relative.includes('\\')) { response.writeHead(403); response.end(); return; }
    if (!['index.html', 'app.mjs', 'catalog.mjs', 'styles.css'].includes(relative) && !relative.startsWith('assets/')) { response.writeHead(404); response.end(); return; }
    const body = await fs.readFile(target);
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': target.includes('assets') ? 'public, max-age=3600' : 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`AARVIKA local web: http://127.0.0.1:${port}`));
