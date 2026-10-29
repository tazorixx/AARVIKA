import { createContext, useContext } from 'react';
import type { CatalogueAdapter, CatalogueSnapshot } from '../../../../packages/catalogue/src/api-contracts.ts';

export const CatalogueContext = createContext<(CatalogueSnapshot & { catalogService: CatalogueAdapter; catalogueRevision: number }) | null>(null);

export function useCatalogue() {
  const value = useContext(CatalogueContext);
  if (!value) throw new Error('CatalogueProvider is required.');
  return value;
}
