import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

const rawProducts = [
  {
    productId: "52500073",
    name: "Never Still - Canvas Flap Backpack Large",
    slug: "never-still-canvas-flap-backpack-large-52500073",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 21000000,
    material: "Canvas",
    color: "Desert Sand",
    hex: "#b5a58b",
    sizes: ["Large"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: []
  },
  {
    productId: "52523009",
    name: "Never Still - Leather Flap Backpack Small",
    slug: "never-still-leather-flap-backpack-small-52523009",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 21000000,
    material: "Leather",
    color: "Matte Black",
    hex: "#222324",
    sizes: ["Small"],
    dimensions: "38 × 30 × 14 cm",
    capacity: "16 L",
    weight: "1.2 kg",
    featured: true,
    badges: ["New"]
  },
  {
    productId: "52525006",
    name: "Never Still - Leather Flap Backpack Large",
    slug: "never-still-leather-flap-backpack-large-52525006",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 25750000,
    material: "Leather",
    color: "Olive Green",
    hex: "#435043",
    sizes: ["Large"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: ["New"]
  },
  {
    productId: "93090009",
    name: "Original Bag - Aluminium Backpack",
    slug: "original-bag-aluminium-backpack-93090009",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Original",
    price: 26500000,
    material: "Aluminium",
    color: "Silver",
    hex: "#bec1bd",
    sizes: ["Standard"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: true,
    badges: ["New"]
  },
  {
    productId: "52500076",
    name: "Never Still - Nylon Zipped Backpack Medium",
    slug: "never-still-nylon-zipped-backpack-medium-52500076",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 15500000,
    material: "Nylon",
    color: "Graphite Grey",
    hex: "#4b4d4f",
    sizes: ["Medium"],
    dimensions: "38 × 30 × 14 cm",
    capacity: "16 L",
    weight: "1.2 kg",
    featured: false,
    badges: []
  },
  {
    productId: "52500086",
    name: "Never Still - Canvas Flap Backpack Large",
    slug: "never-still-canvas-flap-backpack-large-52500086",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 21000000,
    material: "Canvas",
    color: "Dune",
    hex: "#c2b49d",
    sizes: ["Large"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: []
  },
  {
    productId: "52500071",
    name: "Never Still - Leather Flap Backpack Large",
    slug: "never-still-leather-flap-backpack-large-52500071",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 25750000,
    material: "Leather",
    color: "Matte Black",
    hex: "#222324",
    sizes: ["Large"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: []
  },
  {
    productId: "52500075",
    name: "Never Still - Nylon Flap Backpack Large",
    slug: "never-still-nylon-flap-backpack-large-52500075",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 18300000,
    material: "Nylon",
    color: "Matte Black",
    hex: "#222324",
    sizes: ["Large"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: []
  },
  {
    productId: "53100011",
    name: "Travel Accessories Cabin Luggage Harness Backpack",
    slug: "travel-accessories-cabin-luggage-harness-backpack-53100011",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Travel",
    price: 6900000,
    material: "Leather",
    color: "Matte Black",
    hex: "#222324",
    sizes: ["Standard"],
    dimensions: "40 × 28 × 12 cm",
    capacity: "14 L",
    weight: "0.9 kg",
    featured: false,
    badges: []
  },
  {
    productId: "52500087",
    name: "Never Still - Leather Flap Backpack Large",
    slug: "never-still-leather-flap-backpack-large-52500087",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Never Still",
    price: 25750000,
    material: "Leather",
    color: "Midnight Blue",
    hex: "#2b3a4a",
    sizes: ["Large"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: []
  },
  {
    productId: "93090003",
    name: "Original Bag - Aluminium Backpack",
    slug: "original-bag-aluminium-backpack-93090003",
    brand: "OVIA",
    category: "Bags",
    subcategory: "Backpacks",
    collection: "Original",
    price: 26500000,
    material: "Aluminium",
    color: "Titanium",
    hex: "#a69f93",
    sizes: ["Standard"],
    dimensions: "44 × 33 × 16 cm",
    capacity: "23 L",
    weight: "2.1 kg",
    featured: false,
    badges: []
  }
];

export const formattedBackpacks = rawProducts.map((p) => {
  const imagePath = `/media/bags/${p.productId}_1.png`;
  const desc = p.material === "Aluminium"
    ? "Engineered from premium grooved anodized aluminium with precision craftsmanship, full-grain Italian leather accents, and an ergonomically padded shoulder harness. A defining statement for modern urban journeys."
    : `A considered daily carry uniting refined utility and balanced proportions. Handcrafted in ${p.material.toLowerCase()}, featuring an easy-access flap closure, padded tech sleeve, and breathable back padding for effortless all-day comfort.`;

  const tags = [
    "bags",
    "backpacks",
    p.material.toLowerCase(),
    "short-trips",
    "business-selection",
    "business-bags",
    ...(p.badges.includes("New") ? ["new-arrivals"] : []),
    ...(p.material === "Aluminium" ? ["signature-pieces"] : [])
  ];

  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    collection: p.collection,
    department: "bags",
    category: "Backpacks",
    subcategory: "Backpacks",
    material: p.material,
    description: desc,
    dimensions: p.dimensions,
    capacity: p.capacity,
    weight: p.weight,
    tags,
    variants: [
      {
        sku: `OV-${p.productId}`,
        color: p.color,
        hex: p.hex,
        price: p.price,
        stock: 12,
        image: imagePath
      }
    ],
    image: imagePath,
    imageKind: "photograph",
    featured: p.featured,
    gallery: [imagePath], // Second image removed as requested
    images: {
      main: imagePath,
      gallery: [imagePath] // Second image removed as requested
    },
    price: p.price,
    currency: "INR",
    sizes: p.sizes,
    sourceId: p.productId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

async function main() {
  console.log(`Generated ${formattedBackpacks.length} formatted backpack products.`);

  // 1. Update MongoDB if configured
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const collection = db.collection("products");

    // Remove existing backpacks
    const delRes = await collection.deleteMany({ category: "Backpacks" });
    console.log(`Deleted ${delRes.deletedCount} old backpack records from MongoDB.`);

    // Insert new backpacks
    const insRes = await collection.insertMany(formattedBackpacks);
    console.log(`Inserted ${insRes.insertedCount} new backpack records into MongoDB.`);
    await client.close();
  }

  // 2. Update bags-collection.ts
  const bagsCollectionPath = path.resolve("src/lib/bags-collection.ts");
  const existingCode = fs.readFileSync(bagsCollectionPath, "utf8");

  // Keep non-backpack products from bags-collection.ts
  const nonBackpackMatch = existingCode.match(/(\{\s*"id":\s*"never-still-leather-duffle-bag-large"[\s\S]*)/);
  if (nonBackpackMatch) {
    const nonBackpacks = nonBackpackMatch[1];
    formattedBackpacks.forEach(p => delete p._id);
    const newBagsCollectionCode = `import type { Product } from "./catalog";\n\nexport const bagsProducts: Product[] = [\n${formattedBackpacks.map(p => {
      const copy = { ...p };
      delete copy._id;
      return "  " + JSON.stringify(copy, null, 2);
    }).join(",\n")},\n${nonBackpacks}`;
    fs.writeFileSync(bagsCollectionPath, newBagsCollectionCode, "utf8");
    console.log("Updated src/lib/bags-collection.ts successfully.");
  } else {
    console.warn("Could not find split point in bags-collection.ts");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
