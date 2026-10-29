/** The published feed is public; admin mutations retain their own authentication. */
export function catalogueHeaders(request: Request, env: Record<string, string | undefined> = process.env) {
  const origin = request.headers.get('origin');
  if (origin) {
    const incoming = new URL(origin);
    const sameOrigin = incoming.origin === new URL(request.url).origin;
    const local = env.NODE_ENV !== 'production' && incoming.protocol === 'http:' && incoming.hostname === '127.0.0.1' && !!incoming.port;
    const allowed = (env.AARVIKA_STOREFRONT_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!sameOrigin && !local && !(incoming.protocol === 'https:' && allowed.includes(incoming.origin))) throw Error('Storefront origin is not allowed.');
  }
  return {'Cache-Control':'no-store', Vary:'Origin', ...(origin ? {'Access-Control-Allow-Origin':origin} : {}), 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Accept, Content-Type'};
}
