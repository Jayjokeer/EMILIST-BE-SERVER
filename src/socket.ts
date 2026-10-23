import { Server, Socket } from "socket.io";
import {io} from "../src/server";
import { verifyJWT } from "./utils/jwt";
import Users from "./models/users.model";

const userSocketMap: Record<string, Set<string>> = {};
// export let io: Server; 

export const getReceiverId = (receiverId: string): string | undefined => {
  return userSocketMap[receiverId]?.values().next().value;
};

export const getUserRoom = (userId: string) => `user:${userId}`;

const chatSocket = (serverInstance:any) => {
//   io = new Server(serverInstance);

  io.use(async (socket, next) => {
    try {
      const authorization = socket.handshake.headers.authorization;
      const token = socket.handshake.auth?.token || (authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined);
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyJWT(token);
      const user = await Users.findOne({ email: decoded.email.toLowerCase() }).select('_id isEmailVerified');
      if (!user || !user.isEmailVerified) return next(new Error('Authentication failed'));
      socket.data.userId = String(user._id);
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    const userId = String(socket.data.userId);
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
    socket.join(getUserRoom(userId));

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("connect_error", (err) => console.error("Connection error:", err));

    socket.on("disconnect", () => {
      userSocketMap[userId]?.delete(socket.id);
      if (userSocketMap[userId]?.size === 0) delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log("User disconnected:", socket.id);
    });
  });
};

export default chatSocket;
