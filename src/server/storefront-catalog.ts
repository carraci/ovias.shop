import type { Product } from '@/lib/catalog';
import { catalog } from './db';
// Database failures propagate so imported snapshots cannot masquerade as live data.
export async function storefrontCatalog(load: () => Promise<Product[]> = catalog): Promise<Product[]> {
  return load();
}
