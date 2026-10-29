export function gridGeometry(width: number, columns: number, gap = 8) {
  const safeWidth = Math.max(0, width);
  return { columns, itemWidth: Math.max(0, (safeWidth - gap * (columns - 1)) / columns), gap };
}
export function productColumns(width: number, fontScale = 1) {
  const normal = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  return fontScale > 1.4 ? Math.max(1, normal - 1) : normal;
}
