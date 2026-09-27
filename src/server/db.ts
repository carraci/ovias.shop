import { MongoClient, type ClientSession } from "mongodb";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { products, type Product } from "@/lib/catalog";

type RecordValue = { id: string };
type State = Record<string, RecordValue[]>;
export interface Repository {
  get<T extends RecordValue>(
    collection: string,
    id: string,
  ): Promise<T | undefined>;
  find<T extends RecordValue>(
    collection: string,
    query?: Partial<T>,
  ): Promise<T[]>;
  put<T extends RecordValue>(collection: string, value: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}
const globalDb = globalThis as typeof globalThis & {
  oviaMongo?: Promise<MongoClient>;
  oviaQueue?: Promise<unknown>;
};
export function isDemo() {
  return !process.env.MONGODB_URI;
}
export async function mongo() {
  if (!process.env.MONGODB_URI) throw new Error("MongoDB is not configured.");
  if (!globalDb.oviaMongo)
    globalDb.oviaMongo = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 6000,
    })
      .connect()
      .catch((e) => {
        globalDb.oviaMongo = undefined;
        throw e;
      });
  return globalDb.oviaMongo;
}
function mongoRepo(client: MongoClient, session?: ClientSession): Repository {
  const db = client.db(process.env.MONGODB_DB || "ovia");
  return {
    async get<T extends RecordValue>(
      c: string,
      id: string,
    ): Promise<T | undefined> {
      const value = await db
        .collection(c)
        .findOne({ id }, { session, projection: { _id: 0 } });
      return value ? (value as unknown as T) : undefined;
    },
    async find<T extends RecordValue>(c: string, q: Partial<T> = {}) {
      return (await db
        .collection(c)
        .find(q, { session, projection: { _id: 0 } })
        .toArray()) as unknown as T[];
    },
    async put<T extends RecordValue>(c: string, value: T) {
      await db
        .collection(c)
        .replaceOne({ id: value.id }, value, { upsert: true, session });
    },
    async remove(c: string, id: string) {
      await db.collection(c).deleteOne({ id }, { session });
    },
  };
}
function localRepo(state: State): Repository {
  return {
    async get<T extends RecordValue>(c: string, id: string) {
      return state[c]?.find((v) => v.id === id) as T | undefined;
    },
    async find<T extends RecordValue>(c: string, q: Partial<T> = {}) {
      return (state[c] || []).filter((v) =>
        Object.entries(q).every(
          ([k, val]) => (v as unknown as Record<string, unknown>)[k] === val,
        ),
      ) as T[];
    },
    async put<T extends RecordValue>(c: string, value: T) {
      state[c] ??= [];
      const i = state[c].findIndex((v) => v.id === value.id);
      if (i < 0) state[c].push(value);
      else state[c][i] = value;
    },
    async remove(c: string, id: string) {
      state[c] = (state[c] || []).filter((v) => v.id !== id);
    },
  };
}
export async function transaction<T>(
  fn: (repo: Repository) => Promise<T>,
): Promise<T> {
  if (!isDemo()) {
    const client = await mongo();
    const session = client.startSession();
    try {
      return (await session.withTransaction(() =>
        fn(mongoRepo(client, session)),
      )) as T;
    } finally {
      await session.endSession();
    }
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEMO_CHECKOUT !== "true"
  )
    throw new Error(
      "Configure MongoDB Atlas before enabling account or cart services on this deployment.",
    );
  // Development adapter only: serializes all writes in one Node process.
  const run = async () => {
    const dir = path.join(process.cwd(), ".data");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, "store.json");
    let state: State = {};
    try {
      state = JSON.parse(await readFile(file, "utf8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    const result = await fn(localRepo(state));
    const temp = `${file}.tmp`;
    await writeFile(temp, JSON.stringify(state));
    await rename(temp, file);
    return result;
  };
  const pending = (globalDb.oviaQueue || Promise.resolve()).then(run, run);
  globalDb.oviaQueue = pending.catch(() => undefined);
  return pending;
}
export async function catalog(): Promise<Product[]> {
  if (isDemo()) return products;
  const client = await mongo();
  return mongoRepo(client).find<Product>("products");
}
export async function setupDatabase() {
  const db = (await mongo()).db(process.env.MONGODB_DB || "ovia");
  for (const name of [
    "products",
    "users",
    "sessions",
    "carts",
    "orders",
    "inventory",
    "limits",
    "events",
    "tokens",
    "outbox",
    "addresses",
    "contact", "tickets", "privacyRequests", "audit", "stories",
  ])
    await db.collection(name).createIndex({ id: 1 }, { unique: true });
  for (const name of ["tickets", "privacyRequests", "sessions", "addresses"]) await db.collection(name).createIndex({ userId: 1 });
  await db.collection("products").createIndex({ slug: 1 });
  await db.collection("products").createIndex({ sourceId: 1 });
  await db.collection("products").createIndex({ department: 1, category: 1 });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("stories").createIndex({ slug: 1 }, { unique: true });
  await db.collection("tokens").createIndex({ cleanupAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("orders")
    .createIndex({ owner: 1, idempotencyKey: 1 }, { unique: true });
}
