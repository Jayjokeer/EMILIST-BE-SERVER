"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceiverId = void 0;
const server_1 = require("../src/server");
const userSocketMap = {};
// export let io: Server; 
const getReceiverId = (receiverId) => {
    return userSocketMap[receiverId];
};
exports.getReceiverId = getReceiverId;
const chatSocket = (serverInstance) => {
    //   io = new Server(serverInstance);
    server_1.io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSocketMap[userId] = socket.id;
        }
        server_1.io.emit("getOnlineUsers", Object.keys(userSocketMap));
        socket.on("connect_error", (err) => console.error("Connection error:", err));
        socket.on("disconnect", () => {
            if (userId) {
                delete userSocketMap[userId];
                server_1.io.emit("getOnlineUsers", Object.keys(userSocketMap));
            }
            console.log("User disconnected:", socket.id);
        });
    });
};
exports.default = chatSocket;
