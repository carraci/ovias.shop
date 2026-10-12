import { createServer } from "node:http";
import { createSupportSocketServer } from "./support-socket-core.mjs";
import { SignJWT } from "jose";
import { MongoClient } from "mongodb";
if (
  !process.env.MONGODB_URI ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
)
  throw new Error("Configure MongoDB and a stable JWT_SECRET.");
const origin = new URL(process.env.APP_ORIGIN || "http://localhost:3000")
  .origin;
const key = new TextEncoder().encode(process.env.JWT_SECRET);
const client = await new MongoClient(process.env.MONGODB_URI).connect();
const db = client.db(process.env.MONGODB_DB || "ovia");
let healthy = false;
const server = createServer((req, res) => {
  res.writeHead(healthy ? 200 : 503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ service: "ovia-support", ready: healthy, origin }));
});
const io = createSupportSocketServer(server, { origin, key, db });
const collections = [
  "account_notifications",
  "contact",
  "tickets",
  "support_tickets",
  "support_messages",
  "support_conversations",
  "support_notes",
  "support_mailbox",
  "outbox",
];
let stream;
let stopping = false;
async function watch() {
  while (!stopping) {
    try {
      stream = db.watch([{ $match: { "ns.coll": { $in: collections } } }], {
        fullDocument: "updateLookup",
      });
      healthy = true;
      for await (const change of stream) {
        io.to("owners").emit("support:changed");
        const document = change.fullDocument;
        if (!document) continue;
        if (change.ns.coll === "account_notifications") {
          if (document.userId) io.to("user:" + document.userId).emit("account:changed");
          continue;
        }
        const ref =
          document.ticketId ||
          (["tickets", "support_tickets", "contact"].includes(change.ns.coll)
            ? change.ns.coll + ":" + document.id
            : change.ns.coll === "support_conversations"
              ? document.id
              : null);
        if (!ref || change.ns.coll === "support_notes") continue;
        const [collection, ...parts] = ref.split(":");
        const ticket = await db
          .collection(collection)
          .findOne({ id: parts.join(":") });
        if (ticket?.userId)
          io.to("user:" + ticket.userId).emit("support:changed");
        else if (ticket?.customerEmail || ticket?.email) {
          const users = await db
            .collection("users")
            .find({
              email: ticket.customerEmail || ticket.email,
              verifiedAt: { $exists: true },
            })
            .project({ id: 1 })
            .toArray();
          for (const user of users)
            io.to("user:" + user.id).emit("support:changed");
        }
      }
    } catch {
      healthy = false;
      if (!stopping) await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
void watch();
const sessions = setInterval(async () => {
  for (const socket of io.sockets.sockets.values()) {
    const session = await db
      .collection("sessions")
      .findOne({ id: socket.data.sessionId, userId: socket.data.userId });
    const user = await db
      .collection("users")
      .findOne({ id: socket.data.userId });
    const owner = ["ADMIN", "OWNER"].includes((user?.role || "").toUpperCase());
    if (
      !session ||
      Date.parse(session.expiresAt) < Date.now() ||
      !user?.verifiedAt ||
      owner !== socket.data.owner ||
      socket.data.exp * 1000 < Date.now()
    )
      socket.disconnect(true);
  }
}, 30000);
let syncing = false;
const sync = setInterval(async () => {
  if (syncing) return;
  syncing = true;
  try {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("ovia-support-worker")
      .setAudience("ovia-support-worker")
      .setIssuedAt()
      .setExpirationTime("30s")
      .sign(key);
    await fetch(origin + "/api/internal/support/sync", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    /* The next pass retries; UI retains its last confirmed sync state. */
  } finally {
    syncing = false;
  }
}, 5000);
server.listen(
  Number(process.env.SUPPORT_REALTIME_PORT || 3001),
  "0.0.0.0",
  () => console.log("Support Socket.IO server listening."),
);
async function stop() {
  stopping = true;
  clearInterval(sync);
  clearInterval(sessions);
  await stream?.close();
  io.close();
  server.close();
  await client.close();
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
