import { Server } from "socket.io";
import { jwtVerify } from "jose";
export function createSupportSocketServer(server, { origin, key, db }) {
  const io = new Server(server, {
    cors: { origin, credentials: true },
    allowRequest: (req, cb) => cb(null, req.headers.origin === origin),
  });
  io.use(async (socket, next) => {
    try {
      const { payload } = await jwtVerify(socket.handshake.auth.token, key, {
        issuer: "ovia-support",
        audience: "ovia-support-socket",
        algorithms: ["HS256"],
      });
      const session = await db
        .collection("sessions")
        .findOne({ id: payload.sessionId, userId: payload.sub });
      const user = await db.collection("users").findOne({ id: payload.sub });
      if (
        !session ||
        Date.parse(session.expiresAt) < Date.now() ||
        !user?.verifiedAt
      )
        throw new Error();
      const owner = ["ADMIN", "OWNER"].includes(
        (user.role || "").toUpperCase(),
      );
      socket.data.userId = user.id;
      socket.data.sessionId = session.id;
      socket.data.owner = owner;
      socket.data.exp = payload.exp;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });
  io.on("connection", (socket) => {
    socket.join(socket.data.owner ? "owners" : "user:" + socket.data.userId);
  });

  return io;
}
