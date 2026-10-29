export const departments = [
  { id: 'wedding', title: 'Wedding', art: 'tray', color: 'peach' },
  { id: 'birthday', title: 'Birthday', art: 'card', color: 'rose' },
  { id: 'personalized', title: 'Personalized Gifts', art: 'mug', color: 'lilac' },
  { id: 'anniversary', title: 'Anniversary', art: 'frame', color: 'cream' },
  { id: 'hampers', title: 'Hampers', art: 'box', color: 'mint' },
  { id: 'clothing', title: 'Clothing', art: 'shirt', color: 'lilac' },
  { id: 'stationery', title: 'Stationery', art: 'journal', color: 'cream' },
  { id: 'furniture', title: 'Furniture', art: 'chair', color: 'mint' },
];
export const artByType = { tray:'tray',box:'box',drinkware:'mug',notebook:'journal',photo:'frame',fashion:'shirt',clothing:'shirt',furniture:'chair',pen:'pen',gift:'pouch',essential:'lamp',decor:'lamp',jewellery:'jewellery',card:'card',accessory:'pouch',packaging:'box',wearable:'shirt',stationery:'journal',home:'lamp' };
export const price = amount => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(amount/100);
export const safeText = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
export function productSku(snapshot, product, selectedId) {
  const options = snapshot.skus.filter(sku => sku.productId === product.id && product.skuIds.includes(sku.id));
  return options.find(sku => sku.id === selectedId) ?? options[0] ?? null;
}
export function productPrice(snapshot, product) {
  const options = snapshot.skus.filter(sku => sku.productId === product.id && product.skuIds.includes(sku.id));
  return options.length ? Math.min(...options.map(sku => sku.price.amount)) : null;
}
export function findProducts(snapshot, { department, category, query, recipient, sort = 'relevance', inStock = false } = {}) {
  const q = String(query || '').trim().toLocaleLowerCase();
  const categories = new Map(snapshot.categories.map(item => [item.id, item.name]));
  const result = snapshot.products.filter(product => {
    if (department && !product.departmentIds.includes(department)) return false;
    if (category && !product.categoryIds.includes(category)) return false;
    if (recipient && !product.recipientIds.some(item => item.toLocaleLowerCase() === recipient.toLocaleLowerCase())) return false;
    if (q && ![product.title, product.description, product.productType, ...product.categoryIds.map(id => categories.get(id) || '')].join(' ').toLocaleLowerCase().includes(q)) return false;
    if (inStock && !snapshot.skus.some(sku => product.skuIds.includes(sku.id) && sku.inventory.available > 0)) return false;
    return true;
  });
  if (sort === 'price-asc') result.sort((a,b) => (productPrice(snapshot,a) ?? Infinity) - (productPrice(snapshot,b) ?? Infinity));
  if (sort === 'price-desc') result.sort((a,b) => (productPrice(snapshot,b) ?? -1) - (productPrice(snapshot,a) ?? -1));
  return result;
}
export function safeImage(product, source) {
  const path = product.media?.[0]?.path;
  if (typeof path === 'string' && /^\/assets\/demo-art\/[a-z0-9-]+\.png$/.test(path)) return path;
  if (source === 'admin' && typeof path === 'string' && /^\/(demo-art|demo-uploads)\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/.test(path)) return `http://127.0.0.1:3100${path}`;
  if (typeof path === 'string') { try { const url = new URL(path); if (url.protocol === 'https:' && url.hostname === 'ik.imagekit.io') return path; } catch {} }
  return `/assets/demo-art/${artByType[product.productType] || 'box'}.png`;
}
export function cartSubtotal(snapshot, lines) {
  return lines.reduce((total,line) => { const sku = snapshot.skus.find(item => item.id === line.skuId); return total + (sku?.price.amount || 0) * line.quantity; },0);
}
