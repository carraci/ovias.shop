import { filterProducts, products } from "../src/lib/catalog.ts";

console.log("Total products in catalog:", products.length);

const testFilters = [
  { name: "Leather Luggage (/luggage?material=Leather)", filter: { department: "luggage", material: "Leather" } },
  { name: "Silver Luggage (/luggage?color=Silver)", filter: { department: "luggage", color: "Silver" } },
  { name: "Black Luggage (/luggage?color=Black)", filter: { department: "luggage", color: "Black" } },
  { name: "Blue Luggage (/luggage?color=Midnight+Blue)", filter: { department: "luggage", color: "Midnight Blue" } },
  { name: "All Gifts (/collections/gifts)", filter: { tag: "gifts" } },
  { name: "Long haul (/collections/long-haul)", filter: { tag: "long-haul" } },
  { name: "Short trips (/collections/short-trips)", filter: { tag: "short-trips" } },
  { name: "Business selection (/collections/business-selection)", filter: { tag: "business-selection" } },
  { name: "Polycarbonate (/luggage?material=Polycarbonate)", filter: { department: "luggage", material: "Polycarbonate" } },
  { name: "Aluminium (/luggage?material=Aluminium)", filter: { department: "luggage", material: "Aluminium" } },
];

for (const tf of testFilters) {
  const res = filterProducts(products, tf.filter);
  console.log(`${tf.name}: ${res.total} products returned`);
}
