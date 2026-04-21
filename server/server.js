require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const corsoptions = require("./conpig/corsoptions");
const connectDB = require("./conpig/dbconn");
const Message = require("./models/Message");

const app = express();
const PORT = 7500;
const LISTEN_RETRY_DELAY_MS = 1000;
const MAX_LISTEN_RETRIES = 10;
const FORCE_SHUTDOWN_TIMEOUT_MS = 1000;
let isShuttingDown = false;
let retryTimeout = null;

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

app.set("socketio", io);

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

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Shutting down server (${signal})...`);

  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }

  const forceExitTimer = setTimeout(() => {
    console.warn("Forcing process exit to release port.");
    process.exit(0);
  }, FORCE_SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  io.close();

  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }

  if (typeof server.closeAllConnections === "function") {
    server.closeAllConnections();
  }

  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  try {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Error while closing database connection:", err);
  }

  clearTimeout(forceExitTimer);

  if (signal === "SIGUSR2") {
    process.kill(process.pid, "SIGUSR2");
    return;
  }

  process.exit(0);
}

process.once("SIGINT", () => {
  shutdown("SIGINT").catch((err) => {
    console.error("Shutdown failed:", err);
    process.exit(1);
  });
});

process.once("SIGTERM", () => {
  shutdown("SIGTERM").catch((err) => {
    console.error("Shutdown failed:", err);
    process.exit(1);
  });
});

process.once("SIGUSR2", () => {
  shutdown("SIGUSR2").catch((err) => {
    console.error("Shutdown failed:", err);
    process.exit(1);
  });
});

function listenWithRetry(attempt = 0) {
  if (server.listening || isShuttingDown) return;

  const handleListening = () => {
    server.off("error", handleError);
    console.log(`Server running on port ${PORT}`);
  };

  const handleError = (err) => {
    server.off("listening", handleListening);

    if (err.code === "EADDRINUSE" && attempt < MAX_LISTEN_RETRIES) {
      const nextAttempt = attempt + 1;
      console.warn(
        `Port ${PORT} is still busy. Retrying in ${LISTEN_RETRY_DELAY_MS}ms (${nextAttempt}/${MAX_LISTEN_RETRIES})...`
      );

      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        listenWithRetry(nextAttempt);
      }, LISTEN_RETRY_DELAY_MS);
      return;
    }

    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is busy after ${MAX_LISTEN_RETRIES} retries.`);
      process.exit(1);
    }

    console.error(err);
    process.exit(1);
  };

  server.once("listening", handleListening);
  server.once("error", handleError);
  server.listen(PORT);
}

async function startServer() {
  await connectDB();

  if (!server.listening) {
    listenWithRetry();
  }
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
