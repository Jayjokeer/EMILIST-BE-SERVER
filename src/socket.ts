import { Server, Socket } from "socket.io";

const userSocketMap: Record<string, string> = {};
export let io: Server; 

export const getReceiverId = (receiverId: string): string | undefined => {
  return userSocketMap[receiverId];
};

const chatSocket = (serverInstance: any) => {
  io = new Server(serverInstance);

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    const userId: string | undefined = socket.handshake.query.userId as string;

    if (userId) {
      userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("newMessage", (message) => {
        console.log("Received new message:", message);
      });
    socket.on("disconnect", () => {
      if (userId) {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
      console.log("User disconnected:", socket.id);
    });
  });
};

export default chatSocket;
