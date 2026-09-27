import { test } from "node:test";
import assert from "node:assert/strict";
import { products, type Product } from "../src/lib/catalog";
import {
  productMedia,
  productSpecifications,
  mediaRoles,
} from "../src/lib/product-media";

function fixture(overrides: Partial<Product> = {}): Product {
  return {
    ...products[0],
    image: "/main.jpg",
    images: undefined,
    gallery: undefined,
    ...overrides,
  };
}

test("legacy images keep unknown views in the gallery and never invent editorial roles", () => {
  const media = productMedia(
    fixture({ gallery: ["/main.jpg", "/a8f10.jpg", "/a8f10.jpg"] }),
  );
  assert.deepEqual(
    media.gallery.map((image) => image.src),
    ["/main.jpg", "/a8f10.jpg"],
  );
  for (const role of mediaRoles) assert.deepEqual(media[role], []);
});

test("descriptive filenames and explicit roles map each section without treating swatches as photos", () => {
  const media = productMedia(
    fixture({
      gallery: [
        "/editorial-trip.jpg",
        "/detail-strap.jpg",
        "/dimensions.jpg",
        "/material-leather.jpg",
        "/craftsmanship.jpg",
        "/swatch.jpg",
      ],
      images: {
        swatches: ["/swatch.jpg"],
        editorial: ["/detail-explicit-story.jpg"],
      },
    }),
  );
  assert.deepEqual(media.editorial, [
    "/detail-explicit-story.jpg",
    "/editorial-trip.jpg",
  ]);
  assert.deepEqual(media.details, ["/detail-strap.jpg"]);
  assert.deepEqual(media.dimensions, ["/dimensions.jpg"]);
  assert.deepEqual(media.materials, ["/material-leather.jpg"]);
  assert.deepEqual(media.craftsmanship, ["/craftsmanship.jpg"]);
  assert.ok(!media.gallery.some((image) => image.src === "/swatch.jpg"));
});

test("variant image is first and thumbnails retain canonical pairing after reordering", () => {
  const product = fixture({
    images: {
      main: "/main.jpg",
      gallery: ["/main.jpg", "/back.jpg"],
      thumbnails: ["/thumb-main.jpg", "/thumb-back.jpg"],
    },
  });
  const media = productMedia(product, {
    ...product.variants[0],
    image: "/variant.jpg",
  });
  assert.deepEqual(media.gallery, [
    { src: "/variant.jpg", thumbnail: "/variant.jpg" },
    { src: "/main.jpg", thumbnail: "/thumb-main.jpg" },
    { src: "/back.jpg", thumbnail: "/thumb-back.jpg" },
  ]);
});

test("missing media stays empty and placeholder specifications are omitted", () => {
  const product = fixture({
    image: "",
    dimensions: "",
    capacity: "—",
    weight: "N/A",
    specifications: { Exterior: "Leather", Interior: "" },
  });
  assert.deepEqual(productMedia(product).gallery, []);
  assert.deepEqual(productSpecifications(product), [["Exterior", "Leather"]]);
});

test("products never borrow another product's media", () => {
  const first = productMedia(fixture({ gallery: ["/first/editorial.jpg"] }));
  const second = productMedia(fixture({ image: "/second/main.jpg" }));
  assert.deepEqual(first.editorial, ["/first/editorial.jpg"]);
  assert.deepEqual(second.gallery, [
    { src: "/second/main.jpg", thumbnail: "/second/main.jpg" },
  ]);
  assert.deepEqual(second.editorial, []);
});

test("imported lowercase specifications do not duplicate existing dimensions or material", () => {
  const specs = productSpecifications(
    fixture({
      dimensions: "20 cm",
      capacity: "—",
      weight: "—",
      material: "Leather",
      specifications: { dimensions: "22 cm", material: "Leather" },
    }),
  );
  assert.deepEqual(specs, [["Dimensions", "22 cm"]]);
});
