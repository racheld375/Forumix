require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { default: mongoose } = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const corsoptions = require("./conpig/corsoptions");
const connectDB = require("./conpig/dbconn");
const Message = require("./models/Message");

const app = express();
const PORT = 7500;

connectDB();

app.use(express.json());
app.use(cors(corsoptions));
app.use(express.static("public"));

app.use("/Forumix/auth", require("./routes/auth"));
app.use("/Forumix/chat", require("./routes/chatRoutes"));
app.use("/Forumix/users", require("./routes/userRoute"));
app.use("/Forumix/discussions", require("./routes/discussionRoutes"));
app.use("/Forumix/comment", require("./routes/commentRoutes"));
app.use("/Forumix/category", require("./routes/categoryRoutes"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsoptions.origin,
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  socket.join(userId);

  console.log("User connected:", userId);

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
  });

  socket.on("markAsRead", async (conversationId) => {
    await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: socket.user.id }
      },
      { $push: { readBy: socket.user.id } }
    );
  });
});

mongoose.connection.once("open", () => {
  console.log("connected to db");
  server.listen(PORT, () => {
    console.log(`server is runing on port ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
});

module.exports = { io };

