export function filterTraditions(faith: string, region: string, query: string, source: { traditions: import('./contracts').WeddingTradition[]; ceremonies: import('./contracts').Ceremony[] }) {
  const { traditions, ceremonies } = source;
  return traditions.filter(t => (!faith || t.faith === faith) && (!region || t.regions.join(' ').toLowerCase().includes(region.toLowerCase()) || t.regions.includes('Pan-India')) && (!query || `${t.name} ${t.faith} ${t.regions.join(' ')} ${ceremonies.filter(c => c.traditionId === t.id).map(c => c.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())));
}
