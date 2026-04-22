require("dotenv").config()
const express=require("express")
const cors=require("cors")
const corsoptions=require("./conpig/corsoptions")
const app=express()
const connectDB=require("./conpig/dbconn")
const { default: mongoose } = require("mongoose")
connectDB()
const PORT =process.env.PORT|| 7000

app.use(express.json())

// import cors from "cors";
// app.use(cors());

app.use(cors(corsoptions))
app.use(express.static("public"))

app.use("/Forumix/chat", require("./routes/chatRoutes"));
app.use("/Forumix/users",require("./routes/userRoute"))
app.use("/Forumix/discussions",require("./routes/discussionRoutes"))
app.use("/Forumix/comment",require("./routes/commentRoutes"))
app.use("/Forumix/category",require("./routes/categoryRoutes"))
// app.use("/Forumix/auth",require("./routes/auth"))

mongoose.connection.once('open',err=>{
    console.log("connected to db")
    app.listen(PORT,()=>{
    console.log(`server is runing on port ${PORT}`)
    })
})

mongoose.connection.on('error',err=>{
    console.log(err)
})

//ניסוי בשביל הצאט מכאן

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");



const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

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

server.listen(5000, () => console.log("Server running"));

module.exports = { io };
