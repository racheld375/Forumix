import { io } from "socket.io-client";

const socket = io("http://localhost:7500", {
  autoConnect: false
});

export default socket;
