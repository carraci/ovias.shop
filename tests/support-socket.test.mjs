import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { SignJWT } from "jose";
import { io as clientSocket } from "socket.io-client";
import { createSupportSocketServer } from "../scripts/support-socket-core.mjs";
const key = new TextEncoder().encode(
    "a-fixture-key-at-least-thirty-two-characters",
  ),
  origin = "http://localhost:3000";
async function fixture() {
  const server = createServer();
  const db = {
    collection(name) {
      return {
        async findOne(query) {
          if (
            name === "sessions" &&
            ["owner", "customer"].includes(query.userId) &&
            query.id === "session-" + query.userId
          )
            return {
              id: query.id,
              userId: query.userId,
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            };
          if (name === "users" && ["owner", "customer"].includes(query.id))
            return {
              id: query.id,
              verifiedAt: "yes",
              role: query.id === "owner" ? "OWNER" : "CUSTOMER",
            };
          return null;
        },
      };
    },
  };
  const io = createSupportSocketServer(server, { origin, key, db });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = "http://127.0.0.1:" + server.address().port;
  async function token(id, sessionId = "session-" + id) {
    return new SignJWT({ sessionId, role: "owner" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(id)
      .setIssuer("ovia-support")
      .setAudience("ovia-support-socket")
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(key);
  }
  const connect = (token) =>
    clientSocket(url, {
      auth: { token },
      extraHeaders: { Origin: origin },
      transports: ["websocket"],
      reconnection: false,
      timeout: 1000,
    });
  return {
    io,
    server,
    token,
    connect,
    async close() {
      await new Promise((r) => io.close(r));
    },
  };
}
test(
  "Socket.IO rejects absent credentials and revoked sessions",
  { timeout: 10000 },
  async () => {
    const f = await fixture();
    try {
      for (const token of ["", await f.token("owner", "revoked-session")]) {
        const socket = f.connect(token);
        const [err] = await once(socket, "connect_error");
        assert.match(err.message, /Unauthorized/);
        socket.disconnect();
      }
    } finally {
      await f.close();
    }
  },
);
test(
  "Socket.IO derives rooms from database roles and never trusts a forged owner claim",
  { timeout: 10000 },
  async () => {
    const f = await fixture();
    const owner = f.connect(await f.token("owner")),
      customer = f.connect(await f.token("customer"));
    try {
      await Promise.all([once(owner, "connect"), once(customer, "connect")]);
      assert.equal(f.io.sockets.adapter.rooms.get("owners").size, 1);
      assert.equal(f.io.sockets.adapter.rooms.get("user:customer").size, 1);
      let customerSawOwnerEvent = false;
      customer.on("support:changed", () => (customerSawOwnerEvent = true));
      const ownerEvent = once(owner, "support:changed");
      f.io.to("owners").emit("support:changed");
      await ownerEvent;
      await new Promise((r) => setTimeout(r, 50));
      assert.equal(customerSawOwnerEvent, false);
      const customerEvent = once(customer, "support:changed");
      f.io.to("user:customer").emit("support:changed");
      await customerEvent;
      assert.equal(customerSawOwnerEvent, true);
    } finally {
      owner.disconnect();
      customer.disconnect();
      await f.close();
    }
  },
);
