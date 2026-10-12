import { mongo, transaction } from "../src/server/db";
async function main() {
  const client = await mongo();
  try {
    const db = client.db(process.env.MONGODB_DB || "ovia");
    await db
      .collection("checkoutSessions")
      .createIndex({ id: 1 }, { unique: true });
    await db
      .collection("checkoutPromos")
      .createIndex({ id: 1 }, { unique: true });
    await db
      .collection("checkoutPromos")
      .createIndex({ code: 1 }, { unique: true });
    await db
      .collection("orders")
      .createIndex({ owner: 1, idempotencyKey: 1 }, { unique: true });
    await db.collection("orders").createIndex({ provider: 1, providerId: 1 });
    await db.collection("orders").createIndex({ status: 1, expiresAt: 1 });
    await transaction((repo) =>
      repo.get("checkoutSessions", "__ovia_connection_check__"),
    );
    console.log(
      "Checkout indexes and MongoDB transaction support verified. No customer records were changed.",
    );
  } catch {
    console.error(
      "Checkout database setup failed. Check MongoDB transaction support and index permissions.",
    );
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
void main().catch(() => {
  console.error("Checkout database connection failed.");
  process.exitCode = 1;
});
