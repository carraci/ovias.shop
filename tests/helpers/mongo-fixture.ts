import { products } from "../../src/lib/catalog";
import type { MongoClient } from "mongodb";

type Document = Record<string, any>;
type State = Map<string, Map<string, Document>>;

const at = (value: Document, field: string) => field.split(".").reduce((item, key) => item?.[key], value);
function matches(value: Document, query: Document): boolean {
  return Object.entries(query).every(([field, expected]) => {
    if (field === "$or") return expected.some((item: Document) => matches(value, item));
    if (field === "$and") return expected.every((item: Document) => matches(value, item));
    if (field === "$expr") return !value.sourceId && !value.importSources;
    const actual = at(value, field);
    if (expected instanceof RegExp) return expected.test(String(actual ?? ""));
    if (expected && typeof expected === "object") {
      if ("$not" in expected) return !matches(value, { [field]: expected.$not });
      if ("$regex" in expected) return expected.$regex.test(String(actual ?? ""));
      if ("$in" in expected) return expected.$in.includes(actual);
      if ("$ne" in expected) return actual !== expected.$ne;
      if ("$exists" in expected) return (actual !== undefined) === expected.$exists;
    }
    return actual === expected;
  });
}

/** A test-only Mongo protocol fixture; never connects or changes production db behavior. */
export function installMongoFixture(seed: Document[] = products) {
  const runtime = globalThis as typeof globalThis & { oviaMongo?: Promise<MongoClient> };
  const previousClient = runtime.oviaMongo;
  const previousUri = process.env.MONGODB_URI;
  const previousDatabase = process.env.MONGODB_DB;
  let state: State = new Map([
    ["products", new Map(seed.map((product) => [product.id, structuredClone(product)]))],
  ]);
  let queue: Promise<unknown> = Promise.resolve();
  const table = (name: string, session?: { staged?: State }) => {
    const source = session?.staged ?? state;
    if (!source.has(name)) source.set(name, new Map());
    return source.get(name)!;
  };
  const client = {
    db: () => ({
      collection: (name: string) => ({
        findOne: async (query: Document, options?: any) => structuredClone([...table(name, options?.session).values()].find((value) => matches(value, query))),
        find: (query: Document = {}, options?: any) => ({
          toArray: async () => structuredClone([...table(name, options?.session).values()].filter((value) => matches(value, query))),
        }),
        replaceOne: async (query: Document, value: Document, options?: any) => {
          table(name, options?.session).set(value.id ?? query._id, structuredClone(value));
          return { acknowledged: true };
        },
        updateOne: async (query: Document, update: Document, options?: any) => {
          const collection = table(name, options?.session);
          const previous = [...collection.values()].find((value) => matches(value, query));
          if (!previous && !options?.upsert) return { matchedCount: 0, modifiedCount: 0 };
          const next = { ...(previous ?? query), ...structuredClone(update.$set ?? {}) };
          for (const [key, increment] of Object.entries(update.$inc ?? {})) next[key] = (next[key] ?? 0) + Number(increment);
          for (const [key, item] of Object.entries(update.$addToSet ?? {})) next[key] = [...new Set([...(next[key] ?? []), item])];
          for (const key of Object.keys(update.$unset ?? {})) delete next[key];
          collection.set(next.id ?? next._id, next);
          return { matchedCount: previous ? 1 : 0, modifiedCount: 1 };
        },
        deleteOne: async (query: Document, options?: any) => {
          const collection = table(name, options?.session);
          const match = [...collection.values()].find((value) => matches(value, query));
          if (match) collection.delete(match.id);
          return { deletedCount: match ? 1 : 0 };
        },
        createIndex: async () => "fixture-index",
      }),
    }),
    startSession: () => {
      const session: { staged?: State; withTransaction?: any; endSession?: any } = {};
      session.withTransaction = (fn: () => Promise<unknown>) => {
        const pending = queue.then(async () => {
          session.staged = structuredClone(state);
          const result = await fn();
          state = session.staged;
          session.staged = undefined;
          return result;
        });
        queue = pending.catch(() => undefined);
        return pending;
      };
      session.endSession = async () => { session.staged = undefined; };
      return session;
    },
  };
  process.env.MONGODB_URI = "mongodb://test-only.invalid/ovia-fixture";
  process.env.MONGODB_DB = "ovia-fixture";
  runtime.oviaMongo = Promise.resolve(client as unknown as MongoClient);
  return {
    snapshot: () => Object.fromEntries([...state].map(([name, values]) => [name, [...values.values()]])),
    restore() {
      runtime.oviaMongo = previousClient;
      if (previousUri === undefined) delete process.env.MONGODB_URI;
      else process.env.MONGODB_URI = previousUri;
      if (previousDatabase === undefined) delete process.env.MONGODB_DB;
      else process.env.MONGODB_DB = previousDatabase;
    },
  };
}
