"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoom = exports.getReceiverId = void 0;
const server_1 = require("../src/server");
const jwt_1 = require("./utils/jwt");
const users_model_1 = __importDefault(require("./models/users.model"));
const userSocketMap = {};
// export let io: Server; 
const getReceiverId = (receiverId) => {
    return userSocketMap[receiverId]?.values().next().value;
};
exports.getReceiverId = getReceiverId;
const getUserRoom = (userId) => `user:${userId}`;
exports.getUserRoom = getUserRoom;
const chatSocket = (serverInstance) => {
    //   io = new Server(serverInstance);
    server_1.io.use(async (socket, next) => {
        try {
            const authorization = socket.handshake.headers.authorization;
            const token = socket.handshake.auth?.token || (authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined);
            if (!token)
                return next(new Error('Authentication required'));
            const decoded = (0, jwt_1.verifyJWT)(token);
            const user = await users_model_1.default.findOne({ email: decoded.email.toLowerCase() }).select('_id isEmailVerified');
            if (!user || !user.isEmailVerified)
                return next(new Error('Authentication failed'));
            socket.data.userId = String(user._id);
            next();
        }
        catch (error) {
            next(new Error('Authentication failed'));
        }
    });
    server_1.io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        const userId = String(socket.data.userId);
        if (!userSocketMap[userId])
            userSocketMap[userId] = new Set();
        userSocketMap[userId].add(socket.id);
        socket.join((0, exports.getUserRoom)(userId));
        server_1.io.emit("getOnlineUsers", Object.keys(userSocketMap));
        socket.on("connect_error", (err) => console.error("Connection error:", err));
        socket.on("disconnect", () => {
            userSocketMap[userId]?.delete(socket.id);
            if (userSocketMap[userId]?.size === 0)
                delete userSocketMap[userId];
            server_1.io.emit("getOnlineUsers", Object.keys(userSocketMap));
            console.log("User disconnected:", socket.id);
        });
    });
};
exports.default = chatSocket;
