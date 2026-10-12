import { test } from "node:test";
import assert from "node:assert/strict";
import { publicationDateReached } from "../src/lib/product-publication";
test("scheduled product stays hidden until saved publication date and invalid dates never publish", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  assert.equal(publicationDateReached("2026-10-08T12:00:01Z", now), false);
  assert.equal(publicationDateReached("2026-10-08T12:00:00Z", now), true);
  assert.equal(publicationDateReached("invalid", now), false);
  assert.equal(publicationDateReached(null, now), true);
});
