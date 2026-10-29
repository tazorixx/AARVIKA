export const RECENT_SEARCH_KEY='aarvika:recent-searches:v1';
export function normalizeRecent(value:unknown):string[] { return Array.isArray(value)?[...new Set(value.filter((v):v is string=>typeof v==='string').map(v=>v.trim().slice(0,60)).filter(Boolean))].slice(0,8):[]; }
export function rememberSearch(previous:string[],text:string) {const next=text.trim().slice(0,60);return next?normalizeRecent([next,...previous.filter(v=>v.toLocaleLowerCase()!==next.toLocaleLowerCase())]):normalizeRecent(previous);}
