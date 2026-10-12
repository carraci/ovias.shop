import {publicationDateReached} from "@/lib/product-publication";
import { MongoClient, type ClientSession } from "mongodb";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { products, type Product } from "@/lib/catalog";
import { activeSalePrice } from "@/lib/product-sale";
import { recordAccountActivity } from "./account-activity";

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
  const repository: Repository = {
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
      const observed = ["orders", "tickets", "support_messages", "sessions", "users"].includes(c);
      const previous = observed ? await repository.get(c, value.id) : undefined;
      await db
        .collection(c)
        .replaceOne(c === "account_notifications" ? { _id: value.id as unknown as import("mongodb").ObjectId } : { id: value.id }, value, { upsert: true, session });
      if (observed) await recordAccountActivity(repository, c, value, previous);
    },
    async remove(c: string, id: string) {
      await db.collection(c).deleteOne({ id }, { session });
    },
  };
  return repository;
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
// Read-only callers do not need transaction start/commit round trips.
export async function readRepository<T>(fn: (repo: Repository) => Promise<T>): Promise<T> {
  return fn(mongoRepo(await mongo()));
}
export async function transaction<T>(
  fn: (repo: Repository) => Promise<T>,
): Promise<T> {
  if (isDemo()) throw new Error("MongoDB is not configured. Live database services are unavailable.");
  if (!isDemo()) {
    try {
      const client = await mongo();
      const session = client.startSession();
      try {
        return (await session.withTransaction(() =>
          fn(mongoRepo(client, session)),
        )) as T;
      } finally {
        await session.endSession();
      }
    } catch (err) {
      if (process.env.PAYMENT_PROVIDER === "razorpay" && process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_")) {
        if (err instanceof Error && typeof (err as Error & { status?: unknown }).status === "number") throw err;
        throw new Error("Live checkout database is unavailable. Please retry checking your order status shortly.");
      }
      throw err;
    }
  }
  if (process.env.PAYMENT_PROVIDER === "razorpay" && process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_"))
    throw new Error("Configure MongoDB before enabling live Razorpay checkout.");
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
export function isDemoProduct(p: any): boolean {
  if (!p) return false;
  if (typeof p.id === "string" && p.id.startsWith("ovia-import-")) return true;
  if (Boolean(p.sourceId) || Boolean(p.importSources)) return true;
  return false;
}

export function getProductPrimaryImage(p: any): string {
  if (!p) return "";
  if (typeof p.image === "string" && p.image.trim()) return p.image.trim();
  if (typeof p.images?.main === "string" && p.images.main.trim()) return p.images.main.trim();
  if (Array.isArray(p.variants)) {
    const v = p.variants.find((item: any) => typeof item?.image === "string" && item.image.trim());
    if (v?.image) return v.image.trim();
  }
  if (Array.isArray(p.gallery)) {
    const g = p.gallery.find((item: any) => typeof item === "string" && item.trim());
    if (g) return g.trim();
  }
  if (Array.isArray(p.images?.gallery)) {
    const g = p.images.gallery.find((item: any) => typeof item === "string" && item.trim());
    if (g) return g.trim();
  }
  return "";
}

export async function catalog(includeUnpublished = false): Promise<Product[]> {
 const read=async(repo:Repository)=>{
  const [stored, balances] = await Promise.all([
    repo.find<Product>('products'),
    repo.find<{id:string;available:number}>('inventory'),
  ]);
  const bySku=new Map(balances.map(b=>[b.id,b]));
  const ids=new Set(products.map(p=>p.id));
  return stored
   .filter(p => {
     if (isDemoProduct(p)) return false;
     const img = getProductPrimaryImage(p);
     if (!img) return false;
     return (
       includeUnpublished ||
       ((ids.has(p.id) || p.storefrontPublished !== false) &&
         p.status !== "Draft" &&
         p.status !== "Archived" &&
         publicationDateReached(p.publishAt))
     );
   })
   .map(p => {
     const primaryImage = getProductPrimaryImage(p);
     const confirmed = (p.variants || []).some(v => bySku.has(v.sku));
     const variants = (p.variants || []).map(v => ({
       ...v,
       image: (typeof v.image === "string" && v.image.trim()) || primaryImage,
       price: includeUnpublished ? v.price : activeSalePrice(p.sale, v.price),
       stock: bySku.get(v.sku)?.available ?? v.stock,
     }));
     const stock = variants.reduce((sum, v) => sum + v.stock, 0);
     return {
       ...p,
       image: primaryImage,
       price: includeUnpublished ? p.price : activeSalePrice(p.sale, p.price ?? p.variants?.[0]?.price ?? 0),
       variants,
       stock,
       ...(confirmed ? { availability: stock > 0 ? "In stock" : "Out of stock" } : {}),
     };
   });
 };
 const client = await mongo();
 const repo = mongoRepo(client);
 // Apply the existing demo/import exclusions before transferring catalog records.
 const catalogRepo: Repository = {
   ...repo,
   async find<T extends RecordValue>(collection: string, query: Partial<T> = {}) {
     if (collection !== 'products') return repo.find<T>(collection, query);
     return await client.db(process.env.MONGODB_DB || 'ovia').collection(collection)
       .find({ ...query, id: { $not: /^ovia-import-/ }, $expr: { $and: [
         { $not: [{ $toBool: { $ifNull: ['$sourceId', false] } }] },
         { $not: [{ $toBool: { $ifNull: ['$importSources', false] } }] },
       ] } }, { projection: { _id: 0 } }).toArray() as unknown as T[];
   },
 };
 return read(catalogRepo);
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
    "checkoutSessions",
    "checkoutPromos",
    "addresses",
    "support_messages", "support_conversations", "support_notes", "support_attachments", "support_connections", "support_email_receipts", "support_forwards",
    "account_notifications",
    "support_tickets", "support_mailbox", "support_drafts", "support_sent", "contact", "tickets", "privacyRequests", "audit", "stories", "campaigns", "campaignEvents",
  ])
    await db.collection(name).createIndex({ id: 1 }, { unique: true });
  for (const name of ["tickets", "privacyRequests", "sessions", "addresses"]) await db.collection(name).createIndex({ userId: 1 });
  await db.collection("account_notifications").createIndex({userId:1,createdAt:-1});
  await db.collection("checkoutPromos").createIndex({ code: 1 }, { unique: true });
  await db.collection("orders").createIndex({ provider: 1, providerId: 1 });
  await db.collection("orders").createIndex({ status: 1, expiresAt: 1 });
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
