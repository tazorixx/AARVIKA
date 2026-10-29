import { isImageKitReference } from '../../../../packages/catalogue/src/media-policy.ts';
export type ImageUse = 'category' | 'grid' | 'detail' | 'zoom' | 'hero';
const limits: Record<ImageUse, [number, number]> = { category: [120, 200], grid: [300, 450], detail: [700, 1000], zoom: [1200, 2000], hero: [200, 1200] };
export function imagePixels(width: number, dpr: number, use: ImageUse) {
  const [min, max] = limits[use];
  const desired = Number.isFinite(width * dpr) ? width * Math.min(3, Math.max(1, dpr)) : min;
  return Math.min(max, Math.max(min, Math.ceil(desired / 50) * 50));
}
export function trustedImageKit(source: string, endpoint?: string) {
  if (!isImageKitReference(source) || !endpoint) return false;
  try {
    const root = new URL(endpoint);
    return root.protocol === 'https:' && root.hostname === 'ik.imagekit.io' && !root.username && !root.password && !root.port && !root.search && !root.hash && root.pathname.split('/').filter(Boolean).length === 1 && new URL(source).pathname.startsWith(root.pathname.replace(/\/$/, '') + '/');
  } catch { return false; }
}
/** Only the configured account is transformed; unrelated and signed URLs are unchanged. */
export function optimizedImageUrl(source: string, endpoint: string | undefined, width: number, dpr: number, use: ImageUse) {
  if (!trustedImageKit(source, endpoint)) return source;
  const url = new URL(source);
  if (url.searchParams.has('ik-s')) return source;
  url.pathname=url.pathname.replace(/\/tr:[^/]+\//,'/');
  const pixels=imagePixels(width,dpr,use);
  url.searchParams.set('tr', `w-${pixels},h-${pixels},c-at_max,f-auto,q-${use === 'zoom' ? 90 : 80}`);
  return url.toString();
}
/** Signed originals cannot be resized without invalidating signatures: never fetch them for cards. */
export function boundedImageKitUrl(source:string,endpoint:string|undefined,width:number,dpr:number,use:ImageUse) {
  if(!trustedImageKit(source,endpoint))return undefined;
  const result=optimizedImageUrl(source,endpoint,width,dpr,use),url=new URL(result);
  if(!url.searchParams.has('ik-s')||use==='zoom')return result;
  const transforms=(url.searchParams.get('tr')??'')+','+(url.pathname.match(/\/tr:([^/]+)/)?.[1]??'');
  const widths=[...transforms.matchAll(/(?:^|[, :])w-(\d+)(?=,|:|$)/g)].map(m=>Number(m[1]));
  const heights=[...transforms.matchAll(/(?:^|[, :])h-(\d+)(?=,|:|$)/g)].map(m=>Number(m[1]));
  return widths.length&&heights.length&&[...widths,...heights].every(value=>value>0&&value<=limits[use][1])?result:undefined;
}
